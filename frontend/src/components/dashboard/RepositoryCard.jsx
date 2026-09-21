import { useNavigate } from "react-router-dom";

export default function RepositoryCard({ repository }) {
  const navigate = useNavigate();

  function handleOpenRepository() {
    navigate(`/repositories/${repository.id}`);
  }

  return (
    <div
      onClick={handleOpenRepository}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition duration-300 hover:border-purple-500/20 hover:bg-white/[0.05]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-white">
            {repository.name}
          </h2>

          <p className="mt-1 truncate text-sm text-slate-500">
            {repository.full_name}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
            repository.private
              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {repository.private ? "Private" : "Public"}
        </span>
      </div>

      {/* Repository information */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Language
          </span>

          <span className="text-sm text-slate-300">
            {repository.language || "Unknown"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Default branch
          </span>

          <span className="text-sm text-slate-300">
            {repository.default_branch || "Unknown"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            GitLoop status
          </span>

          <span className="text-sm text-purple-400">
            Not indexed
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <button
          onClick={(event) => {
            event.stopPropagation();
            handleOpenRepository();
          }}
          className="text-sm font-medium text-purple-400 transition hover:text-purple-300"
        >
          View Repository →
        </button>

        <a
          href={repository.html_url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="text-sm text-slate-500 transition hover:text-white"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  );
}