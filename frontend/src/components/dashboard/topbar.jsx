import { useNavigate } from "react-router-dom";


export default function Topbar({ user }) {
  const navigate = useNavigate();


  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#05050b]/80 px-6 backdrop-blur-xl lg:px-8">

      {/* Left side */}
      <div>
        <p className="text-sm text-slate-500">
          GitLoop
        </p>

        <h2 className="text-lg font-semibold text-white">
          Codebase Intelligence
        </h2>
      </div>


      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* Notifications */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 10-12 0v.75a8.967 8.967 0 01-2.31 6.022 23.848 23.848 0 005.454 1.31m5.713 0a24.255 24.255 0 01-5.713 0m5.713 0a3 3 0 11-5.713 0"
            />
          </svg>
        </button>


        {/* Profile */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-white/10 hover:bg-white/[0.05]"
        >

          {/* Avatar */}
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username || "Profile"}
              className="h-10 w-10 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-violet-500/20 text-sm font-semibold text-violet-300">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}


          {/* User information */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {user?.username || "Developer"}
            </p>

            <p className="text-xs text-slate-500">
              GitHub profile
            </p>
          </div>


          {/* Arrow */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="hidden h-4 w-4 text-slate-500 sm:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>

        </button>

      </div>

    </header>
  );
}