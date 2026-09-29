import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

function statusClass(status) {
  if (status === "COMPLETED") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "PARTIAL") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (status === "FAILED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-purple-400/20 bg-purple-400/10 text-purple-300";
}

export default function PublicRepositoriesSection() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [repositories, setRepositories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function loadPublicRepositories() {
    try {
      setLoadingList(true);
      const response = await fetch(
        `${API_BASE}/api/github/repositories/public`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load public repositories."
        );
      }

      setRepositories(data.repositories || []);
    } catch (requestError) {
      console.error("Public repositories error:", requestError);
      setError(
        requestError.message || "Unable to load public repositories."
      );
    } finally {
      setLoadingList(false);
    }
  }

  async function analyzeRepository(event) {
    event.preventDefault();

    if (!url.trim()) {
      setError("Paste a GitHub repository URL first.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/github/repositories/public/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ url: url.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to analyze the public repository."
        );
      }

      setUrl("");
      await loadPublicRepositories();
      navigate(`/repositories/${data.repository_id}/information`);
    } catch (requestError) {
      console.error("Public repository analyze error:", requestError);
      setError(
        requestError.message || "Unable to analyze the public repository."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    loadPublicRepositories();
  }, []);

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/[0.06] via-white/[0.025] to-purple-500/[0.05] p-7">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-purple-500/[0.08] blur-3xl" />

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
            Public repositories
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Analyze any open-source GitHub repository
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Paste the repository URL. GitLoop reads the public repository and
            sends it through the same indexing and repository workspace flow.
          </p>

          <form
            onSubmit={analyzeRepository}
            className="mt-6 flex flex-col gap-3 lg:flex-row"
          >
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30 focus:bg-black/30"
              disabled={analyzing}
            />
            <button
              type="submit"
              disabled={analyzing}
              className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.08] px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? "Analyzing repository..." : "Analyze Repository"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600">
              Your analyzed public repositories
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              Public repository history
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-500">
            {repositories.length} repositories
          </span>
        </div>

        {loadingList ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-8 text-center text-sm text-slate-500">
            Loading public repositories...
          </div>
        ) : repositories.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center">
            <p className="text-sm text-slate-400">
              No public repository has been analyzed yet.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Paste a GitHub repository URL above to start.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {repositories.map((repository) => {
              const status = repository.index?.status || "NOT_INDEXED";

              return (
                <button
                  key={repository.id}
                  type="button"
                  onClick={() =>
                    navigate(`/repositories/${repository.id}/information`)
                  }
                  className="group rounded-2xl border border-white/10 bg-black/10 p-5 text-left transition hover:border-purple-400/20 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-white">
                        {repository.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-600">
                        {repository.full_name}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${statusClass(
                        status
                      )}`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </div>

                  {repository.description && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                      {repository.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>★ {repository.stars ?? 0}</span>
                    <span>⑂ {repository.forks ?? 0}</span>
                    <span>
                      {repository.index?.files_indexed ?? 0} files indexed
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
