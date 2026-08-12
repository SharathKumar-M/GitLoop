function FloatingDashboard({ side = "left" }) {
  const isLeft = side === "left";

  return (
    <div
      className={`
        absolute
        top-24
        hidden
        w-[280px]
        lg:block
        ${isLeft ? "left-[-80px]" : "right-[-80px]"}
      `}
    >
      <div
        className={`
          relative
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-[#0b0b14]/90
          p-4
          shadow-[0_30px_80px_rgba(0,0,0,0.55)]
          backdrop-blur-xl
          ${isLeft ? "-rotate-[8deg]" : "rotate-[8deg]"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400">
              {isLeft ? "AI Activity" : "Code Analysis"}
            </p>

            <h3 className="mt-1 text-sm font-semibold text-white">
              {isLeft ? "Recent Actions" : "Repository Health"}
            </h3>
          </div>

          <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_#8b5cf6]" />
        </div>

        {/* Main visual */}
        {isLeft ? (
          <div className="mt-5 space-y-3">
            <ActivityItem
              color="violet"
              title="Repository Indexed"
              text="127 files analyzed"
            />

            <ActivityItem
              color="cyan"
              title="AI Summary Generated"
              text="Architecture understood"
            />

            <ActivityItem
              color="emerald"
              title="Code Review Complete"
              text="4 suggestions found"
            />

            <ActivityItem
              color="amber"
              title="Security Scan"
              text="No critical issues"
            />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <Metric
              label="Code Quality"
              value="94%"
              width="94%"
            />

            <Metric
              label="Maintainability"
              value="A"
              width="86%"
            />

            <Metric
              label="Security"
              value="92%"
              width="92%"
            />

            <Metric
              label="Test Coverage"
              value="81%"
              width="81%"
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 border-t border-white/10 pt-3 text-[10px] text-slate-500">
          GitLoop AI • Live analysis
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ color, title, text }) {
  const colors = {
    violet: "bg-violet-400 shadow-[0_0_10px_#a78bfa]",
    cyan: "bg-cyan-400 shadow-[0_0_10px_#22d3ee]",
    emerald: "bg-emerald-400 shadow-[0_0_10px_#34d399]",
    amber: "bg-amber-400 shadow-[0_0_10px_#fbbf24]",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <span className={`h-2.5 w-2.5 rounded-full ${colors[color]}`} />

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-white">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, width }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{ width }}
        />
      </div>
    </div>
  );
}

export default FloatingDashboard;