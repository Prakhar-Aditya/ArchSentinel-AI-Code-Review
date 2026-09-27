import { z } from "zod";

import { FindingSchema } from "./agent.js";

export const SynthesisResultSchema = z.object({
  agent: z.literal("review-synthesis"),
  status: z.enum([
    "completed",
    "failed",
  ]),

  summary: z.string(),

  overallRisk: z.enum([
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
  ]),

  totalFindings: z.number().int().nonnegative(),

  findings: z.array(FindingSchema),

  recommendations: z.array(
    z.string()
  ),
});

export type SynthesisResult =
  z.infer<typeof SynthesisResultSchema>;