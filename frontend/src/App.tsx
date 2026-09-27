import { useState } from "react";

type Finding = {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  category: string;
  file: string;
  line: number;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
};

type ExaminedFile = {
  path: string;
  language: string;
};

type SpecialistResult = {
  agent: string;
  status: string;
  summary: string;
  examinedFiles: ExaminedFile[];
  findings: Finding[];
};

type ReviewResult = {
  agent: string;
  status: string;
  specialistResults: SpecialistResult[];
  synthesis: {
    agent: string;
    status: string;
    summary: string;
    overallRisk:
      | "CRITICAL"
      | "HIGH"
      | "MEDIUM"
      | "LOW";
    totalFindings: number;
    findings: Finding[];
    recommendations: string[];
  };
};

type ReviewResponse = {
  success: boolean;
  repository?: {
    fileCount: number;
    files: {
      path: string;
      language: string;
    }[];
  };
  result?: ReviewResult;
  error?: string;
};

type AgentStage =
  | "idle"
  | "repository"
  | "master"
  | "security"
  | "performance"
  | "logic"
  | "synthesis"
  | "completed"
  | "failed";

type ReviewEvent = {
  type:
    | "connection"
    | "repository"
    | "master"
    | "security"
    | "performance"
    | "logic"
    | "synthesis"
    | "completed"
    | "failed";

  status:
    | "started"
    | "running"
    | "completed"
    | "failed";

  message: string;
  timestamp: string;
};

