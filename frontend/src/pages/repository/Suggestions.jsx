import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;
function signalIcon(type) {
  if (type === "high") return "!";
  if (type === "medium") return "↗";
  return "✦";
}

function signalClass(type) {
  if (type === "high") {
    return "border-red-400/15 bg-red-400/[0.05] text-red-300";
  }

  if (type === "medium") {
    return "border-amber-400/15 bg-amber-400/[0.05] text-amber-300";
  }

  return "border-purple-400/15 bg-purple-400/[0.05] text-purple-300";
}

function buildSuggestions(files) {
  const suggestions = [];

  const codeFiles = files.filter(
    (file) =>
      file.category === "code" ||
      file.category === "config"
  );

  const documentationFiles = files.filter(
    (file) => file.category === "documentation"
  );

  const largeFiles = codeFiles
    .filter((file) => Number(file.size || 0) > 120000)
    .sort((a, b) => Number(b.size || 0) - Number(a.size || 0))
    .slice(0, 4);

  const todoFiles = codeFiles.filter((file) =>
    /todo|fixme/i.test(file.filename || "")
  );

  const testFiles = codeFiles.filter((file) =>
    /(test|spec)/i.test(file.path || "")
  );

  const hasReadme = files.some((file) =>
    /readme/i.test(file.filename || "")
  );

  if (!hasReadme) {
    suggestions.push({
      id: "documentation-gap",
      type: "medium",
      title: "Add repository documentation",
      description:
        "No README file is visible in the indexed repository. A clear README can document setup, architecture, environment requirements and common developer workflows.",
      evidence: "No README file detected",
      effort: "30–60 min",
    });
  }

  if (largeFiles.length > 0) {
    const first = largeFiles[0];

    suggestions.push({
      id: "large-file",
      type: "medium",
      title: "Inspect large source files",
      description:
        "Large files can become difficult to maintain as responsibilities grow. Consider checking whether these files contain multiple responsibilities that could be separated.",
      evidence: `${first.path} • ${Math.round(
        Number(first.size || 0) / 1024
      )} KB`,
      effort: "30–90 min",
    });
  }

  if (todoFiles.length > 0) {
    suggestions.push({
      id: "todo-hotspots",
      type: "low",
      title: "Review unfinished work markers",
      description:
        "The repository contains filenames with TODO/FIXME-style markers. Review these areas and convert important items into tracked work.",
      evidence: `${todoFiles.length} matching file(s)`,
      effort: "15–45 min",
    });
  }

  if (testFiles.length === 0 && codeFiles.length > 10) {
    suggestions.push({
      id: "test-visibility",
      type: "high",
      title: "Add visible test coverage",
      description:
        "The indexed repository contains a meaningful number of code files, but no obvious test/spec paths were detected from file names. Consider adding or organizing tests around core modules.",
      evidence: "No obvious test/spec files detected",
      effort: "1–3 hrs",
    });
  }

  const configFiles = files.filter(
    (file) => file.category === "config"
  );

  if (configFiles.length > 6) {
    suggestions.push({
      id: "config-sprawl",
      type: "low",
      title: "Review configuration sprawl",
      description:
        "Several configuration files are present. Review whether overlapping configuration can be simplified or documented.",
      evidence: `${configFiles.length} configuration files`,
      effort: "30–60 min",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "clean-signal",
      type: "low",
      title: "Repository signals look clean",
      description:
        "GitLoop did not find a strong improvement signal from the currently indexed file metadata.",
      evidence: `${files.length} indexed files`,
      effort: "No immediate action",
    });
  }

  return suggestions;
}

export default function Suggestions({ repositoryId }) {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

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

        setFiles(data.files || []);
      } catch (requestError) {
        console.error("Suggestions error:", requestError);
        setError(
          requestError.message ||
            "Unable to analyze repository signals."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [repositoryId]);

  const suggestions = useMemo(
    () => buildSuggestions(files),
    [files]
  );

  const visibleSuggestions =
    filter === "all"
      ? suggestions
      : suggestions.filter((item) => item.type === filter);

  const highCount = suggestions.filter(
    (item) => item.type === "high"
  ).length;

  const mediumCount = suggestions.filter(
    (item) => item.type === "medium"
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/[0.10] via-white/[0.025] to-cyan-500/[0.04] p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-purple-300/80">
                GitLoop intelligence
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-white">
                Next Moves
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Practical improvements derived from the repository
                structure and indexed file signals.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                Signals
              </p>

              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-red-300">
                  {highCount} high
                </span>

                <span className="text-sm text-amber-300">
                  {mediumCount} medium
                </span>

                <span className="text-sm text-purple-300">
                  {suggestions.length} total
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "high", "medium", "low"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl border px-4 py-2 text-xs capitalize transition ${
              filter === item
                ? "border-purple-400/20 bg-purple-400/[0.10] text-purple-200"
                : "border-white/10 bg-white/[0.02] text-slate-500 hover:text-slate-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
          <p className="mt-4 text-sm text-slate-500">
            Reading repository signals...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-400/15 bg-red-400/[0.04] p-6">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {visibleSuggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-purple-400/15 hover:bg-white/[0.045]"
            >
              <div className="flex gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold ${signalClass(
                    suggestion.type
                  )}`}
                >
                  {signalIcon(suggestion.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {suggestion.title}
                      </h3>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                        {suggestion.description}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${signalClass(
                        suggestion.type
                      )}`}
                    >
                      {suggestion.type}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>
                      Evidence:{" "}
                      <span className="text-slate-400">
                        {suggestion.evidence}
                      </span>
                    </span>

                    <span>•</span>

                    <span>
                      Effort:{" "}
                      <span className="text-slate-400">
                        {suggestion.effort}
                      </span>
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/repositories/${repositoryId}/ai-chat`
                        )
                      }
                      className="rounded-xl border border-purple-400/15 bg-purple-400/[0.07] px-4 py-2 text-xs text-purple-200 transition hover:bg-purple-400/[0.12]"
                    >
                      Ask GitLoop
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/repositories/${repositoryId}/codebase`
                        )
                      }
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-slate-400 transition hover:text-white"
                    >
                      Inspect Codebase
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}