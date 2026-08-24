import { useAuth } from "../../context/useAuth";

function Topbar() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#07070d]/80 px-6 backdrop-blur-xl">

      <div>
        <p className="text-sm text-slate-400">
          AI Codebase Intelligence
        </p>
      </div>

      <div className="flex items-center gap-4">

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
          🔔
        </button>

        <div className="flex items-center gap-3">

          <img
            src={user?.avatar_url}
            alt={user?.username || "User"}
            className="h-9 w-9 rounded-full border border-white/10"
          />

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {user?.username}
            </p>

            <p className="text-xs text-slate-500">
              GitHub
            </p>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Topbar;