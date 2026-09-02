function RepositoryCard({ repository }) {
  const {
    name,
    full_name,
    language,
    private: isPrivate,
    html_url,
  } = repository;

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-white/[0.05]">

      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">

          <h3 className="truncate font-medium text-white">
            {name}
          </h3>

          <p className="mt-1 truncate text-sm text-slate-500">
            {full_name}
          </p>

        </div>

        <span className="ml-4 whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-400">
          ● Indexed
        </span>
      </div>


      {/* Repository info */}
      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">

        <span>
          {language || "Unknown"}
        </span>

        <span>·</span>

        <span>
          {isPrivate ? "Private" : "Public"}
        </span>

      </div>


      {/* Bottom */}
      <div className="mt-6 flex items-center justify-between">

        <span className="text-xs text-slate-600">
          AI analysis available
        </span>

        <button
          onClick={() => window.open(html_url, "_blank")}
          className="text-sm text-violet-400 transition group-hover:text-violet-300"
        >
          Open →
        </button>

      </div>

    </div>
  );
}

export default RepositoryCard;