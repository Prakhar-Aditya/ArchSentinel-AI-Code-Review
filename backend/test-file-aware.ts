import {
  loadRepositoryFiles,
} from "./src/services/repository/repositoryService.js";

import {
  buildReviewContext,
} from "./src/services/review/reviewContext.js";

import {
  masterAgent,
} from "./src/agents/master/masterAgent.js";

async function testFileAwareReview() {

  console.log("=================================");
  console.log("FILE-AWARE REVIEW TEST");
  console.log("=================================");

  const repositoryPath = "../demo-repo";

  const files =
    await loadRepositoryFiles(repositoryPath);

  console.log(
    `Loaded ${files.length} files.`
  );

  for (const file of files) {
    console.log(
      `- ${file.path} (${file.language})`
    );
  }

  const reviewContext =
    buildReviewContext(files);

  const result =
    await masterAgent(reviewContext.files);

  console.log("\n=================================");
  console.log("FINAL REVIEW RESULT");
  console.log("=================================");

  console.log(
    JSON.stringify(result, null, 2)
  );
}

testFileAwareReview();