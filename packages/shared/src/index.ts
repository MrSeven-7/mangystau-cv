import { z } from "zod";

const dateRangeSchema = z.object({ startDate: z.string().default(""), endDate: z.string().default(""), current: z.boolean().default(false) });
export const resumeSchema = z.object({
  fullName: z.string().max(120).default(""),
  headline: z.string().max(160).default(""),
  city: z.string().max(100).default("Актау"),
  phone: z.string().max(40).default(""),
  email: z.string().email().or(z.literal("")).default(""),
  about: z.string().max(2000).default(""),
  readyForRotation: z.boolean().default(false),
  readyToRelocate: z.boolean().default(false),
  driverCategories: z.array(z.string()).default([]),
  languages: z.array(z.object({ name: z.string(), level: z.string() })).default([]),
  experience: z.array(z.object({ company: z.string(), position: z.string(), description: z.string() }).merge(dateRangeSchema)).default([]),
  education: z.array(z.object({ institution: z.string(), degree: z.string(), description: z.string() }).merge(dateRangeSchema)).default([]),
  skills: z.array(z.string()).default([]),
});
export type ResumeData = z.infer<typeof resumeSchema>;
export const registerSchema = z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(6), role: z.enum(["SEEKER", "EMPLOYER"]).default("SEEKER") });
export const vacancyFilterSchema = z.object({ industry: z.string().optional(), city: z.string().optional(), salaryFrom: z.coerce.number().optional(), schedule: z.string().optional(), q: z.string().optional() });
