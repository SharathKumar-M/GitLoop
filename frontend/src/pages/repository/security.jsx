import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8000";

const SECURITY_RULES = [
  {
    id: "secret",
    level: "critical",
    label: "Potential secret",
    regex:
      /(API_KEY|SECRET_KEY|ACCESS_TOKEN|PRIVATE_KEY)\s*[:=]\s*["'][^"']{8,}["']/i,
    explanation:
      "A credential-like assignment was detected in source. Verify that this is not a real secret and move sensitive values to a secure environment or secret manager.",
  },
  {
    id: "eval",
    level: "high",
    label: "Dynamic code execution",
    regex: /\beval\s*\(/,
    explanation:
      "Dynamic code execution can allow untrusted input to become executable code.",
  },
  {
    id: "html",
    level: "high",
    label: "Raw HTML injection",
    regex: /dangerouslySetInnerHTML/,
    explanation:
      "Raw HTML is being inserted into the UI. Verify that content is trusted or sanitized.",
  },
  {
    id: "innerhtml",
    level: "high",
    label: "Direct HTML assignment",
    regex: /\.innerHTML\s*=/,
    explanation:
      "Direct HTML assignment can create injection risk when input is not trusted or sanitized.",
  },
  {
    id: "shell",
    level: "high",
    label: "Shell execution",
    regex: /subprocess\.[a-zA-Z_]+\([^)]*shell\s*=\s*True/i,
    explanation:
      "Shell execution deserves careful input validation because untrusted arguments can become command injection paths.",
  },
  {
    id: "verify",
    level: "medium",
    label: "TLS verification disabled",
    regex: /verify\s*=\s*False/i,
    explanation:
      "Disabling certificate verification weakens transport security. Verify that this is only used in an intentional development scenario.",
  },
  {
    id: "debug",
    level: "low",
    label: "Debug output",
    regex: /console\.log\s*\(/,
    explanation:
      "Debug logging may accidentally expose sensitive runtime information in production output.",
  },
];

function levelClass(level) {
  if (level === "critical") {
    return "border-red-500/20 bg-red-500/[0.07] text-red-300";
  }

  if (level === "high") {
    return "border-orange-400/15 bg-orange-400/[0.05] text-orange-300";
  }

  if (level === "medium") {
    return "border-amber-400/15 bg-amber-400/[0.05] text-amber-300";
  }

  return "border-slate-400/15 bg-slate-400/[0.05] text-slate-300";
}

function scanContent(content, path) {
  const findings = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    SECURITY_RULES.forEach((rule) => {
      if (!rule.regex.test(line)) return;

      findings.push({
        id: `${path}-${rule.id}-${index + 1}`,
        level: rule.level,
        label: rule.label,
        path,
        line: index + 1,
        explanation: rule.explanation,
      });
    });
  });

  return findings;
}

