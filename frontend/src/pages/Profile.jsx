import { useNavigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import { useAuth } from "../context/useAuth";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-purple-400">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Profile
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your GitLoop account and GitHub connection.
          </p>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || "User"}
                  className="h-24 w-24 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-semibold text-white">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            {/* User information */}
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {user?.username || "Unknown User"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                GitHub connected account
              </p>

              {user?.email && (
                <p className="mt-3 text-sm text-slate-400">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* GitHub connection */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                GitHub Connection
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your GitHub account is connected to GitLoop. GitLoop
                can use your GitHub App installation to access the
                repositories you have authorized.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              Connected
            </div>
          </div>
        </div>

        {/* Account actions */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white">
            Account Actions
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign out of your current GitLoop session.
          </p>

          <button
            onClick={handleLogout}
            className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300"
          >
            Logout
          </button>
        </div>

        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 text-sm text-slate-500 transition hover:text-white"
        >
          ← Back to Dashboard
        </button>
      </div>
    </AppLayout>
  );
}