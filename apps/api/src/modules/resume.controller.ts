import { BadRequestException, Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { resumeSchema } from "./schemas";
import { PrismaService } from "./prisma.service";
import { AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard";

const templateIds = ["classic", "sidebar", "editorial", "minimal"] as const;

@Controller("resumes")
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("latest")
  latest(@Req() request: AuthenticatedRequest) {
    return this.prisma.resume.findFirst({
      where: { userId: request.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, templateId: true, theme: true, data: true, updatedAt: true },
    });
  }

  @Put("latest")
  async saveLatest(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    if (!body || typeof body !== "object") throw new BadRequestException("Некорректные данные резюме");
    const input = body as Record<string, unknown>;
    const parsed = resumeSchema.safeParse(input.data);
    const templateId = input.templateId ?? "classic";
    const accent = input.accent ?? "#147d64";
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    if (typeof templateId !== "string" || !templateIds.some((id) => id === templateId)) throw new BadRequestException("Неизвестный шаблон");
    if (typeof accent !== "string" || !/^#[0-9a-fA-F]{6}$/.test(accent)) throw new BadRequestException("Некорректный цвет шаблона");
    const selectedTemplateId = templateId as (typeof templateIds)[number];

    const latest = await this.prisma.resume.findFirst({
      where: { userId: request.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const values = {
      title: parsed.data.headline || parsed.data.fullName || "Моё резюме",
      templateId: selectedTemplateId,
      theme: { accent, font: "Inter" },
      data: parsed.data as Prisma.InputJsonValue,
    };

    if (latest) {
      return this.prisma.resume.update({
        where: { id: latest.id },
        data: values,
        select: { id: true, title: true, templateId: true, theme: true, data: true, updatedAt: true },
      });
    }

    return this.prisma.resume.create({
      data: { ...values, userId: request.user.id },
      select: { id: true, title: true, templateId: true, theme: true, data: true, updatedAt: true },
    });
  }
}