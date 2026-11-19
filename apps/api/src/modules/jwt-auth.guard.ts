import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { verify, type JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user: { id: string; role: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException();

    try {
      const payload = verify(
        authorization.slice(7),
        process.env.JWT_ACCESS_SECRET || "development-access-secret-change-me",
      ) as JwtPayload;
      if (typeof payload.sub !== "string" || typeof payload.role !== "string") throw new UnauthorizedException();
      request.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException("Сессия истекла, войдите снова");
    }
  }
}