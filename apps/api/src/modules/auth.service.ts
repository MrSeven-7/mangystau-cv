import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { hash, verify } from "argon2";
import { randomBytes, createHash } from "node:crypto";
import { sign, verify as verifyJwt } from "jsonwebtoken";
import { PrismaService } from "./prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  private digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
  private tokens(user: { id: string; role: Role }) {
    const accessToken = sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET || "development-access-secret-change-me", { expiresIn: "15m" });
    const refreshToken = randomBytes(48).toString("base64url");
    const refreshJwt = sign({ sub: user.id, token: refreshToken }, process.env.JWT_REFRESH_SECRET || "development-refresh-secret-change-me", { expiresIn: "30d" });
    return { accessToken, refreshJwt, refreshHash: this.digest(refreshToken) };
  }
  async register(input: { fullName: string; email: string; password: string; role: "SEEKER" | "EMPLOYER" }) {
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException("Этот email уже зарегистрирован");
    const created = await this.prisma.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash: await hash(input.password),
        role: input.role === "EMPLOYER" ? Role.EMPLOYER : Role.SEEKER,
      },
    });
    return this.issue(created);
  }
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) throw new UnauthorizedException("Неверный email или пароль");

    let passwordMatches = false;
    if (user.passwordHash.startsWith("$argon2")) {
      try {
        passwordMatches = await verify(user.passwordHash, password);
      } catch {}
    } else if (user.passwordHash === password) {
      passwordMatches = true;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hash(password) },
      });
    }

    if (!passwordMatches) throw new UnauthorizedException("Неверный email или пароль");
    return this.issue(user);
  }
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, avatarUrl: true, bannerUrl: true },
    });
    if (!user) throw new NotFoundException("Профиль не найден");
    return user;
  }
  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string | null; bannerUrl?: string | null }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, avatarUrl: true, bannerUrl: true },
    });
  }
  async updateProfileMedia(userId: string, media: { avatarUrl?: string | null; bannerUrl?: string | null }) {
    return this.updateProfile(userId, media);
  }
  private async issue(user: { id: string; fullName: string; email: string; role: Role }) {
    const tokens = this.tokens(user);
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: tokens.refreshHash } });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshJwt, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } };
  }
  async refresh(token: string) {
    try {
      const payload = verifyJwt(token, process.env.JWT_REFRESH_SECRET || "development-refresh-secret-change-me") as { sub: string; token: string };
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.refreshTokenHash || user.refreshTokenHash !== this.digest(payload.token)) throw new UnauthorizedException();
      return this.issue(user);
    } catch { throw new UnauthorizedException("Сессия истекла, войдите снова"); }
  }
  async logout(userId?: string) { if (userId) await this.prisma.user.updateMany({ where: { id: userId }, data: { refreshTokenHash: null } }); return { ok: true }; }
}
