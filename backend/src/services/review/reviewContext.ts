import type { RepositoryFile } from "../repository/repositoryService.js";
import type { ReviewFile } from "../../types/review.js";


export interface ReviewContext {
  files: ReviewFile[];
  combinedCode: string;
}

export function buildReviewContext(
  files: RepositoryFile[]
): ReviewContext {

  const reviewFiles: ReviewFile[] = files.map(
    (file) => ({
      path: file.path,
      language: file.language,
      content: file.content,
    })
  );

  const combinedCode = reviewFiles
    .map((file) => {
      return `
===== FILE: ${file.path} =====
LANGUAGE: ${file.language}

${file.content}

===== END FILE =====
`;
    })
    .join("\n");

  return {
    files: reviewFiles,
    combinedCode,
  };
}