🛡️ ArchSentinel
Multi-Agent Intelligent Code Review, Architectural Compliance & Auto-Remediation Hub

An AI-powered multi-agent code review platform that analyzes software repositories through specialized agents for security, performance, logic, and code-quality risks — then synthesizes their findings into a unified engineering review.
















🚀 What is ArchSentinel?

ArchSentinel is a multi-agent AI-powered code review and engineering analysis platform designed to reduce the limitations of traditional manual code reviews.

Instead of relying on a single AI prompt to inspect an entire codebase, ArchSentinel distributes the review workload across specialized AI agents.

Each agent focuses on a different engineering dimension:

Agent	Primary Responsibility
🛡️ Security Agent	Security vulnerabilities, unsafe patterns and risk exposure
⚡ Performance Agent	Complexity, inefficient operations and performance bottlenecks
🔍 Logic & Edge-Case Agent	Logic errors, boundary conditions and error-handling weaknesses
🧠 Master Agent	Orchestration, parallel execution and result aggregation
📋 Review Synthesis Engine	Converts specialist findings into a unified engineering review

The result is a structured review containing:

Severity
Confidence
Category
File
Line number
Description
Evidence
Impact
Recommendation
🎯 Problem Statement

Modern software teams face several challenges when reviewing code manually.

1. Review Latency

Pull requests can remain blocked while waiting for senior engineers to review them.

2. Review Fatigue

Engineers repeatedly inspect large code changes, increasing the possibility of overlooking important defects.

3. Superficial Reviews

Human reviewers may identify formatting and style issues while deeper problems such as:

security vulnerabilities
inefficient algorithms
error-handling failures
null/undefined issues
concurrency problems
boundary conditions

remain undetected.

4. Architectural Drift

Organizations frequently maintain:

Architecture Decision Records
API contracts
module boundaries
coding standards
design guidelines

but these rules are not always continuously validated against incoming code.

5. Limited Actionability

Traditional static-analysis tools often produce lists of warnings without explaining:

What is wrong? Why does it matter? Where exactly is it happening? What should the developer do next?

ArchSentinel is designed around this problem.

💡 The ArchSentinel Approach

ArchSentinel transforms code review into a multi-agent engineering pipeline.

Instead of:

Code
 ↓
Single AI Prompt
 ↓
Generic Review

ArchSentinel uses:

                    ┌──────────────────────┐
                    │   Repository / Code  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Master Agent     │
                    │   Orchestrator       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │  Security  │   │ Performance│   │   Logic    │
       │   Agent    │   │   Agent    │   │   Agent    │
       └──────┬─────┘   └──────┬─────┘   └──────┬─────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Review Synthesis     │
                    │ Engine               │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Unified Engineering  │
                    │ Review Dashboard     │
                    └──────────────────────┘

The specialist agents execute in parallel, reducing dependence on a single sequential review process.

🏗️ System Architecture
🔄 End-to-End Review Pipeline
Step 1 — Repository Ingestion

ArchSentinel accepts a GitHub repository URL.

The backend:

validates the repository request
clones the repository
scans supported source files
ignores unnecessary directories
identifies source language
loads file content into the review context

Currently ignored/generated directories include:

node_modules
.git
dist
build
.next
coverage
Step 2 — Review Context Construction

Repository files are normalized into a common review representation:

interface ReviewFile {
  path: string;
  language: string;
  content: string;
}

This gives every specialist agent a consistent input structure.

🤖 Step 3 — Master Agent

The Master Agent is the central orchestrator.

Its responsibilities include:

starting the review pipeline
preparing specialist execution
running specialist agents concurrently
collecting their results
invoking the Review Synthesis Engine
returning the final structured result

The specialist agents are executed using parallel asynchronous execution.

Conceptually:

const results = await Promise.all([
  securityAgent(files),
  performanceAgent(files),
  logicAgent(files),
]);

This allows independent review dimensions to execute simultaneously.

🛡️ Step 4 — Security Agent