function App() {
  const [reviewMode, setReviewMode] =
    useState<"repository" | "code">(
      "repository"
    );

  const [repositoryUrl, setRepositoryUrl] =
    useState("");

  const [codeFileName, setCodeFileName] =
    useState("example.py");

  const [codeLanguage, setCodeLanguage] =
    useState("python");

  const [codeContent, setCodeContent] =
    useState("");

  const [review, setReview] =
    useState<ReviewResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [stage, setStage] =
    useState<AgentStage>("idle");

  const [liveEvents, setLiveEvents] =
    useState<ReviewEvent[]>([]);

  async function analyzeRepository() {
    if (!repositoryUrl.trim()) {
      setError(
        "Please enter a GitHub repository URL."
      );
      return;
    }

    setLoading(true);
    setError("");
    setReview(null);
    setStage("idle");
    setLiveEvents([]);

    let eventSource: EventSource | null =
      null;

    try {
      /*
       * =====================================================
       * OPEN SSE CONNECTION FIRST
       * =====================================================
       */

      eventSource = new EventSource(
        "http://localhost:4000/api/review/events"
      );

      /*
       * =====================================================
       * RECEIVE REAL-TIME BACKEND EVENTS
       * =====================================================
       */

      eventSource.onmessage = (event) => {
        try {
          const reviewEvent: ReviewEvent =
            JSON.parse(event.data);

          console.log(
            "[ArchSentinel SSE]",
            reviewEvent
          );

          if (
            reviewEvent.type !==
            "connection"
          ) {
            setLiveEvents((previous) => [
              ...previous,
              reviewEvent,
            ]);
          }

          switch (reviewEvent.type) {
            case "repository":
              setStage("repository");
              break;

            case "master":
              setStage("master");
              break;

            case "security":
              setStage("security");
              break;

            case "performance":
              setStage("performance");
              break;

            case "logic":
              setStage("logic");
              break;

            case "synthesis":
              setStage("synthesis");
              break;

            case "completed":
              setStage("completed");
              break;

            case "failed":
              setStage("failed");
              break;

            default:
              break;
          }
        } catch (error) {
          console.error(
            "Failed to parse SSE event:",
            error
          );
        }
      };

      /*
       * EventSource automatically attempts to reconnect
       * if the connection is interrupted.
       */

      eventSource.onerror = () => {
        console.warn(
          "[ArchSentinel SSE] Connection interrupted."
        );
      };

      /*
       * =====================================================
       * WAIT FOR SSE CONNECTION
       * =====================================================
       */

      await new Promise<void>(
        (resolve, reject) => {
          if (!eventSource) {
            reject(
              new Error(
                "Unable to create SSE connection."
              )
            );

            return;
          }

          const timeout =
            window.setTimeout(() => {
              reject(
                new Error(
                  "SSE connection timed out."
                )
              );
            }, 5000);

          eventSource.addEventListener(
            "open",
            () => {
              window.clearTimeout(
                timeout
              );

              resolve();
            },
            { once: true }
          );
        }
      );

      /*
       * =====================================================
       * START ACTUAL BACKEND REVIEW
       * =====================================================
       */

      const response = await fetch(
        "http://localhost:4000/api/review/repository",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            repositoryUrl:
              repositoryUrl.trim(),
          }),
        }
      );

      const data: ReviewResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Repository review failed."
        );
      }

      /*
       * =====================================================
       * FINAL REVIEW RESULT
       * =====================================================
       */

      setReview(data);
      setStage("completed");

    } catch (err) {
      setStage("failed");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze repository."
      );

    } finally {
      /*
       * Close SSE connection after review completes.
       */

      if (eventSource) {
        eventSource.close();
      }

      setLoading(false);
    }
  }

  async function analyzeCode() {
    if (!codeFileName.trim()) {
      setError("Please enter a file name.");
      return;
    }

    if (!codeContent.trim()) {
      setError("Please paste or write some code.");
      return;
    }

    setLoading(true);
    setError("");
    setReview(null);
    setStage("idle");
    setLiveEvents([]);

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(
        "http://localhost:4000/api/review/events"
      );

      eventSource.onmessage = (event) => {
        try {
          const reviewEvent: ReviewEvent =
            JSON.parse(event.data);

          console.log(
            "[ArchSentinel SSE]",
            reviewEvent
          );

          if (reviewEvent.type !== "connection") {
            setLiveEvents((previous) => [
              ...previous,
              reviewEvent,
            ]);
          }

          switch (reviewEvent.type) {
            case "repository":
              setStage("repository");
              break;
            case "master":
              setStage("master");
              break;
            case "security":
              setStage("security");
              break;
            case "performance":
              setStage("performance");
              break;
            case "logic":
              setStage("logic");
              break;
            case "synthesis":
              setStage("synthesis");
              break;
            case "completed":
              setStage("completed");
              break;
            case "failed":
              setStage("failed");
              break;
            default:
              break;
          }
        } catch (error) {
          console.error(
            "Failed to parse SSE event:",
            error
          );
        }
      };

      eventSource.onerror = () => {
        console.warn(
          "[ArchSentinel SSE] Connection interrupted."
        );
      };

      await new Promise<void>((resolve, reject) => {
        if (!eventSource) {
          reject(
            new Error(
              "Unable to create SSE connection."
            )
          );
          return;
        }

        const timeout = window.setTimeout(() => {
          reject(
            new Error(
              "SSE connection timed out."
            )
          );
        }, 5000);

        eventSource.addEventListener(
          "open",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
      });

      const response = await fetch(
        "http://localhost:4000/api/review/code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: codeFileName.trim(),
            language: codeLanguage.trim(),
            code: codeContent,
          }),
        }
      );

      const data: ReviewResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Code review failed."
        );
      }

      setReview(data);
      setStage("completed");
    } catch (err) {
      setStage("failed");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze code."
      );
    } finally {
      if (eventSource) {
        eventSource.close();
      }

      setLoading(false);
    }
  }

  /*
   * =====================================================
   * FINAL FINDINGS
   * =====================================================
   */

  const findings =
    review?.result?.synthesis?.findings || [];

  /*
   * =====================================================
   * SEVERITY COUNTERS
   * =====================================================
   */

  const criticalCount = findings.filter(
    (finding) =>
      finding.severity === "CRITICAL"
  ).length;

  const highCount = findings.filter(
    (finding) =>
      finding.severity === "HIGH"
  ).length;

  const mediumCount = findings.filter(
    (finding) =>
      finding.severity === "MEDIUM"
  ).length;

  const lowCount = findings.filter(
    (finding) =>
      finding.severity === "LOW"
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily:
          "Inter, Arial, Helvetica, sans-serif",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <header
          style={{
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            >
              ◈
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                }}
              >
                ArchSentinel
              </h1>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#94a3b8",
                }}
              >
                Multi-Agent Intelligent Code Review &
                Remediation Hub
              </p>
            </div>
          </div>
        </header>

        {/* =====================================================
            REVIEW INPUT
        ===================================================== */}

        <section
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "20px",
              marginBottom: "18px",
            }}
          >
            Analyze Code
          </h2>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => {
                setReviewMode("repository");
                setError("");
              }}
              disabled={loading}
              style={{
                padding: "10px 18px",
                borderRadius: "9px",
                border: "1px solid #475569",
                background:
                  reviewMode === "repository"
                    ? "#2563eb"
                    : "#0f172a",
                color: "#f8fafc",
                fontWeight: "600",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              GitHub Repository
            </button>

            <button
              onClick={() => {
                setReviewMode("code");
                setError("");
              }}
              disabled={loading}
              style={{
                padding: "10px 18px",
                borderRadius: "9px",
                border: "1px solid #475569",
                background:
                  reviewMode === "code"
                    ? "#2563eb"
                    : "#0f172a",
                color: "#f8fafc",
                fontWeight: "600",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Paste Code
            </button>
          </div>

          {reviewMode === "repository" && (
            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <input
                type="text"
                value={repositoryUrl}
                onChange={(event) =>
                  setRepositoryUrl(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    analyzeRepository();
                  }
                }}
                placeholder="https://github.com/owner/repository"
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#f8fafc",
                  fontSize: "15px",
                  outline: "none",
                }}
              />

              <button
                onClick={analyzeRepository}
                disabled={loading}
                style={{
                  padding: "14px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: loading
                    ? "#475569"
                    : "#2563eb",
                  color: "white",
                  fontWeight: "600",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze Repository"}
              </button>
            </div>
          )}

          {reviewMode === "code" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                }}
              >
                <input
                  type="text"
                  value={codeFileName}
                  onChange={(event) =>
                    setCodeFileName(
                      event.target.value
                    )
                  }
                  placeholder="File name"
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #475569",
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />

                <select
                  value={codeLanguage}
                  onChange={(event) =>
                    setCodeLanguage(
                      event.target.value
                    )
                  }
                  style={{
                    width: "180px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #475569",
                    background: "#0f172a",
                    color: "#f8fafc",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <textarea
                value={codeContent}
                onChange={(event) =>
                  setCodeContent(
                    event.target.value
                  )
                }
                placeholder="Paste or write your code here..."
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: "280px",
                  boxSizing: "border-box",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#f8fafc",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                }}
              />

              <button
                onClick={analyzeCode}
                disabled={loading}
                style={{
                  alignSelf: "flex-start",
                  padding: "14px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: loading
                    ? "#475569"
                    : "#2563eb",
                  color: "white",
                  fontWeight: "600",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze Code"}
              </button>
            </div>
          )}

          {error && (
            <p
              style={{
                color: "#f87171",
                marginBottom: 0,
              }}
            >
              {error}
            </p>
          )}
        </section>

        {/* =====================================================
            AGENT EXECUTION PIPELINE
        ===================================================== */}

        {loading && (
          <section
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: "6px",
                    fontSize: "20px",
                  }}
                >
                  ArchSentinel Analysis Pipeline
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  Real-time execution stream
                  from the backend
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#22c55e",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                <span>●</span>
                LIVE
              </div>
            </div>

            <AgentStageRow
              label="Repository Ingestion"
              active={
                stage === "repository" ||
                stage === "master" ||
                stage === "security" ||
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis"
              }
              completed={
                stage === "master" ||
                stage === "security" ||
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis" ||
                stage === "completed"
              }
            />

            <AgentStageRow
              label="Master Agent"
              active={
                stage === "master" ||
                stage === "security" ||
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis"
              }
              completed={
                stage === "security" ||
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis" ||
                stage === "completed"
              }
            />

            <AgentStageRow
              label="Security & Risk Agent"
              active={
                stage === "security" ||
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis"
              }
              completed={
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis" ||
                stage === "completed"
              }
            />

            <AgentStageRow
              label="Performance & Complexity Agent"
              active={
                stage === "performance" ||
                stage === "logic" ||
                stage === "synthesis"
              }
              completed={
                stage === "logic" ||
                stage === "synthesis" ||
                stage === "completed"
              }
            />

            <AgentStageRow
              label="Logic & Edge-Case Agent"
              active={
                stage === "logic" ||
                stage === "synthesis"
              }
              completed={
                stage === "synthesis" ||
                stage === "completed"
              }
            />

            <AgentStageRow
              label="Review Synthesis Engine"
              active={
                stage === "synthesis"
              }
              completed={
                stage === "completed"
              }
            />

            {/* =================================================
                LIVE EVENT STREAM
            ================================================= */}

            <div
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop:
                  "1px solid #334155",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "15px",
                  }}
                >
                  Live Event Stream
                </h3>

                <span
                  style={{
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  {liveEvents.length} event
                  {liveEvents.length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>

              {liveEvents.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    background:
                      "#0f172a",
                    borderRadius: "10px",
                    color: "#94a3b8",
                    fontSize: "13px",
                  }}
                >
                  Waiting for backend
                  events...
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {liveEvents.map(
                    (event, index) => {
                      const statusColor =
                        event.status ===
                        "failed"
                          ? "#ef4444"
                          : event.status ===
                            "completed"
                          ? "#22c55e"
                          : "#60a5fa";

                      return (
                        <div
                          key={`${event.timestamp}-${index}`}
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "10px",
                            padding:
                              "10px 12px",
                            background:
                              "#0f172a",
                            borderRadius:
                              "8px",
                            border:
                              "1px solid #334155",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius:
                                "50%",
                              background:
                                statusColor,
                              flexShrink: 0,
                            }}
                          />

                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "13px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {formatAgentName(
                                event.type
                              )}
                            </div>

                            <div
                              style={{
                                color:
                                  "#94a3b8",
                                fontSize:
                                  "12px",
                                marginTop:
                                  "2px",
                              }}
                            >
                              {
                                event.message
                              }
                            </div>
                          </div>

                          <span
                            style={{
                              color:
                                statusColor,
                              fontSize:
                                "11px",
                              fontWeight:
                                "600",
                              textTransform:
                                "uppercase",
                            }}
                          >
                            {event.status}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            RESULTS
        ===================================================== */}

        {review?.result && (
          <>
            {/* =================================================
                REPOSITORY SUMMARY
            ================================================= */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <StatCard
                title="Files Analyzed"
                value={
                  review.repository?.fileCount ??
                  (review.result?.specialistResults[0]
                    ?.examinedFiles.length ?? 0)
                }
              />

              <StatCard
                title="Total Findings"
                value={
                  review.result.synthesis
                    .totalFindings
                }
              />

              <StatCard
                title="Overall Risk"
                value={
                  review.result.synthesis
                    .overallRisk
                }
                highlight
              />

              <StatCard
                title="Review Status"
                value="Completed"
              />
            </section>

            {/* =================================================
                SEVERITY OVERVIEW
            ================================================= */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <SeverityCard
                label="Critical"
                count={criticalCount}
                color="#ef4444"
              />

              <SeverityCard
                label="High"
                count={highCount}
                color="#f97316"
              />

              <SeverityCard
                label="Medium"
                count={mediumCount}
                color="#eab308"
              />

              <SeverityCard
                label="Low"
                count={lowCount}
                color="#22c55e"
              />
            </section>

            {/* =================================================
                AGENT STATUS
            ================================================= */}

            <section
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                }}
              >
                Agent Analysis
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "12px",
                }}
              >
                {review.result.specialistResults.map(
                  (agent) => (
                    <div
                      key={agent.agent}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        background: "#0f172a",
                        border:
                          "1px solid #334155",
                      }}
                    >
                      {/* AGENT HEADER */}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                          marginBottom: "10px",
                        }}
                      >
                        <strong>
                          {formatAgentName(
                            agent.agent
                          )}
                        </strong>

                        <span
                          style={{
                            color: "#22c55e",
                            fontSize: "13px",
                            whiteSpace:
                              "nowrap",
                          }}
                        >
                          ● Completed
                        </span>
                      </div>

                      {/* FINDINGS COUNT */}

                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: "14px",
                          marginBottom: "14px",
                        }}
                      >
                        {agent.findings.length}{" "}
                        finding
                        {agent.findings.length !==
                        1
                          ? "s"
                          : ""}
                      </div>

                      {/* EXAMINED FILES */}

                      <details
                        style={{
                          borderTop:
                            "1px solid #334155",
                          paddingTop: "12px",
                        }}
                      >
                        <summary
                          style={{
                            cursor: "pointer",
                            color: "#60a5fa",
                            fontSize: "13px",
                            fontWeight: "600",
                            listStyle:
                              "none",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <span>
                            Examined Files (
                            {
                              agent
                                .examinedFiles
                                .length
                            }
                            )
                          </span>

                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            View
                          </span>
                        </summary>

                        <div
                          style={{
                            marginTop: "12px",
                            maxHeight: "220px",
                            overflowY:
                              "auto",
                            display: "flex",
                            flexDirection:
                              "column",
                            gap: "6px",
                            paddingRight:
                              "4px",
                          }}
                        >
                          {agent.examinedFiles
                            .length === 0 ? (
                            <div
                              style={{
                                color:
                                  "#64748b",
                                fontSize:
                                  "12px",
                                padding:
                                  "8px 0",
                              }}
                            >
                              No files recorded.
                            </div>
                          ) : (
                            agent.examinedFiles.map(
                              (
                                file,
                                index
                              ) => (
                                <div
                                  key={`${file.path}-${index}`}
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "space-between",
                                    gap: "10px",
                                    padding:
                                      "8px 10px",
                                    background:
                                      "#1e293b",
                                    borderRadius:
                                      "7px",
                                    border:
                                      "1px solid #334155",
                                  }}
                                >
                                  <span
                                    style={{
                                      color:
                                        "#cbd5e1",
                                      fontSize:
                                        "12px",
                                      fontFamily:
                                        "monospace",
                                      overflow:
                                        "hidden",
                                      textOverflow:
                                        "ellipsis",
                                      whiteSpace:
                                        "nowrap",
                                    }}
                                    title={
                                      file.path
                                    }
                                  >
                                    {file.path}
                                  </span>

                                  <span
                                    style={{
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "10px",
                                      flexShrink: 0,
                                      textTransform:
                                        "uppercase",
                                    }}
                                  >
                                    {
                                      file.language
                                    }
                                  </span>
                                </div>
                              )
                            )
                          )}
                        </div>
                      </details>
                    </div>
                  )
                )}

                {/* =================================================
                    SYNTHESIS
                ================================================= */}

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#0f172a",
                    border:
                      "1px solid #334155",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>
                      Synthesis Engine
                    </strong>

                    <span
                      style={{
                        color: "#22c55e",
                        fontSize: "13px",
                      }}
                    >
                      ● Completed
                    </span>
                  </div>

                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "14px",
                    }}
                  >
                    {
                      review.result.synthesis
                        .totalFindings
                    }{" "}
                    consolidated findings
                  </span>
                </div>
              </div>
            </section>

            {/* =================================================
                REVIEW SUMMARY
            ================================================= */}

            <section
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                }}
              >
                Review Summary
              </h2>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.7,
                  marginBottom: 0,
                }}
              >
                {
                  review.result.synthesis
                    .summary
                }
              </p>
            </section>

            {/* =================================================
                FINDINGS
            ================================================= */}

            <section>
              <h2
                style={{
                  fontSize: "22px",
                  marginBottom: "16px",
                }}
              >
                Findings
              </h2>

              {findings.length === 0 ? (
                <div
                  style={{
                    background: "#1e293b",
                    border:
                      "1px solid #334155",
                    borderRadius: "16px",
                    padding: "30px",
                    color: "#94a3b8",
                  }}
                >
                  No issues were identified.
                </div>
              ) : (
                findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                  />
                ))
              )}
            </section>

            {/* =================================================
                RECOMMENDATIONS
            ================================================= */}

            {review.result.synthesis
              .recommendations.length > 0 && (
              <section
                style={{
                  background: "#1e293b",
                  border:
                    "1px solid #334155",
                  borderRadius: "16px",
                  padding: "24px",
                  marginTop: "24px",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    fontSize: "20px",
                  }}
                >
                  Recommended Actions
                </h2>

                <ul
                  style={{
                    color: "#cbd5e1",
                    lineHeight: 1.8,
                    paddingLeft: "22px",
                  }}
                >
                  {review.result.synthesis
                    .recommendations.map(
                      (
                        recommendation,
                        index
                      ) => (
                        <li key={index}>
                          {recommendation}
                        </li>
                      )
                    )}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* =============================================================
   STAT CARD
============================================================= */

function StatCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "22px",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "14px",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "25px",
          fontWeight: "700",
          color: highlight
            ? "#ef4444"
            : "#f8fafc",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =============================================================
   SEVERITY CARD
============================================================= */

function SeverityCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "20px",
        borderLeft:
          `4px solid ${color}`,
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "14px",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "26px",
          fontWeight: "700",
        }}
      >
        {count}
      </div>
    </div>
  );
}

