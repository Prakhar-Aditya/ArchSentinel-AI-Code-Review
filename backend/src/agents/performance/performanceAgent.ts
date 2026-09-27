import { askGemini } from "../../services/gemini.js";
import type { ReviewFile } from "../../types/review.js";
import {
  AgentResultSchema,
  type AgentResult,
} from "../../schemas/agent.js";

export async function performanceAgent(
  files: ReviewFile[]
): Promise<AgentResult> {
  // Convert repository files into a file-aware,
  // line-numbered context for Gemini.
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
You are ArchSentinel Performance & Complexity Analysis Agent.

Your job is to analyze source code for performance problems,
algorithmic inefficiencies, scalability risks, and unnecessary
resource consumption.

Look specifically for:

- High time complexity
- High space complexity
- O(n²) or worse algorithms
- Unnecessary nested loops
- Repeated database queries
- Repeated API calls
- N+1 query patterns
- Unnecessary computation
- Excessive memory allocation
- Memory leaks
- Inefficient recursion
- Blocking operations
- Expensive string operations
- Missing caching opportunities
- Inefficient data structures
- Scalability bottlenecks
- Unnecessary repeated processing

IMPORTANT RULES:

1. Only report performance problems supported by the supplied code.
2. Do not invent performance issues.
3. Provide concrete evidence from the code.
4. Identify the correct file.
5. Identify the approximate line number.
6. Assign an appropriate severity.
7. Give a practical remediation recommendation.
8. Confidence must be between 0 and 1.
9. If there are no performance issues, return an empty findings array.
10. Return ONLY JSON.
11. Do NOT wrap the JSON in Markdown code fences.

FILE ATTRIBUTION RULES:

1. Every finding MUST identify the actual file containing the issue.
2. Use the FILE markers provided in the input.
3. The "file" field MUST contain the exact repository-relative path.
4. The "line" field MUST use the numbered lines within that file.
5. Line numbering starts at 1 for every file.
6. Never invent filenames.
7. Never use filenames from another file.
8. Never use generic filenames such as "performance-test.js"
   unless that exact file is actually supplied.
9. If you cannot confidently identify the file and line,
   do not create the finding.
10. The evidence must correspond to the reported file and line.
11. Do not treat FILE markers or line-number prefixes as source code.
12. Do not report a performance issue merely because code could
    theoretically be optimized. There must be a meaningful
    performance or scalability concern supported by the code.

Return JSON matching exactly this structure:

{
  "agent": "performance",
  "status": "completed",
  "summary": "short summary",
  "findings": [
    {
      "id": "PERF-001",
      "title": "Short performance issue title",
      "severity": "HIGH",
      "confidence": 0.95,
      "category": "Time Complexity",
      "file": "src/services/search.js",
      "line": 10,
      "description": "Description of the performance issue",
      "evidence": "Relevant code evidence",
      "impact": "Potential performance or scalability impact",
      "recommendation": "How to improve the implementation"
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
      "Performance Agent raw Gemini response:"
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
      "PERFORMANCE AGENT FAILED"
    );
    console.error(
      "================================="
    );
    console.error(error);

    return {
      agent: "performance",
      status: "failed",
      summary: `Performance analysis failed: ${
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