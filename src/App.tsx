import { useMemo, useState } from "react";
import { getStatus } from "./lib/api";

type AnyObj = Record<string, any>;

function safeParseArray(value: any): AnyObj[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function pickTs(e: AnyObj): string {
  return e.ts || e.Timestamp || e.receivedAt || e.createdAt || "";
}

function toMs(e: AnyObj): number {
  const s = pickTs(e);
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}

function badgeStyle(status?: string): React.CSSProperties {
  const s = (status || "").toLowerCase();
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #333",
    background: "#111",
    color: "#ddd",
  };
  if (s.includes("approved")) return { ...base, borderColor: "#2d6a4f", color: "#b7f4d1" };
  if (s.includes("pending")) return { ...base, borderColor: "#6c5ce7", color: "#d6ccff" };
  if (s.includes("gap")) return { ...base, borderColor: "#b45309", color: "#ffd7a1" };
  if (s.includes("received")) return { ...base, borderColor: "#2563eb", color: "#b6d5ff" };
  return base;
}

export default function App() {
  const [requestId, setRequestId] = useState("demo-121");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [raw, setRaw] = useState<any>(null);

  const runs = useMemo(() => safeParseArray(raw?.runs), [raw]);
  const approvals = useMemo(() => safeParseArray(raw?.approvals), [raw]);
  const runEvents = useMemo(() => {
    const arr = safeParseArray(raw?.runEvents);
    return arr.slice().sort((a, b) => toMs(a) - toMs(b));
  }, [raw]);

  async function onFetch() {
    setLoading(true);
    setErr(null);
    setRaw(null);
    try {
      const out = await getStatus(requestId.trim());
      setRaw(out);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 20 }}>Jarvis Panel (MVP)</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>requestId:</span>
          <input
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            style={{
              padding: 10,
              width: 260,
              borderRadius: 8,
              border: "1px solid #333",
              background: "#0f0f10",
              color: "#eee",
            }}
          />
        </label>

        <button
          onClick={onFetch}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#151517",
            color: "#eee",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Get status"}
        </button>
      </div>

      {err && (
        <pre style={{ marginTop: 12, padding: 12, background: "#2a1a1a", color: "#ffb3b3", borderRadius: 10 }}>
          {err}
        </pre>
      )}

      {/* Summary */}
      {raw && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 12,
            border: "1px solid #333",
            background: "#0f0f10",
            color: "#eaeaea",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ opacity: 0.8 }}>requestId:</span>
            <b>{raw.requestId || requestId}</b>

            <span style={{ marginLeft: 12, ...badgeStyle(raw.status) }}>
              status: {raw.status || "-"}
            </span>

            <span style={{ ...badgeStyle(raw.approval) }}>
              approval: {raw.approval || "-"}
            </span>

            <span style={{ opacity: 0.8, marginLeft: 12 }}>
              runs: <b>{runs.length}</b>
            </span>
            <span style={{ opacity: 0.8 }}>
              approvals: <b>{approvals.length}</b>
            </span>
            <span style={{ opacity: 0.8 }}>
              events: <b>{runEvents.length}</b>
            </span>
          </div>
        </div>
      )}

      {/* Runs */}
      {raw && (
        <>
          <h2 style={{ marginTop: 22, marginBottom: 10 }}>Runs</h2>
          {runs.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No runs</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {runs.map((r) => (
                <div
                  key={`${r.PartitionKey || ""}-${r.RowKey || ""}`}
                  style={{ border: "1px solid #333", padding: 14, borderRadius: 12, background: "#0f0f10" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <b style={{ fontSize: 16 }}>{r.agent || r.RowKey || "run"}</b>
                    <span style={badgeStyle(r.status)}>{r.status || "-"}</span>
                  </div>
                  <div style={{ opacity: 0.85, marginTop: 8, display: "grid", gap: 4 }}>
                    <div>tenantId: {r.tenantId || "-"}</div>
                    <div>employeeId: {r.employeeId || "-"}</div>
                    <div>receivedAt: {r.receivedAt || r.Timestamp || "-"}</div>
                    <div>source: {r.source || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Approvals */}
      {raw && (
        <>
          <h2 style={{ marginTop: 22, marginBottom: 10 }}>Approvals</h2>
          {approvals.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No approvals</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {approvals.map((a) => (
                <div
                  key={`${a.PartitionKey || ""}-${a.RowKey || ""}`}
                  style={{ border: "1px solid #333", padding: 14, borderRadius: 12, background: "#0f0f10" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <b style={{ fontSize: 16 }}>{a.agent || "approval"}</b>
                    <span style={badgeStyle(a.status)}>{a.status || "-"}</span>
                    <span style={{ opacity: 0.8 }}>id:</span>
                    <span>{a.RowKey || "-"}</span>
                  </div>

                  <div style={{ opacity: 0.85, marginTop: 8, display: "grid", gap: 4 }}>
                    <div>approvedBy: {a.approvedBy || "-"}</div>
                    <div>approvedAt: {a.approvedAt || "-"}</div>
                    <div>eventType: {a.eventType || "-"}</div>
                    <div>ts: {a.ts || a.Timestamp || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Timeline */}
      {raw && (
        <>
          <h2 style={{ marginTop: 22, marginBottom: 10 }}>Run Events Timeline</h2>
          {runEvents.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No run events</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {runEvents.map((e) => (
                <div
                  key={`${e.PartitionKey || ""}-${e.RowKey || ""}`}
                  style={{ border: "1px solid #333", padding: 14, borderRadius: 12, background: "#0f0f10" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <b style={{ fontSize: 16 }}>{e.eventType || "event"}</b>
                    <span style={badgeStyle(e.status)}>{e.status || "-"}</span>
                    {e.approvalId ? (
                      <span style={{ opacity: 0.85 }}>
                        approvalId: <b>{e.approvalId}</b>
                      </span>
                    ) : null}
                  </div>

                  <div style={{ opacity: 0.85, marginTop: 8, display: "grid", gap: 4 }}>
                    <div>ts: {e.ts || e.Timestamp || "-"}</div>
                    <div>employeeId: {e.employeeId || "-"}</div>
                    <div>agent: {e.agent || "-"}</div>
                    {typeof e.payload === "string" ? (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ cursor: "pointer" }}>payload</summary>
                        <pre
                          style={{
                            marginTop: 8,
                            padding: 12,
                            background: "#111",
                            color: "#ddd",
                            overflow: "auto",
                            borderRadius: 10,
                          }}
                        >
                          {e.payload}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Debug (optional) */}
      {raw && (
        <details style={{ marginTop: 22, opacity: 0.9 }}>
          <summary style={{ cursor: "pointer" }}>Debug: raw response</summary>
          <pre style={{ marginTop: 10, padding: 12, background: "#111", color: "#ddd", overflow: "auto", borderRadius: 10 }}>
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