export default function Security({ repositoryId }) {
  const [files, setFiles] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function runSecurityScan() {
      try {
        setLoading(true);
        setError("");
        setScanProgress(5);

        const response = await fetch(
          `${API_BASE}/api/github/repositories/${repositoryId}/files`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load repository files."
          );
        }

        const indexedFiles = (data.files || []).filter(
          (file) =>
            file.category === "code" ||
            file.category === "config"
        );

        const candidates = indexedFiles
          .filter((file) => Number(file.size || 0) <= 250000)
          .slice(0, 30);

        const results = [];

        for (let i = 0; i < candidates.length; i += 1) {
          if (cancelled) return;

          const file = candidates[i];

          try {
            const contentResponse = await fetch(
              `${API_BASE}/api/github/repositories/${repositoryId}/file-content?path=${encodeURIComponent(
                file.path
              )}`,
              {
                credentials: "include",
              }
            );

            const contentData =
              await contentResponse.json();

            if (contentResponse.ok) {
              results.push(
                ...scanContent(
                  contentData.content || "",
                  file.path
                )
              );
            }
          } catch {
            // Continue scanning other files.
          }

          setScanProgress(
            Math.min(
              95,
              Math.round(
                ((i + 1) / candidates.length) * 100
              )
            )
          );
        }

        if (!cancelled) {
          setFindings(results);
          setScanProgress(100);
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Security scan error:", requestError);
          setError(
            requestError.message ||
              "Unable to scan repository."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    runSecurityScan();

    return () => {
      cancelled = true;
    };
  }, [repositoryId]);

  const counts = useMemo(
    () => ({
      critical: findings.filter(
        (item) => item.level === "critical"
      ).length,
      high: findings.filter(
        (item) => item.level === "high"
      ).length,
      medium: findings.filter(
        (item) => item.level === "medium"
      ).length,
      low: findings.filter(
        (item) => item.level === "low"
      ).length,
    }),
    [findings]
  );

  const visibleFindings =
    filter === "all"
      ? findings
      : findings.filter((item) => item.level === filter);

  const securityScore = Math.max(
    0,
    100 -
      counts.critical * 25 -
      counts.high * 12 -
      counts.medium * 5 -
      counts.low * 2
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-500/[0.07] via-white/[0.02] to-purple-500/[0.05] p-8">
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-red-500/[0.06] blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-red-300/80">
              GitLoop security
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-white">
              Threat Radar
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              A source-level security scan across the currently
              indexed repository files.
            </p>
          </div>

          <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-black/15">
            <div className="text-center">
              <div className="text-3xl font-semibold text-white">
                {loading ? "—" : securityScore}
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-600">
                Radar score
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status */}
      {loading && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">
                Scanning repository...
              </p>

              <p className="mt-1 text-xs text-slate-600">
                GitLoop is checking source files for security
                signals.
              </p>
            </div>

            <span className="text-xs text-purple-300">
              {scanProgress}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-purple-400 transition-all"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="rounded-3xl border border-red-400/15 bg-red-400/[0.04] p-6">
          <p className="text-sm text-red-300">{error}</p>
        </section>
      )}

      {!loading && !error && (
        <>
          {/* Severity overview */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["critical", "Critical"],
              ["high", "High"],
              ["medium", "Medium"],
              ["low", "Low"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-2xl border p-5 text-left transition ${levelClass(
                  key
                )}`}
              >
                <p className="text-[10px] uppercase tracking-[0.18em]">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {counts[key]}
                </p>
              </button>
            ))}
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-xl border px-4 py-2 text-xs transition ${
                filter === "all"
                  ? "border-purple-400/20 bg-purple-400/[0.10] text-purple-200"
                  : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-white"
              }`}
            >
              All findings
            </button>
          </div>

          {/* Findings */}
          {visibleFindings.length === 0 ? (
            <section className="rounded-3xl border border-emerald-400/10 bg-emerald-400/[0.03] p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300">
                ✓
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                No matching security signals
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                The current scan did not find anything matching
                the selected security category.
              </p>
            </section>
          ) : (
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                  Findings
                </p>

                <h3 className="mt-1 text-xl font-semibold text-white">
                  Repository threat surface
                </h3>
              </div>

              <div className="space-y-3">
                {visibleFindings.map((finding) => (
                  <article
                    key={finding.id}
                    className={`rounded-2xl border p-5 ${levelClass(
                      finding.level
                    )}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.18em]">
                          {finding.level}
                        </span>

                        <h4 className="mt-2 text-sm font-semibold text-white">
                          {finding.label}
                        </h4>
                      </div>

                      <span className="font-mono text-[10px] text-slate-500">
                        {finding.path}:{finding.line}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-6 text-slate-400">
                      {finding.explanation}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <p className="text-xs leading-5 text-slate-600">
              Security findings are repository-source signals and
              should be manually verified before treating them as
              confirmed vulnerabilities.
            </p>
          </div>
        </>
      )}
    </div>
  );
}