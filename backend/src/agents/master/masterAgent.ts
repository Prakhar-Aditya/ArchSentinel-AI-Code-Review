import { securityAgent } from "../security/securityAgent.js";
import { performanceAgent } from "../performance/performanceAgent.js";
import { logicAgent } from "../logic/logicAgent.js";
import { reviewSynthesis } from "../synthesis/reviewSynthesis.js";

import { emitReviewEvent } from "../../services/events/reviewEvents.js";

import type { ReviewFile } from "../../types/review.js";

export async function masterAgent(
  files: ReviewFile[]
) {
  console.log("=================================");
  console.log("MASTER AGENT STARTED");
  console.log("=================================");

  emitReviewEvent({
    type: "master",
    status: "started",
    message: "Master Agent started repository analysis.",
  });

  console.log(
    `Received ${files.length} repository files.`
  );

  console.log(
    "Distributing files to specialist agents..."
  );

  /*
   * Security Agent
   */
  const runSecurityAgent = async () => {
    emitReviewEvent({
      type: "security",
      status: "started",
      message: "Security Agent started security analysis.",
    });

    try {
      const result = await securityAgent(files);

      emitReviewEvent({
        type: "security",
        status:
          result.status === "completed"
            ? "completed"
            : "failed",
        message:
          result.status === "completed"
            ? `Security Agent completed with ${result.findings.length} finding(s).`
            : "Security Agent failed during analysis.",
      });

      return result;
    } catch (error) {
      emitReviewEvent({
        type: "security",
        status: "failed",
        message: "Security Agent encountered an error.",
      });

      throw error;
    }
  };

  /*
   * Performance Agent
   */
  const runPerformanceAgent = async () => {
    emitReviewEvent({
      type: "performance",
      status: "started",
      message:
        "Performance Agent started performance analysis.",
    });

    try {
      const result = await performanceAgent(files);

      emitReviewEvent({
        type: "performance",
        status:
          result.status === "completed"
            ? "completed"
            : "failed",
        message:
          result.status === "completed"
            ? `Performance Agent completed with ${result.findings.length} finding(s).`
            : "Performance Agent failed during analysis.",
      });

      return result;
    } catch (error) {
      emitReviewEvent({
        type: "performance",
        status: "failed",
        message:
          "Performance Agent encountered an error.",
      });

      throw error;
    }
  };

  /*
   * Logic Agent
   */
  const runLogicAgent = async () => {
    emitReviewEvent({
      type: "logic",
      status: "started",
      message:
        "Logic Agent started logic and edge-case analysis.",
    });

    try {
      const result = await logicAgent(files);

      emitReviewEvent({
        type: "logic",
        status:
          result.status === "completed"
            ? "completed"
            : "failed",
        message:
          result.status === "completed"
            ? `Logic Agent completed with ${result.findings.length} finding(s).`
            : "Logic Agent failed during analysis.",
      });

      return result;
    } catch (error) {
      emitReviewEvent({
        type: "logic",
        status: "failed",
        message:
          "Logic Agent encountered an error.",
      });

      throw error;
    }
  };

  /*
   * Run specialist agents in parallel.
   */
  const [
    securityResult,
    performanceResult,
    logicResult,
  ] = await Promise.all([
    runSecurityAgent(),
    runPerformanceAgent(),
    runLogicAgent(),
  ]);

  console.log(
    "All specialist agents completed."
  );

  const specialistResults = [
    securityResult,
    performanceResult,
    logicResult,
  ];

  console.log(
    "================================="
  );

  console.log(
    "SPECIALIST RESULTS"
  );

  console.log(
    `Security findings: ${securityResult.findings.length}`
  );

  console.log(
    `Performance findings: ${performanceResult.findings.length}`
  );

  console.log(
    `Logic findings: ${logicResult.findings.length}`
  );

  console.log(
    "================================="
  );

  /*
   * Review Synthesis Engine
   */
  emitReviewEvent({
    type: "synthesis",
    status: "started",
    message:
      "Review Synthesis Engine started aggregating specialist findings.",
  });

  console.log(
    "Sending specialist findings to Review Synthesis Engine..."
  );

  let synthesisResult;

  try {
    synthesisResult =
      await reviewSynthesis(specialistResults);

    emitReviewEvent({
      type: "synthesis",
      status:
        synthesisResult.status === "completed"
          ? "completed"
          : "failed",
      message:
        synthesisResult.status === "completed"
          ? `Review Synthesis Engine completed with ${synthesisResult.findings.length} final finding(s).`
          : "Review Synthesis Engine failed.",
    });
  } catch (error) {
    emitReviewEvent({
      type: "synthesis",
      status: "failed",
      message:
        "Review Synthesis Engine encountered an error.",
    });

    throw error;
  }

  console.log(
    "Review Synthesis Engine completed."
  );

  console.log(
    `Final findings: ${synthesisResult.findings.length}`
  );

  emitReviewEvent({
    type: "master",
    status: "completed",
    message:
      "Master Agent completed the complete repository review.",
  });

  return {
    agent: "master",
    status: "completed",
    specialistResults,
    synthesis: synthesisResult,
  };
}