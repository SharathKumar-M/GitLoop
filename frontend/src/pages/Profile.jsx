import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../context/useAuth";


export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);


  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();

      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#05050b] text-white">

      <div className="mx-auto max-w-4xl px-6 py-10 lg:px-8">

        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to dashboard
        </button>


        {/* Header */}
        <div className="mb-8">

          <p className="text-sm text-slate-500">
            Account
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Profile
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your GitLoop account and GitHub connection.
          </p>

        </div>


        {/* Profile card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center gap-5">

            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="h-20 w-20 rounded-full border border-white/10"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-2xl font-semibold">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}


            <div>

              <h2 className="text-2xl font-semibold">
                {user?.username || "Developer"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                GitHub account
              </p>

            </div>

          </div>


          {/* Account information */}
          <div className="mt-8 border-t border-white/10 pt-6">

            <h3 className="text-sm font-medium text-slate-300">
              Account information
            </h3>


            <div className="mt-4 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                <p className="text-xs text-slate-500">
                  Username
                </p>

                <p className="mt-1 text-sm text-white">
                  {user?.username || "—"}
                </p>

              </div>


              <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                <p className="text-xs text-slate-500">
                  Email
                </p>

                <p className="mt-1 text-sm text-white">
                  {user?.email || "Not available"}
                </p>

              </div>

            </div>

          </div>


          {/* GitHub connection */}
          <div className="mt-8 border-t border-white/10 pt-6">

            <h3 className="text-sm font-medium text-slate-300">
              GitHub connection
            </h3>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">

              <div>
                <p className="text-sm font-medium text-white">
                  GitHub connected
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  GitLoop is connected to your GitHub account.
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-400">
                Connected
              </span>

            </div>

          </div>


          {/* Logout */}
          <div className="mt-8 border-t border-white/10 pt-6">

            <h3 className="text-sm font-medium text-slate-300">
              Session
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Sign out of this GitLoop account.
            </p>


            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-2.5 text-sm text-red-400 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}