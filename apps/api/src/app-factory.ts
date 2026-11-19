import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import { AppModule } from "./modules/app.module";

export function assertProductionSecrets() {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)
  ) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production");
  }
}

export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());
  app.setGlobalPrefix("api");
}

export async function createApp() {
  assertProductionSecrets();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  return app;
}

export async function createExpressHandler(): Promise<Express> {
  const app = await createApp();
  await app.init();
  const expressApp: Express = app.getHttpAdapter().getInstance();
  return expressApp;
}
