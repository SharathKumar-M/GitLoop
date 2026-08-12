function RepositoryPreview() {
  return (
    <section className="relative mx-auto mt-20 min-h-[520px] w-full max-w-7xl px-4 pb-24">

      {/* =========================================
          THREE DASHBOARD CARDS
      ========================================= */}

      <div className="relative flex items-center justify-center">


        {/* =====================================
            LEFT CARD
        ===================================== */}

        <div className="absolute
    left-[-40px]
    top-20
    z-20
    hidden
    w-[280px]
    -rotate-[10deg]
    transform
    rounded-2xl
    border
    border-violet-400/20
    bg-[#0b0b15]/95
    p-5
    shadow-[0_30px_80px_rgba(0,0,0,0.55)]
    backdrop-blur-xl
    transition-all
    duration-700
    animate-[gitloop-float-left_6s_ease-in-out_infinite]
    hover:-translate-y-3
    hover:rotate-[-7deg]
    lg:block">

          {/* Header */}

          <div className="flex items-center justify-between">

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400">
                AI Activity
              </p>

              <h3 className="mt-1 text-base font-semibold text-white">
                Recent Actions
              </h3>
            </div>

            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_#a855f7]" />

          </div>


          {/* Activities */}

          <div className="mt-6 space-y-3">

            <Activity
              title="Repository Indexed"
              description="127 files analyzed"
              color="violet"
            />

            <Activity
              title="AI Summary Generated"
              description="Architecture understood"
              color="cyan"
            />

            <Activity
              title="Security Scan"
              description="No critical issues"
              color="emerald"
            />

            <Activity
              title="Code Review Complete"
              description="4 suggestions found"
              color="amber"
            />

          </div>


          {/* Footer */}

          <div className="mt-5 border-t border-white/10 pt-3">
            <p className="text-[10px] text-slate-500">
              GitLoop AI • Live activity
            </p>
          </div>

        </div>


        {/* =====================================
            CENTER CARD
        ===================================== */}

        <div className="relative
    z-30
    w-full
    max-w-4xl
    transition-transform
    duration-700
    hover:scale-[1.01]">

          {/* Glow */}

          <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[140px]" />


          {/* Dashboard */}

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/95 shadow-[0_35px_100px_rgba(0,0,0,0.65)] backdrop-blur-xl">

            {/* Top browser bar */}

            <div className="flex h-11 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4">

              <div className="flex items-center gap-2">

                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />

              </div>


              <p className="text-[10px] text-slate-500">
                GitLoop Repository Intelligence
              </p>


              <div className="flex items-center gap-2 text-[10px] text-emerald-400">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                Indexed

              </div>

            </div>


            {/* Main dashboard */}

            <div className="flex min-h-[370px]">


              {/* Sidebar */}

              <aside className="hidden w-44 shrink-0 border-r border-white/10 bg-white/[0.02] p-4 sm:block">

                {/* Logo */}

                <div className="mb-6 flex items-center gap-2">

                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-semibold text-violet-300">
                    G
                  </div>

                  <span className="text-sm font-semibold text-white">
                    GitLoop
                  </span>

                </div>


                {/* Navigation */}

                <div className="space-y-1">

                  <NavItem
                    name="Overview"
                    active
                  />

                  <NavItem name="Files" />

                  <NavItem name="AI Chat" />

                  <NavItem name="Search" />

                  <NavItem name="Architecture" />

                  <NavItem name="Code Review" />

                </div>

              </aside>


              {/* Content */}

              <div className="min-w-0 flex-1 p-5">

                {/* Repository Header */}

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400">
                      Repository
                    </p>

                    <h2 className="mt-1 truncate text-lg font-semibold text-white sm:text-xl">
                      shopping-assistant
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-500">
                      AI-powered codebase overview
                    </p>

                  </div>


                  <div className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-slate-400">
                    main
                  </div>

                </div>


                {/* Stats */}

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <Stat
                    label="Files"
                    value="127"
                  />

                  <Stat
                    label="Lines of Code"
                    value="24.8K"
                  />

                  <Stat
                    label="Languages"
                    value="6"
                  />

                </div>


                {/* Bottom Panels */}

                <div className="mt-4 grid gap-4 md:grid-cols-2">


                  {/* Languages */}

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

                    <div className="flex items-center justify-between">

                      <p className="text-xs font-medium text-white">
                        Languages
                      </p>

                      <span className="text-[10px] text-slate-500">
                        Distribution
                      </span>

                    </div>


                    <div className="mt-4 space-y-3">

                      <Language
                        name="JavaScript"
                        percentage="72%"
                        width="72%"
                      />

                      <Language
                        name="Python"
                        percentage="18%"
                        width="18%"
                      />

                      <Language
                        name="CSS"
                        percentage="7%"
                        width="7%"
                      />

                      <Language
                        name="HTML"
                        percentage="3%"
                        width="3%"
                      />

                    </div>

                  </div>


                  {/* AI Summary */}

                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">

                    <div className="flex items-center gap-2">

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                        ✦
                      </div>

                      <div>

                        <p className="text-xs font-medium text-white">
                          AI Repository Summary
                        </p>

                        <p className="text-[9px] text-violet-400">
                          Generated by GitLoop
                        </p>

                      </div>

                    </div>


                    <p className="mt-4 text-[11px] leading-5 text-slate-400">

                      Full-stack shopping assistant with a React
                      frontend and backend API handling products,
                      authentication and data communication.

                    </p>


                    <div className="mt-4 flex items-center gap-2 text-[9px]">

                      <span className="text-violet-300">
                        AI analyzed
                      </span>

                      <span className="text-slate-600">
                        •
                      </span>

                      <span className="text-slate-500">
                        127 files
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================
            RIGHT CARD
        ===================================== */}

        <div className="absolute
    right-[-40px]
    top-28
    z-20
    hidden
    w-[280px]
    rotate-[10deg]
    transform
    rounded-2xl
    border
    border-cyan-400/20
    bg-[#0b0b15]/95
    p-5
    shadow-[0_30px_80px_rgba(0,0,0,0.55)]
    backdrop-blur-xl
    transition-all
    duration-700
    animate-[gitloop-float-right_7s_ease-in-out_infinite]
    hover:-translate-y-3
    hover:rotate-[7deg]
    lg:block">

          {/* Header */}

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                Code Analysis
              </p>

              <h3 className="mt-1 text-base font-semibold text-white">
                Repository Health
              </h3>

            </div>

            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

          </div>


          {/* Metrics */}

          <div className="mt-7 space-y-5">

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


          {/* Mini insight */}

          <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-3">

            <p className="text-[10px] text-slate-500">
              GitLoop recommendation
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-300">
              Improve test coverage around authentication and payment services.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================
   SMALL COMPONENTS
========================================= */


function Activity({
  title,
  description,
  color,
}) {
  const colorMap = {
    violet:
      "bg-violet-400 shadow-[0_0_10px_#a855f7]",

    cyan:
      "bg-cyan-400 shadow-[0_0_10px_#22d3ee]",

    emerald:
      "bg-emerald-400 shadow-[0_0_10px_#34d399]",

    amber:
      "bg-amber-400 shadow-[0_0_10px_#fbbf24]",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">

      <div className="flex items-start gap-3">

        <span
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${colorMap[color]}`}
        />

        <div className="min-w-0">

          <p className="truncate text-xs font-medium text-white">
            {title}
          </p>

          <p className="mt-1 truncate text-[10px] text-slate-500">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}


function NavItem({
  name,
  active = false,
}) {
  return (
    <div
      className={`
        rounded-lg
        px-3
        py-2
        text-xs
        transition
        ${
          active
            ? "bg-violet-500/15 text-violet-300"
            : "text-slate-500"
        }
      `}
    >
      {name}
    </div>
  );
}


function Stat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">

      <p className="text-[10px] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>

    </div>
  );
}


function Language({
  name,
  percentage,
  width,
}) {
  return (
    <div>

      <div className="mb-1 flex items-center justify-between">

        <span className="text-[10px] text-slate-400">
          {name}
        </span>

        <span className="text-[10px] text-slate-500">
          {percentage}
        </span>

      </div>


      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{
            width,
          }}
        />

      </div>

    </div>
  );
}


function Metric({
  label,
  value,
  width,
}) {
  return (
    <div>

      <div className="flex items-center justify-between">

        <span className="text-[10px] text-slate-400">
          {label}
        </span>

        <span className="text-xs font-medium text-white">
          {value}
        </span>

      </div>


      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{
            width,
          }}
        />

      </div>

    </div>
  );
}


export default RepositoryPreview;