import { askGemini } from "../../services/gemini.js";

import {
  SynthesisResultSchema,
  type SynthesisResult,
} from "../../schemas/synthesis.js";
import {
  type AgentResult,
} from "../../schemas/agent.js";


export async function reviewSynthesis(
  results: AgentResult[]
): Promise<SynthesisResult> {

  const combinedFindings = results.flatMap(
    (result) => result.findings
  );

  const prompt = `
You are ArchSentinel Review Synthesis Engine.

You receive findings from multiple specialist code-review
agents.

Your job is to transform these findings into ONE clean,
consistent and prioritized code-review report.

SPECIALIST AGENTS:

${results
  .map(
    (result) => `
AGENT: ${result.agent}

SUMMARY:
${result.summary}

FINDINGS:
${JSON.stringify(result.findings, null, 2)}
`
  )
  .join("\n")}


YOUR RESPONSIBILITIES:

1. Review all specialist findings.

2. Identify duplicate or overlapping findings.

3. Remove duplicate findings.

4. Do NOT remove a finding merely because another agent
   reported something similar if they represent genuinely
   different problems.

5. Preserve findings that are supported by the supplied
   evidence.

6. Preserve the severity assigned by the specialist agent unless
   there is strong evidence in the supplied findings that the
   severity is incorrect.

7. Do NOT escalate severity simply because an issue sounds serious.

8. When duplicate findings are merged, use the highest severity
   already assigned by the specialist agents.

9. Do not invent a new severity level.

10. Preserve confidence scores unless there is a clear reason
    supported by the supplied evidence to adjust them.

11. Count the final number of unique findings.

12. Produce a concise overall summary.

IMPORTANT EVIDENCE RULES:

- Base every finding strictly on the supplied specialist findings.
- Do not exaggerate the impact.
- Do not introduce attack scenarios that are not supported by
  the evidence.
- Distinguish between "could potentially lead to" and
  "will definitely cause".
- Preserve uncertainty when the specialist findings contain it.

Return ONLY valid JSON.

Return exactly this structure:

{
  "agent": "review-synthesis",
  "status": "completed",
  "summary": "Overall review summary",
  "overallRisk": "HIGH",
  "totalFindings": 3,
  "findings": [
    {
      "id": "SEC-001",
      "title": "SQL Injection",
      "severity": "HIGH",
      "confidence": 0.95,
      "category": "SQL Injection",
      "file": "security-test.js",
      "line": 3,
      "description": "Description",
      "evidence": "Evidence",
      "impact": "Impact",
      "recommendation": "Recommendation"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}
`;

  try {

    console.log("Review Synthesis Engine started.");

    const rawResult = await askGemini(prompt);
    if (!rawResult) {
        throw new Error(
            "Gemini returned an empty response."
         );
    }

    console.log("Review Synthesis raw Gemini response:");
    console.log(rawResult);

    const cleanedResult = rawResult
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedResult);

    const validated =
      SynthesisResultSchema.parse(parsed);

    return validated;

  } catch (error) {

    console.error(
      "Review Synthesis Engine failed:",
      error
    );

    return {
      agent: "review-synthesis",
      status: "failed",
      summary: `Review synthesis failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
      overallRisk: "LOW",
      totalFindings: combinedFindings.length,
      findings: combinedFindings,
      recommendations: [],
    };
  }
}