The Security Agent focuses specifically on security-related risks.

It evaluates source code for potentially dangerous patterns and security weaknesses.

Examples of review categories include:

unsafe input handling
authentication-related risks
authorization weaknesses
injection-style vulnerabilities
insecure data handling
exposed sensitive information
unsafe API usage

Each finding follows a structured schema.

Example:

{
  "id": "SEC-001",
  "title": "Potential unsafe input handling",
  "severity": "HIGH",
  "confidence": 0.91,
  "category": "Security",
  "file": "src/example.ts",
  "line": 42,
  "description": "...",
  "evidence": "...",
  "impact": "...",
  "recommendation": "..."
}
⚡ Step 5 — Performance & Complexity Agent

The Performance Agent examines code from an efficiency perspective.

It focuses on issues such as:

inefficient algorithms
unnecessary loops
repeated computations
expensive operations
inefficient data processing
avoidable resource usage
time/space complexity concerns

The goal is not simply to say:

"This code is slow."

Instead, the agent provides structured engineering evidence and recommendations.

🔍 Step 6 — Logic & Edge-Case Agent

The Logic Agent focuses on correctness and robustness.

It evaluates areas such as:

null/undefined handling
boundary conditions
missing validation
incorrect branching
error-handling weaknesses
promise/error propagation
unexpected input states
logical inconsistencies

This helps identify bugs that may not necessarily appear as traditional security or performance problems.

🧠 Step 7 — Review Synthesis Engine

The specialist agents generate independent findings.

Those results then go through the Review Synthesis Engine.

Importantly:

The Review Synthesis Engine is not treated as another independent specialist agent.

Its purpose is to consolidate the outputs of the specialist agents.

The synthesis layer produces:

overall risk
total finding count
unified findings
recommendations
consolidated review summary

This creates a single engineering-oriented output instead of forcing developers to inspect three independent AI responses.

📊 Finding Model

Every finding follows a structured schema.

interface Finding {
  id: string;
  title: string;
  severity:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM"
    | "LOW";

  confidence: number;
  category: string;

  file: string;
  line: number;

  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
}
Severity Levels
Level	Meaning
🔴 CRITICAL	Immediate and potentially severe engineering/security risk
🟠 HIGH	Significant issue requiring prompt attention
🟡 MEDIUM	Meaningful issue that should be addressed
🟢 LOW	Lower-impact improvement or risk
📡 Real-Time Execution Streaming

One of the key features of ArchSentinel is the live review pipeline.

The frontend establishes a Server-Sent Events (SSE) connection before starting the review.

The backend streams events such as:

repository
master
security
performance
logic
synthesis
completed
failed

Each event contains:

interface ReviewEvent {
  type: string;
  status:
    | "started"
    | "running"
    | "completed"
    | "failed";

  message: string;
  timestamp: string;
}

This allows the dashboard to show what the review system is doing in real time.

Example:

✓ Repository ingestion completed

✓ Master Agent started

⟳ Security Agent running

⟳ Performance Agent running

⟳ Logic Agent running

✓ Security Agent completed

✓ Performance Agent completed

✓ Logic Agent completed

⟳ Review Synthesis Engine running

✓ Review completed
🖥️ Dashboard

The ArchSentinel frontend provides an interactive developer-facing dashboard.

The current interface includes:

Repository Analysis

Enter a GitHub repository URL and start an analysis.

Paste Code Analysis

Developers can also directly submit code by specifying:

file name
programming language
source code

This provides a quick way to test ArchSentinel without creating a complete repository.

Pipeline Visualization

The dashboard displays the current review stage:

Repository
    ↓
Master
    ↓
Security ─────┐
Performance ──┼──→ Synthesis
Logic ────────┘
                  ↓
              Completed
Live Events

Real-time SSE events are displayed in the UI.

Files Analyzed

The interface displays files examined during the review.

Findings

The dashboard presents synthesized findings.

Severity Summary

Findings are grouped into:

