export const STATUS_API_URL =
  import.meta.env.VITE_STATUS_API_URL as string | undefined;

export async function getStatus(requestId: string) {
  if (!STATUS_API_URL) {
    throw new Error("Missing VITE_STATUS_API_URL");
  }

  const res = await fetch(STATUS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Status API error ${res.status}: ${text}`);
  }

  return res.json();
}