/* =============================================================
   AGENT PIPELINE ROW
============================================================= */

function AgentStageRow({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 0",
        borderBottom:
          "1px solid #334155",
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: completed
            ? "#166534"
            : active
            ? "#1d4ed8"
            : "#334155",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {completed
          ? "✓"
          : active
          ? "⋯"
          : "○"}
      </div>

      <span
        style={{
          color: completed
            ? "#86efac"
            : active
            ? "#93c5fd"
            : "#64748b",
          fontWeight:
            active || completed
              ? "600"
              : "400",
        }}
      >
        {label}
      </span>

      {active && !completed && (
        <span
          style={{
            marginLeft: "auto",
            color: "#60a5fa",
            fontSize: "13px",
          }}
        >
          Running...
        </span>
      )}

      {completed && (
        <span
          style={{
            marginLeft: "auto",
            color: "#4ade80",
            fontSize: "13px",
          }}
        >
          Completed
        </span>
      )}
    </div>
  );
}

/* =============================================================
   FINDING CARD
============================================================= */

function FindingCard({
  finding,
}: {
  finding: Finding;
}) {
  const severityColor =
    finding.severity === "CRITICAL"
      ? "#ef4444"
      : finding.severity === "HIGH"
      ? "#f97316"
      : finding.severity === "MEDIUM"
      ? "#eab308"
      : "#22c55e";

  return (
    <article
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "14px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                background: severityColor,
                color: "#fff",
                padding: "4px 9px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "700",
              }}
            >
              {finding.severity}
            </span>

            <span
              style={{
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              {finding.category}
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: "19px",
            }}
          >
            {finding.title}
          </h3>
        </div>

        <span
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            whiteSpace: "nowrap",
          }}
        >
          Confidence{" "}
          {(finding.confidence * 100).toFixed(
            0
          )}
          %
        </span>
      </div>

      {/* FILE + LINE */}

      <div
        style={{
          background: "#0f172a",
          padding: "10px 14px",
          borderRadius: "8px",
          marginBottom: "16px",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#60a5fa",
        }}
      >
        {finding.file}:{finding.line}
      </div>

      {/* DESCRIPTION */}

      <p
        style={{
          color: "#cbd5e1",
          lineHeight: 1.6,
        }}
      >
        {finding.description}
      </p>

      {/* EVIDENCE */}

      <div
        style={{
          marginTop: "18px",
        }}
      >
        <strong>
          Evidence
        </strong>

        <pre
          style={{
            background: "#020617",
            color: "#cbd5e1",
            padding: "16px",
            borderRadius: "10px",
            overflowX: "auto",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {finding.evidence}
        </pre>
      </div>

      {/* IMPACT */}

      <div
        style={{
          marginTop: "18px",
        }}
      >
        <strong>
          Impact
        </strong>

        <p
          style={{
            color: "#cbd5e1",
            lineHeight: 1.6,
          }}
        >
          {finding.impact}
        </p>
      </div>

      {/* RECOMMENDATION */}

      <div
        style={{
          marginTop: "18px",
        }}
      >
        <strong>
          Recommendation
        </strong>

        <p
          style={{
            color: "#93c5fd",
            lineHeight: 1.6,
          }}
        >
          {finding.recommendation}
        </p>
      </div>
    </article>
  );
}

/* =============================================================
   AGENT NAME FORMATTER
============================================================= */

function formatAgentName(agent: string) {
  if (agent === "master") {
    return "Master Agent";
  }

  if (agent === "security") {
    return "Security Agent";
  }

  if (agent === "performance") {
    return "Performance Agent";
  }

  if (agent === "logic") {
    return "Logic Agent";
  }

  if (agent === "synthesis") {
    return "Review Synthesis";
  }

  if (agent === "repository") {
    return "Repository";
  }

  if (agent === "completed") {
    return "Review";
  }

  if (agent === "failed") {
    return "Review";
  }

  return agent
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default App;