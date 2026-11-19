import "dotenv/config";
import "reflect-metadata";
import { createApp } from "./app-factory";

async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT || 4000);
  console.log(`Backend API running on http://localhost:${process.env.PORT || 4000}/api`);
}
bootstrap();
