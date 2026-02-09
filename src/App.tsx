import { useState } from "react";
import { getStatus } from "./lib/api";

export default function App() {
  const [requestId, setRequestId] = useState("demo-121");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  async function onFetch() {
    setLoading(true);
    setErr(null);
    setData(null);
    try {
      const out = await getStatus(requestId.trim());
      setData(out);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Jarvis Panel (MVP)</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label>
          requestId:{" "}
          <input
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            style={{ padding: 8, width: 240 }}
          />
        </label>

        <button onClick={onFetch} disabled={loading} style={{ padding: "8px 14px" }}>
          {loading ? "Loading…" : "Get status"}
        </button>
      </div>

      {err && (
        <pre style={{ marginTop: 16, padding: 12, background: "#2a1a1a", color: "#ffb3b3" }}>
          {err}
        </pre>
      )}

      {data && (
        <pre style={{ marginTop: 16, padding: 12, background: "#111", color: "#ddd", overflow: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      <p style={{ marginTop: 16, opacity: 0.7 }}>
        Next: render approvals + runEvents timeline.
      </p>
    </div>
  );
}
