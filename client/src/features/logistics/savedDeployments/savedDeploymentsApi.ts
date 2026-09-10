import type { DeploymentItem } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchDeployments(): Promise<DeploymentItem[]> {
  const response = await fetch(`${API_URL}/api/logistics/deployments`);
  if (!response.ok) {
    throw new Error(`שגיאה בטעינת פריסות (${response.status})`);
  }
  return response.json();
}

export async function fetchRealDeployment(): Promise<DeploymentItem | null> {
  const response = await fetch(`${API_URL}/api/logistics/deployments/live`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`שגיאה בטעינת הפריסה המרכזית (${response.status})`);
  }
  return response.json();
}

export async function promoteDeploymentToReal(id: number): Promise<DeploymentItem> {
  const response = await fetch(`${API_URL}/api/logistics/deployments`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      status: "Real",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error || err?.message || `שגיאה בהגדרת פריסה לאמיתית (${response.status})`
    );
  }

  return response.json();
}
