function RepositoryCard({
  name,
  language,
  files,
  status = "Indexed",
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-white/[0.05]">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="font-medium text-white">
            {name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {language} · {files} files
          </p>

        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-400">
          ● {status}
        </span>

      </div>

      <div className="mt-6 flex items-center justify-between">

        <span className="text-xs text-slate-600">
          AI analysis available
        </span>

        <button className="text-sm text-violet-400 transition group-hover:text-violet-300">
          Open →
        </button>

      </div>

    </div>
  );
}

export default RepositoryCard;