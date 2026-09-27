const API_BASE_URL = "http://localhost:4000";

export async function getBackendStatus() {
  const response = await fetch(`${API_BASE_URL}/`);

  if (!response.ok) {
    throw new Error("Backend request failed");
  }

  return response.json();
}