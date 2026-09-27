import { z } from "zod";

export const SeveritySchema = z.enum([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
]);

export const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: SeveritySchema,
  confidence: z.number().min(0).max(1),
  category: z.string(),
  file: z.string(),
  line: z.number().int().positive(),
  description: z.string(),
  evidence: z.string(),
  impact: z.string(),
  recommendation: z.string(),
});

export const ExaminedFileSchema = z.object({
  path: z.string(),
  language: z.string(),
});

export const AgentResultSchema = z.object({
  agent: z.string(),
  status: z.enum([
    "completed",
    "failed",
  ]),
  summary: z.string(),

  examinedFiles: z.array(
    ExaminedFileSchema
  ),

  findings: z.array(FindingSchema),
});

export type Finding = z.infer<
  typeof FindingSchema
>;

export type ExaminedFile = z.infer<
  typeof ExaminedFileSchema
>;

export type AgentResult = z.infer<
  typeof AgentResultSchema
>;