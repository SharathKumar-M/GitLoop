import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Overview", path: "/dashboard", icon: "⌂" },
  { name: "Repositories", path: "/repositories", icon: "◈" },
  { name: "AI Chat", path: "/chat", icon: "✦" },
  { name: "Search", path: "/search", icon: "⌕" },
  { name: "Architecture", path: "/architecture", icon: "⌘" },
  { name: "Code Review", path: "/code-review", icon: "✓" },
  { name: "Security", path: "/security", icon: "◇" },
];

function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#08080f] lg:flex lg:flex-col">

      {/* Logo */}

      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <span className="text-xl font-semibold tracking-tight text-white">
          Git<span className="text-violet-400">Loop</span>
        </span>
      </div>

      {/* Navigation */}

      <nav className="flex-1 space-y-1 px-3 py-6">

        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-violet-500/10 text-violet-300"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
              }`
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-xs">
              {item.icon}
            </span>

            {item.name}
          </NavLink>
        ))}

      </nav>

      {/* Bottom */}

      <div className="border-t border-white/10 p-3">

        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">
            ⚙
          </span>

          Settings
        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;