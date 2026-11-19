import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import { AppModule } from "./modules/app.module";

export async function createApp() {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
  ) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production");
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  return app;
}

export async function createExpressHandler(): Promise<Express> {
  const app = await createApp();
  await app.init();
  const expressApp: Express = app.getHttpAdapter().getInstance();
  return expressApp;
}
