import { askGemini } from "../../services/gemini.js";
import type { ReviewFile } from "../../types/review.js";
import {
  AgentResultSchema,
  type AgentResult,
} from "../../schemas/agent.js";

export async function securityAgent(
  files: ReviewFile[]
): Promise<AgentResult> {
  // Convert structured repository files into a readable context.
  // Line numbers restart at 1 for every file.
  const code = files
    .map((file) => {
      const numberedCode = file.content
        .split(/\r?\n/)
        .map(
          (line, index) =>
            `${index + 1}: ${line}`
        )
        .join("\n");

      return `
===== FILE: ${file.path} =====
LANGUAGE: ${file.language}

${numberedCode}

===== END FILE =====
`;
    })
    .join("\n");

  const prompt = `
You are ArchSentinel Security & Risk Analysis Agent.

Your job is to analyze source code for security vulnerabilities
and application security risks.

Look specifically for:

- SQL Injection
- Cross-Site Scripting (XSS)
- Server-Side Request Forgery (SSRF)
- Hardcoded secrets
- API keys or credentials
- Broken authentication
- Broken authorization
- Broken Object Level Authorization (BOLA/IDOR)
- Command injection
- Path traversal
- Insecure deserialization
- Unsafe use of eval or equivalent mechanisms
- Sensitive information exposure

IMPORTANT RULES:

1. Only report vulnerabilities supported by the supplied code.
2. Do not invent vulnerabilities.
3. Provide concrete evidence from the code.
4. Identify the correct line number.
5. Assign an appropriate severity.
6. Give a practical remediation recommendation.
7. Confidence must be between 0 and 1.
8. If there are no security issues, return an empty findings array.
9. Return ONLY JSON.
10. Do NOT wrap the JSON in Markdown code fences.

FILE ATTRIBUTION RULES:

1. Every finding MUST identify the actual file containing the issue.
2. Use the FILE markers provided in the input.
3. The "file" field MUST contain the exact repository-relative path.
4. The "line" field MUST use the numbered lines within that file.
5. Line numbering starts at 1 for each file.
6. Never invent filenames or line numbers.
7. Do not use a filename from a different file.
8. If you cannot confidently identify the file and line,
   do not create the finding.
9. The evidence must correspond to the reported file and line.
10. Do not treat FILE markers or line-number prefixes as source code.

Return JSON matching exactly this structure:

{
  "agent": "security",
  "status": "completed",
  "summary": "short summary",
  "findings": [
    {
      "id": "SEC-001",
      "title": "Short vulnerability title",
      "severity": "HIGH",
      "confidence": 0.95,
      "category": "SQL Injection",
      "file": "src/controllers/userController.js",
      "line": 3,
      "description": "Description of the vulnerability",
      "evidence": "Relevant code evidence",
      "impact": "Potential security impact",
      "recommendation": "How to fix it"
    }
  ]
}

The filename in the example is illustrative only.

Use actual filenames from the supplied repository.

SOURCE CODE:

${code}
`;

  try {
    const rawResult = await askGemini(prompt);

    if (!rawResult) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    console.log(
      "Security Agent raw Gemini response:"
    );
    console.log(rawResult);

    // Remove Markdown code fences if Gemini still returns them.
    const cleanedResult = rawResult
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedResult);

    // The application determines which files were actually examined.
    // Gemini does not control this information.
    const resultWithFiles = {
      ...parsed,
      examinedFiles: files.map((file) => ({
        path: file.path,
        language: file.language,
      })),
    };

    const validated =
      AgentResultSchema.parse(
        resultWithFiles
      );

    return validated;
  } catch (error) {
    console.error(
      "================================="
    );
    console.error(
      "SECURITY AGENT FAILED"
    );
    console.error(
      "================================="
    );
    console.error(error);

    return {
      agent: "security",
      status: "failed",
      summary: `Security analysis failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
      examinedFiles: files.map((file) => ({
        path: file.path,
        language: file.language,
      })),
      findings: [],
    };
  }
}