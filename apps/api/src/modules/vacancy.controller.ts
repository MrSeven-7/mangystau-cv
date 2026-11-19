import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ModerationStatus, WorkSchedule } from "@prisma/client";

function mapSchedule(schedule?: string): WorkSchedule {
  if (!schedule) return WorkSchedule.FULL_TIME;
  switch (schedule.toLowerCase()) {
    case "rotational":
    case "вахта":
    case "вахтовый":
      return WorkSchedule.ROTATIONAL;
    case "shift":
    case "сменный":
      return WorkSchedule.SHIFT;
    case "remote":
    case "удаленная":
    case "удаленка":
      return WorkSchedule.REMOTE;
    case "parttime":
    case "part_time":
    case "частичная":
      return WorkSchedule.PART_TIME;
    case "fulltime":
    case "full_time":
    default:
      return WorkSchedule.FULL_TIME;
  }
}

function formatVacancy(v: any) {
  return {
    id: v.id,
    title: v.title,
    company: v.company?.name || "Компания",
    companyDescription: v.company?.description || "",
    city: v.city,
    industry: v.industry?.slug || "oil",
    salary: v.salary || (v.salaryFrom ? `${v.salaryFrom.toLocaleString()} ₸` : "По договоренности"),
    salaryFrom: v.salaryFrom,
    salaryTo: v.salaryTo,
    schedule: v.schedule ? v.schedule.toLowerCase() : "fulltime",
    experience: v.experience || "Без опыта",
    description: v.description,
    responsibilities: v.responsibilities || [],
    requirements: v.requirements || [],
    conditions: v.conditions || [],
    contacts: {
      name: v.contactName || "",
      phone: v.contactPhone || "",
      email: v.contactEmail || "",
    },
    moderationStatus: v.moderationStatus,
    moderationComment: v.moderationComment,
    isActive: v.isActive,
    publishedAt: v.publishedAt?.toISOString?.() || v.publishedAt,
    createdAt: v.createdAt?.toISOString?.() || v.createdAt,
  };
}

@Controller()
export class VacancyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("vacancies")
  async getPublicVacancies(
    @Query("q") q?: string,
    @Query("city") city?: string,
    @Query("industry") industry?: string,
    @Query("schedule") schedule?: string
  ) {
    try {
      const where: any = {
        moderationStatus: ModerationStatus.APPROVED,
        isActive: true,
      };

      if (city && city !== "all") {
        where.city = { equals: city, mode: "insensitive" };
      }

      if (industry && industry !== "all") {
        where.industry = { slug: industry };
      }

      if (q && q.trim()) {
        const queryText = q.trim();
        where.OR = [
          { title: { contains: queryText, mode: "insensitive" } },
          { description: { contains: queryText, mode: "insensitive" } },
          { company: { name: { contains: queryText, mode: "insensitive" } } },
        ];
      }

      const list = await this.prisma.vacancy.findMany({
        where,
        include: { company: true, industry: true },
        orderBy: { publishedAt: "desc" },
      });

      return list.map(formatVacancy);
    } catch (e) {
      console.error("Failed to fetch public vacancies from DB:", e);
      return [];
    }
  }

  @Get("vacancies/:id")
  async getVacancyById(@Param("id") id: string) {
    try {
      const vacancy = await this.prisma.vacancy.findUnique({
        where: { id },
        include: { company: true, industry: true },
      });
      if (!vacancy) throw new NotFoundException("Вакансия не найдена");
      return formatVacancy(vacancy);
    } catch (e) {
      throw new NotFoundException("Вакансия не найдена");
    }
  }

  @Post("vacancies")
  async createVacancy(@Body() body: any) {
    try {
      // 1. Resolve Industry
      const industrySlug = body.industry || "oil";
      let industry = await this.prisma.industry.findUnique({
        where: { slug: industrySlug },
      });
      if (!industry) {
        industry = await this.prisma.industry.findFirst();
      }

      // 2. Resolve Company
      const companyName = body.company?.trim() || "Работодатель Мангистау";
      let company = await this.prisma.company.findFirst({
        where: { name: companyName },
      });

      if (!company) {
        // Find an admin or employer user to attach
        let owner = await this.prisma.user.findFirst({
          where: { role: { in: ["ADMIN", "EMPLOYER"] } },
        });
        if (!owner) {
          owner = await this.prisma.user.findFirst();
        }

        if (owner) {
          company = await this.prisma.company.create({
            data: {
              name: companyName,
              city: body.city || "aktau",
              description: body.companyDescription || "",
              ownerId: owner.id,
            },
          });
        }
      }

      if (!company || !industry) {
        throw new BadRequestException("Не удалось определить компанию или сферу деятельности");
      }

      const moderationStatus =
        body.moderationStatus === "APPROVED"
          ? ModerationStatus.APPROVED
          : ModerationStatus.PENDING;

      const newVacancy = await this.prisma.vacancy.create({
        data: {
          title: body.title || "Новая вакансия",
          description: body.description || "",
          companyId: company.id,
          industryId: industry.id,
          city: body.city || "aktau",
          salary: body.salary || null,
          salaryFrom: body.salaryFrom ? Number(body.salaryFrom) : null,
          salaryTo: body.salaryTo ? Number(body.salaryTo) : null,
          schedule: mapSchedule(body.schedule),
          experience: body.experience || "Без опыта",
          responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
          requirements: Array.isArray(body.requirements) ? body.requirements : [],
          conditions: Array.isArray(body.conditions) ? body.conditions : [],
          contactName: body.contacts?.name || body.contactName || null,
          contactPhone: body.contacts?.phone || body.contactPhone || null,
          contactEmail: body.contacts?.email || body.contactEmail || null,
          moderationStatus,
          isActive: moderationStatus === ModerationStatus.APPROVED,
        },
        include: { company: true, industry: true },
      });

      return formatVacancy(newVacancy);
    } catch (e: any) {
      console.error("Error creating vacancy:", e);
      throw new BadRequestException(e.message || "Ошибка при сохранении вакансии в БД");
    }
  }

  @Get("admin/vacancies")
  async getAdminVacancies() {
    try {
      const vacancies = await this.prisma.vacancy.findMany({
        include: { company: true, industry: true },
        orderBy: { createdAt: "desc" },
      });
      return vacancies.map(formatVacancy);
    } catch (e) {
      console.error("Failed to fetch admin vacancies from DB:", e);
      return [];
    }
  }

  @Patch("admin/vacancies/:id/moderate")
  async moderateVacancy(
    @Param("id") id: string,
    @Body() body: { status: ModerationStatus; comment?: string }
  ) {
    try {
      const updated = await this.prisma.vacancy.update({
        where: { id },
        data: {
          moderationStatus: body.status,
          moderationComment: body.comment !== undefined ? body.comment : undefined,
          isActive: body.status === ModerationStatus.APPROVED,
          publishedAt: body.status === ModerationStatus.APPROVED ? new Date() : undefined,
        },
        include: { company: true, industry: true },
      });
      return formatVacancy(updated);
    } catch (e: any) {
      console.error("Error updating moderation status:", e);
      throw new BadRequestException("Ошибка обновления статуса модерации в БД");
    }
  }

  @Delete("admin/vacancies/:id")
  async deleteVacancyAdmin(@Param("id") id: string) {
    try {
      await this.prisma.vacancy.delete({
        where: { id },
      });
      return { ok: true, id };
    } catch (e) {
      return { ok: false, error: "Vacancy not found" };
    }
  }

  @Delete("vacancies/:id")
  async deleteVacancyPublic(@Param("id") id: string) {
    return this.deleteVacancyAdmin(id);
  }
}
