import { BadRequestException, Body, Controller, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { registerSchema } from "./schemas";
import { AuthService } from "./auth.service";
import { verify } from "jsonwebtoken";
import { AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) { return this.auth.getProfile(req.user.id); }
  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    if (!body || typeof body !== "object") throw new BadRequestException("Некорректные данные профиля");
    const values = body as Record<string, unknown>;
    const updates: { fullName?: string; avatarUrl?: string | null; bannerUrl?: string | null } = {};
    if (values.fullName !== undefined) {
      if (typeof values.fullName !== "string" || values.fullName.trim().length < 2 || values.fullName.trim().length > 120) {
        throw new BadRequestException("Имя должно содержать от 2 до 120 символов");
      }
      updates.fullName = values.fullName.trim();
    }
    for (const field of ["avatarUrl", "bannerUrl"] as const) {
      const value = values[field];
      if (value === undefined) continue;
      if (value !== null && (typeof value !== "string" || value.length > 90_000 || !/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))) {
        throw new BadRequestException(`Некорректное изображение: ${field}`);
      }
      updates[field] = value as string | null;
    }
    if (Object.keys(updates).length === 0) throw new BadRequestException("Не переданы поля профиля для обновления");
    return this.auth.updateProfile(req.user.id, updates);
  }
  private cookie(res: Response, token: string) { res.cookie("refreshToken", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth", maxAge: 30 * 24 * 60 * 60 * 1000 }); }
  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.flatten());
    const result = await this.auth.register(parsed.data); this.cookie(res, result.refreshToken); return { accessToken: result.accessToken, user: result.user };
  }
  @Post("login")
  async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email, body.password); this.cookie(res, result.refreshToken); return { accessToken: result.accessToken, user: result.user };
  }
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken; if (!token) throw new UnauthorizedException();
    const result = await this.auth.refresh(token); this.cookie(res, result.refreshToken); return { accessToken: result.accessToken, user: result.user };
  }
  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let userId: string | undefined; const authorization=req.headers.authorization;
    if (authorization?.startsWith("Bearer ")) { try { userId=(verify(authorization.slice(7),process.env.JWT_ACCESS_SECRET||"development-access-secret-change-me") as {sub:string}).sub; } catch {} }
    await this.auth.logout(userId); res.clearCookie("refreshToken", { path: "/api/auth" }); return { ok: true };
  }
}
