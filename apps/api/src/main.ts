import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";
import { assertProductionSecrets, configureApp } from "./app-factory";

async function bootstrap() {
  assertProductionSecrets();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(process.env.PORT || 4000);
  console.log(`Backend API running on http://localhost:${process.env.PORT || 4000}/api`);
}
bootstrap();
