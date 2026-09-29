import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";

function formatBytes(value) {
  const bytes = Number(value || 0);

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function reviewFile(content, path) {
  const findings = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (/TODO|FIXME/i.test(line)) {
      findings.push({
        id: `todo-${lineNumber}`,
        level: "low",
        title: "Unfinished-work marker",
        line: lineNumber,
        explanation:
          "This line contains a TODO/FIXME marker. Review whether the item is still required and track important work explicitly.",
      });
    }

    if (/console\.log\s*\(/.test(line)) {
      findings.push({
        id: `console-${lineNumber}`,
        level: "low",
        title: "Debug logging",
        line: lineNumber,
        explanation:
          "Console logging is present in this file. Check whether the output is intended for production or should be replaced with structured logging.",
      });
    }

    if (line.length > 140) {
      findings.push({
        id: `long-${lineNumber}`,
        level: "medium",
        title: "Long source line",
        line: lineNumber,
        explanation:
          "This line is unusually long and may make the code harder to scan or maintain.",
      });
    }

    if (/dangerouslySetInnerHTML/.test(line)) {
      findings.push({
        id: `html-${lineNumber}`,
        level: "high",
        title: "Raw HTML injection point",
        line: lineNumber,
        explanation:
          "This code writes raw HTML into the UI. Verify that the source is trusted and properly sanitized.",
      });
    }

    if (/\beval\s*\(/.test(line)) {
      findings.push({
        id: `eval-${lineNumber}`,
        level: "high",
        title: "Dynamic code execution",
        line: lineNumber,
        explanation:
          "Dynamic evaluation can create security and maintainability risks. Verify whether this behavior is necessary.",
      });
    }

    if (/except\s*:\s*$/.test(line.trim())) {
      findings.push({
        id: `except-${lineNumber}`,
        level: "medium",
        title: "Broad exception handling",
        line: lineNumber,
        explanation:
          "A bare exception handler catches every exception type. Consider handling expected failures more specifically.",
      });
    }
  });

  if (lines.length > 500) {
    findings.push({
      id: "large-file",
      level: "medium",
      title: "Large file responsibility",
      line: null,
      explanation:
        "This file is longer than 500 lines. Review whether multiple responsibilities could be separated into smaller modules.",
    });
  }

  return findings;
}

function levelClass(level) {
  if (level === "high") {
    return "border-red-400/15 bg-red-400/[0.05] text-red-300";
  }

  if (level === "medium") {
    return "border-amber-400/15 bg-amber-400/[0.05] text-amber-300";
  }

  return "border-slate-400/15 bg-slate-400/[0.05] text-slate-300";
}

export default function CodeReview({ repositoryId }) {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);
        setError("");

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

        const codeFiles = (data.files || []).filter(
          (file) =>
            file.category === "code" ||
            file.category === "config"
        );

        setFiles(codeFiles);

        if (codeFiles.length > 0) {
          setSelectedPath(codeFiles[0].path);
        }
      } catch (requestError) {
        console.error("Code review file error:", requestError);
        setError(
          requestError.message ||
            "Unable to load repository files."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [repositoryId]);

  useEffect(() => {
    if (!selectedPath) return;

    async function loadContent() {
      try {
        setContentLoading(true);

        const response = await fetch(
          `${API_BASE}/api/github/repositories/${repositoryId}/file-content?path=${encodeURIComponent(
            selectedPath
          )}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load file content."
          );
        }

        setContent(data.content || "");
      } catch (requestError) {
        console.error("Code review content error:", requestError);
        setContent("");
      } finally {
        setContentLoading(false);
      }
    }

    loadContent();
  }, [repositoryId, selectedPath]);

  const findings = useMemo(
    () => reviewFile(content, selectedPath),
    [content, selectedPath]
  );

  const highCount = findings.filter(
    (item) => item.level === "high"
  ).length;

  const mediumCount = findings.filter(
    (item) => item.level === "medium"
  ).length;

  const lowCount = findings.filter(
    (item) => item.level === "low"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.02] to-purple-500/[0.05] p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
              GitLoop review engine
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-white">
              CodeLens
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Review actual indexed source files and surface concrete
              review opportunities.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3 text-center">
              <div className="text-lg font-semibold text-red-300">
                {highCount}
              </div>
              <div className="text-[10px] text-slate-600">
                HIGH
              </div>
            </div>

            <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] px-4 py-3 text-center">
              <div className="text-lg font-semibold text-amber-300">
                {mediumCount}
              </div>
              <div className="text-[10px] text-slate-600">
                MEDIUM
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center">
              <div className="text-lg font-semibold text-slate-300">
                {lowCount}
              </div>
              <div className="text-[10px] text-slate-600">
                LOW
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="mt-4 text-sm text-slate-500">
            Loading review targets...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.04] p-6">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-sm text-slate-500">
            No reviewable source files were found.
          </p>
        </div>
      )}

      {!loading && !error && files.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          {/* File list */}
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 px-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                Review target
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {files.length} files
              </p>
            </div>

            <div className="max-h-[620px] space-y-1 overflow-y-auto">
              {files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    selectedPath === file.path
                      ? "bg-purple-500/[0.10] text-white"
                      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  <p className="truncate text-xs font-medium">
                    {file.filename}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-slate-600">
                    {file.path}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-700">
                    {formatBytes(file.size)}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          {/* Source */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10]">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs text-slate-500">
                Source
              </p>

              <p className="mt-1 truncate font-mono text-sm text-slate-300">
                {selectedPath}
              </p>
            </div>

            <div className="max-h-[620px] overflow-auto p-5">
              {contentLoading ? (
                <p className="text-sm text-slate-600">
                  Loading source...
                </p>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-400">
                  {content || "No source content available."}
                </pre>
              )}
            </div>
          </section>

          {/* Findings */}
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                  Findings
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {findings.length} review signal
                  {findings.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {findings.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
                <p className="text-sm font-medium text-emerald-300">
                  No obvious review signals
                </p>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  The current file did not trigger the built-in
                  review checks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {findings.map((finding) => (
                  <article
                    key={finding.id}
                    className={`rounded-2xl border p-4 ${levelClass(
                      finding.level
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.16em]">
                        {finding.level}
                      </span>

                      {finding.line && (
                        <span className="font-mono text-[10px] text-slate-500">
                          L{finding.line}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-semibold text-white">
                      {finding.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {finding.explanation}
                    </p>
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/repositories/${repositoryId}/ai-chat`
                )
              }
              className="mt-5 w-full rounded-xl border border-purple-400/15 bg-purple-400/[0.07] px-4 py-3 text-xs text-purple-200 transition hover:bg-purple-400/[0.12]"
            >
              Ask GitLoop for deeper review
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}