CRITICAL
HIGH
MEDIUM
LOW
Agent Analysis

Individual specialist results can be inspected.

Recommendations

The final synthesis provides actionable recommendations.

🧪 Current Demo Repository

The project contains a small demonstration repository:

demo-repo/
├── logic-test.js
├── performance-test.js
└── security-test.js

These files provide a lightweight testbed for exercising the specialist review pipeline.

🧰 Technology Stack
Frontend
Technology	Purpose
React	User interface
TypeScript	Type-safe frontend development
Vite	Frontend development/build tooling
CSS / Inline Styling	Dashboard presentation
EventSource	SSE client for live updates
Backend
Technology	Purpose
Node.js	Runtime
TypeScript	Backend development
Fastify	HTTP API server
Zod	Runtime schema validation
simple-git	Repository cloning
dotenv	Environment configuration
Google Gemini	AI reasoning/review generation
AI Layer
Google Gemini
      │
      ▼
┌─────────────────────┐
│   Master Agent      │
└──────────┬──────────┘
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
 Security Perf  Logic
     │     │     │
     └─────┼─────┘
           ▼
      Synthesis
📁 Project Structure
ArchSentinel/
│
├── backend/
│   │
│   ├── src/
│   │   ├── agents/
│   │   │   ├── logic/
│   │   │   │   └── logicAgent.ts
│   │   │   │
│   │   │   ├── master/
│   │   │   │   └── masterAgent.ts
│   │   │   │
│   │   │   ├── performance/
│   │   │   │   └── performanceAgent.ts
│   │   │   │
│   │   │   ├── security/
│   │   │   │   └── securityAgent.ts
│   │   │   │
│   │   │   └── synthesis/
│   │   │       └── reviewSynthesis.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── ai.ts
│   │   │   ├── code.ts
│   │   │   ├── events.ts
│   │   │   ├── logic.ts
│   │   │   ├── master.ts
│   │   │   ├── performance.ts
│   │   │   ├── repository.ts
│   │   │   ├── review.ts
│   │   │   └── security.ts
│   │   │
│   │   ├── schemas/
│   │   │   ├── agent.ts
│   │   │   └── synthesis.ts
│   │   │
│   │   ├── services/
│   │   │   ├── events/
│   │   │   │   └── reviewEvents.ts
│   │   │   │
│   │   │   ├── repository/
│   │   │   │   └── repositoryService.ts
│   │   │   │
│   │   │   ├── review/
│   │   │   │   └── reviewContext.ts
│   │   │   │
│   │   │   └── gemini.ts
│   │   │
│   │   ├── types/
│   │   │   └── review.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── frontend/
│   │
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── assets/
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── demo-repo/
│   ├── logic-test.js
│   ├── performance-test.js
│   └── security-test.js
│
├── .gitignore
└── README.md
⚙️ Getting Started
Prerequisites

Before running ArchSentinel, install:

Node.js
npm
Git
A Google Gemini API key

Check your installations:

node --version
npm --version
git --version
📥 Clone the Repository
git clone https://github.com/PRANAV-AADITYA-95/ArchSentinel.git

Move into the project:

cd ArchSentinel
🔐 Environment Configuration

The backend requires a Gemini API key.

Create:

backend/.env

Add:

GEMINI_API_KEY=your_gemini_api_key_here
⚠️ Security Notice

Never commit .env to GitHub.

The project .gitignore already excludes environment files.

Do not hard-code API keys inside TypeScript source files.

📦 Backend Installation

Navigate to the backend:

cd backend

Install dependencies:

npm install

Build the backend:

npm run build

Start the backend:

npm run start

The backend runs on:

http://localhost:4000
🎨 Frontend Installation

Open another terminal.

Navigate to:

cd ArchSentinel/frontend

Install dependencies:

npm install

Start the development server:

npm run dev

Vite will provide a local development URL, typically:

http://localhost:5173
🔌 API Endpoints

The backend exposes several API routes.

Repository Review
POST /api/review/repository

