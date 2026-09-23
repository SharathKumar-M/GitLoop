import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const mainItems = [
    {
      name: "Overview",
      path: "/dashboard",
      icon: "⌂",
    },
    {
      name: "Repositories",
      path: "/repositories",
      icon: "◇",
    },
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-[#070812]/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-[66px] items-center border-b border-white/10 px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-2xl font-semibold tracking-tight text-white"
        >
          Git<span className="text-purple-400">Loop</span>
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-5">
        <p className="px-3 pb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
          Workspace
        </p>

        <div className="space-y-1">
          {mainItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  active
                    ? "bg-purple-500/10 text-purple-300"
                    : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${
                    active
                      ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                      : "border-white/5 bg-white/[0.02] text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="text-sm font-medium">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => navigate("/settings")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
            location.pathname.startsWith("/settings")
              ? "bg-purple-500/10 text-purple-300"
              : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
          }`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-sm">
            ⚙
          </span>

          <span className="text-sm font-medium">
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
}