import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "./prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { ResumeController } from "./resume.controller";
import { VacancyController } from "./vacancy.controller";

@Module({
  controllers: [HealthController, AuthController, ResumeController, VacancyController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
})
export class AppModule {}
