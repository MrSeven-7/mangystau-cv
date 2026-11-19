import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";

@Controller()
export class HealthController {
  @Get()
  getRoot() {
    return {
      status: "ok",
      service: "mangystau-cv-api",
      web: "http://localhost:3000",
      endpoints: [
        "/api/vacancies",
        "/api/admin/vacancies",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/me",
        "/api/health",
      ],
    };
  }

  @Get("health")
  getHealth() {
    return { status: "ok", service: "mangystau-cv-api" };
  }
}