Used to analyze a GitHub repository.

Example:

{
  "repositoryUrl": "https://github.com/example/project.git"
}
Paste Code Review
POST /api/review/code

Example:

{
  "fileName": "example.py",
  "language": "python",
  "code": "def add(a, b): return a + b"
}

The request is converted into the same internal ReviewFile representation used by repository analysis.

Live Review Events
GET /api/review/events

This endpoint establishes the SSE stream used by the frontend to receive live review events.

🧠 Review Execution Flow
🔒 Validation & Structured Output

ArchSentinel uses Zod schemas to validate AI-generated results.

This is important because an LLM response is not automatically guaranteed to follow the expected application structure.

The application validates fields such as:

id
title
severity
confidence
category
file
line
description
evidence
impact
recommendation

This creates a controlled boundary between probabilistic AI output and application logic.

🧩 Why Multi-Agent?

A single AI reviewer has to reason about multiple dimensions simultaneously.

ArchSentinel instead separates responsibilities.

                    CODEBASE
                       │
                       ▼
                ┌─────────────┐
                │    MASTER   │
                └──────┬──────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   SECURITY       PERFORMANCE       LOGIC
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  SYNTHESIS
                       │
                       ▼
                 FINAL REVIEW

This architecture provides:

Specialization

Each agent has a focused responsibility.

Parallelism

Independent analyses can run concurrently.

Separation of Concerns

Security logic does not need to be mixed with performance reasoning.

Structured Aggregation

The synthesis layer turns multiple perspectives into one result.

Extensibility

Additional specialist agents can be added without redesigning the entire system.

🔮 Roadmap

ArchSentinel is designed to evolve beyond the currently implemented review pipeline.

Phase 1 — Core Multi-Agent Review
 Repository ingestion
 Paste-code analysis
 Master Agent
 Security Agent
 Performance Agent
 Logic & Edge-Case Agent
 Parallel specialist execution
 Review Synthesis Engine
 Structured findings
 SSE event streaming
 Live review dashboard
Phase 2 — Architectural Intelligence

Planned capabilities:

 Architecture Decision Record ingestion
 Repository documentation analysis
 API contract validation
 Module-boundary analysis
 Architecture compliance checks
 Dependency graph analysis
 Architectural drift detection
Phase 3 — Autonomous Remediation

Planned capabilities:

 AI-generated code patches
 Unified .diff generation
 Patch preview
 One-click remediation
 Business-logic preservation checks
 Multi-file remediation
Phase 4 — Regression Test Synthesis

Planned capabilities:

 Automatic test generation
 Regression test creation
 Unit test synthesis
 Integration test synthesis
 Validation of remediation patches
Phase 5 — Developer Workflow Integration

Potential integrations:

 GitHub Pull Requests
 GitHub Actions
 CI/CD pipelines
 Pull Request comments
 Automated quality gates
 Review reports
 Team dashboards
🏢 Potential Enterprise Use Cases

ArchSentinel can be extended for several engineering environments.

Software Development Teams

Automated first-pass code review before human review.

Enterprise Engineering

Continuous validation against architecture and governance rules.

Security Teams

Early detection of potentially risky coding patterns.

DevOps / Platform Teams

Automated quality gates in CI/CD.

Engineering Managers

High-level review summaries and risk visibility.

Developers

Actionable explanations instead of raw warning lists.

🧪 Example Review Scenario

Suppose a developer submits:

