import type { ServerResponse } from "http";

export type ReviewEventType =
  | "repository"
  | "master"
  | "security"
  | "performance"
  | "logic"
  | "synthesis"
  | "completed"
  | "failed";

export interface ReviewEvent {
  type: ReviewEventType;
  status: "started" | "running" | "completed" | "failed";
  message: string;
  timestamp: string;
}

const clients = new Set<ServerResponse>();

export function addReviewClient(
  response: ServerResponse
) {
  clients.add(response);

  response.on("close", () => {
    clients.delete(response);
  });
}

export function removeReviewClient(
  response: ServerResponse
) {
  clients.delete(response);
}

export function emitReviewEvent(
  event: Omit<ReviewEvent, "timestamp">
) {
  const payload: ReviewEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const message =
    `data: ${JSON.stringify(payload)}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }

  console.log(
    `[SSE] ${event.type} → ${event.status}: ${event.message}`
  );
}