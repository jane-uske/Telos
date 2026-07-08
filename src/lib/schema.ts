import { z } from "zod";

/** 简历数据 schema —— Zod 单一数据源,类型由它推导 */

export const basicsSchema = z.object({
  name: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  availability: z.string(),
  summary: z.string(),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  bullets: z.array(z.string()),
});

export const educationSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  major: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const skillGroupSchema = z.object({
  id: z.string(),
  category: z.string(),
  items: z.array(z.string()),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  link: z.string(),
  bullets: z.array(z.string()),
});

export const certificateSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
});

export const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string(),
});

export const awardSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string(),
  date: z.string(),
});

export const resumeSchema = z.object({
  basics: basicsSchema,
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  education: z.array(educationSchema),
  skills: z.array(skillGroupSchema),
  certificates: z.array(certificateSchema),
  languages: z.array(languageSchema),
  awards: z.array(awardSchema),
});

export type Resume = z.infer<typeof resumeSchema>;