def process_user(user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    return database.execute(query)

A traditional review might simply identify:

Potential SQL issue

ArchSentinel is designed to provide structured information such as:

Severity: HIGH

Category:
Security

File:
user_service.py

Line:
2

Description:
The query is constructed by directly concatenating
user-controlled input into a SQL statement.

Evidence:
The user_id value is interpolated into the SQL string.

Impact:
An attacker may manipulate the generated query.

Recommendation:
Use parameterized queries or a safe query abstraction.

The objective is to make the result understandable and actionable.

🧱 Engineering Principles

ArchSentinel follows several core design principles.

1. Separation of Concerns

Each component has a defined responsibility.

2. Structured AI Output

LLM responses are validated before entering the application pipeline.

3. Parallel Execution

Independent specialist agents can run concurrently.

4. Observable Execution

SSE provides real-time visibility into the review pipeline.

5. Explainability

Findings include evidence, impact and recommendations.

6. Extensibility

The architecture is designed to support additional agents and analysis capabilities.

🔐 Security Considerations

ArchSentinel itself analyzes potentially sensitive source code.

When deploying the platform:

never expose Gemini API keys
never commit .env
use environment variables for secrets
restrict repository access where necessary
avoid logging sensitive source code
sanitize external repository inputs
consider authentication before production deployment
apply rate limiting to public deployments
use HTTPS in production
review repository cloning permissions

For enterprise environments, additional controls should be added around:

authentication
authorization
repository access
audit logging
secret management
data retention
network isolation
⚠️ Current Implementation Notes

ArchSentinel is currently an active prototype/hackathon implementation.

The currently implemented pipeline includes:

Repository / Code
        ↓
Repository Ingestion
        ↓
Master Agent
        ↓
┌───────┼────────┐
↓       ↓        ↓
Security Performance Logic
└───────┼────────┘
        ↓
Review Synthesis
        ↓
Dashboard

Some broader capabilities in the original product vision—particularly fully autonomous remediation, generated regression suites, ADR/document ingestion and CI/CD automation—are part of the planned roadmap rather than claims about the current implementation.

🤝 Contributing

Contributions are welcome.

1. Fork the repository
git clone https://github.com/PRANAV-AADITYA-95/ArchSentinel.git
2. Create a feature branch
git checkout -b feature/your-feature-name
3. Make your changes

Follow the existing architecture and TypeScript conventions.

4. Test your changes

Backend:

cd backend
npm run build

Frontend:

cd frontend
npm run build
5. Commit
git add .
git commit -m "Add: your feature description"
6. Push
git push origin feature/your-feature-name
7. Open a Pull Request

Describe:

what changed
why it changed
how it was tested
any limitations
screenshots where relevant
👥 Team & Contributors
Project

ArchSentinel

Repository Owner

PRANAV-AADITYA-95

GitHub:

ArchSentinel Repository

Contributors

Contributors will be added as the project team is finalized.

Want to contribute? Open an issue, submit a pull request, or contact the project maintainers.

📜 License

A license can be added based on the project's intended usage model.

Recommended options include:

MIT License — permissive open-source use
Apache 2.0 — permissive use with additional protections
Proprietary license — controlled commercial usage

Add the actual license file before representing the repository as formally licensed.

🌟 Project Vision

ArchSentinel aims to move software review from:

Manual Review
      ↓
Static Warnings
      ↓
Developer Investigation
      ↓
Manual Fix
      ↓
Manual Testing

toward:

                 CODE
                  │
                  ▼
        ┌───────────────────┐
        │ Multi-Agent Review│
        └─────────┬─────────┘
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Security   Performance   Logic
       │          │          │
       └──────────┼──────────┘
                  ▼
             SYNTHESIS
                  │
                  ▼
        ACTIONABLE ENGINEERING
              REVIEW
                  │
                  ▼
        ┌───────────────────┐
        │ Future Remediation│
        │ + Test Generation │
        └───────────────────┘

The long-term vision is to create an AI engineering review layer that understands not only whether code has a problem, but also why the problem matters, how it affects the system, what engineering principle it violates, and how it can be safely remediated.

⭐ Why ArchSentinel?

Don't just review code. Understand it. Challenge it. Explain it. Improve it.

ArchSentinel combines:

Multi-Agent AI + Software Engineering + Security Analysis + Performance Analysis + Logic Validation + Real-Time Observability

into a single developer-focused review platform.





Built for intelligent software engineering.

ArchSentinel — Your AI-powered engineering review layer. 🛡️
