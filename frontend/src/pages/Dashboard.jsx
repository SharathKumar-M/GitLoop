import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import RepositoryCard from "../components/dashboard/RepositoryCard";

import { useAuth } from "../context/useAuth";


function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "Unknown time";
  }

  const date = new Date(timestamp);
  const now = new Date();

  const diffInSeconds = Math.floor(
    (now - date) / 1000
  );

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(
    diffInSeconds / 60
  );

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(
    diffInMinutes / 60
  );

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(
    diffInHours / 24
  );

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString();
}


export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [loadingRepositories, setLoadingRepositories] = useState(true);
  const [repositoryError, setRepositoryError] = useState("");

  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState("");


  // ============================================================
  // FETCH REPOSITORIES
  // ============================================================

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoadingRepositories(true);
        setRepositoryError("");

        const response = await fetch(
          "http://localhost:8000/api/github/repositories",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch repositories (${response.status})`
          );
        }

        const data = await response.json();

        setRepositories(data.repositories || []);
      } catch (error) {
        console.error(
          "Failed to fetch repositories:",
          error
        );

        setRepositoryError(
          "Unable to load your GitHub repositories."
        );
      } finally {
        setLoadingRepositories(false);
      }
    };

    fetchRepositories();
  }, []);


  // ============================================================
  // FETCH RECENT ACTIVITY
  // ============================================================

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoadingActivity(true);
        setActivityError("");

        const response = await fetch(
          "http://localhost:8000/api/github/activity",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch activity (${response.status})`
          );
        }

        const data = await response.json();

        setActivities(data.activities || []);
      } catch (error) {
        console.error(
          "Failed to fetch activity:",
          error
        );

        setActivityError(
          "Unable to load recent activity."
        );
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, []);


  const visibleActivities = activities.slice(0, 6);
  const visibleRepositories = repositories.slice(0, 5);


  return (
    <div className="min-h-screen bg-[#03040a] text-white">

      {/* ====================================================== */}
      {/* BACKGROUND */}
      {/* ====================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        {/* Main ambient glows */}
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-600/[0.07] blur-[150px]" />

        <div className="absolute -left-48 top-[35%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.05] blur-[150px]" />

        <div className="absolute right-[15%] bottom-[-200px] h-[500px] w-[500px] rounded-full bg-fuchsia-600/[0.04] blur-[150px]" />


        {/* Technical grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />


        {/* Network / AI lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.10]"
          viewBox="0 0 1600 1100"
          preserveAspectRatio="none"
        >

          {/* Upper-right network */}
          <path
            d="M1450 60 C1300 130 1340 220 1190 290 C1060 350 1090 450 930 510"
            fill="none"
            stroke="rgba(167,139,250,0.65)"
            strokeWidth="1"
          />

          <path
            d="M1560 180 C1400 250 1430 360 1270 410 C1120 470 1170 570 990 630"
            fill="none"
            stroke="rgba(96,165,250,0.55)"
            strokeWidth="1"
          />

          <path
            d="M1340 130 L1230 220 L1120 230"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />

          <path
            d="M1270 410 L1160 360 L1060 410"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />


          {/* Left-side network */}
          <path
            d="M0 760 C150 700 130 560 310 500 C470 440 450 340 620 270"
            fill="none"
            stroke="rgba(59,130,246,0.45)"
            strokeWidth="1"
          />

          <path
            d="M120 980 C260 900 300 800 470 760 C630 720 630 610 800 560"
            fill="none"
            stroke="rgba(139,92,246,0.40)"
            strokeWidth="1"
          />

          <path
            d="M310 500 L220 420 L100 440"
            fill="none"
            stroke="rgba(255,255,255,0.17)"
            strokeWidth="1"
          />

          <path
            d="M470 760 L560 830 L680 800"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />


          {/* Nodes */}
          <circle
            cx="1450"
            cy="60"
            r="4"
            fill="rgba(196,181,253,0.7)"
          />

          <circle
            cx="1190"
            cy="290"
            r="3"
            fill="rgba(196,181,253,0.55)"
          />

          <circle
            cx="930"
            cy="510"
            r="5"
            fill="rgba(196,181,253,0.65)"
          />

          <circle
            cx="1270"
            cy="410"
            r="4"
            fill="rgba(147,197,253,0.6)"
          />

          <circle
            cx="990"
            cy="630"
            r="3"
            fill="rgba(147,197,253,0.45)"
          />

          <circle
            cx="310"
            cy="500"
            r="4"
            fill="rgba(147,197,253,0.55)"
          />

          <circle
            cx="620"
            cy="270"
            r="3"
            fill="rgba(147,197,253,0.45)"
          />

          <circle
            cx="470"
            cy="760"
            r="4"
            fill="rgba(196,181,253,0.55)"
          />

          <circle
            cx="800"
            cy="560"
            r="5"
            fill="rgba(196,181,253,0.5)"
          />

        </svg>

      </div>


      {/* ====================================================== */}
      {/* PAGE */}
      {/* ====================================================== */}

      <div className="relative z-10 flex min-h-screen">

        {/* Sidebar */}
        <Sidebar />


        {/* Main */}
        <div className="relative flex-1">

          {/* Topbar */}
          <Topbar user={user} />


          {/* Content */}
          <main className="p-6 lg:p-8">


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <section className="mb-8">

              <p className="text-sm text-slate-500">
                Overview
              </p>

              <div className="mt-1 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

                <div>

                  <h1 className="text-3xl font-semibold tracking-tight text-white">
                    Welcome back, {user?.username || "Developer"}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Your GitHub activity, repositories, and codebase
                    intelligence in one place.
                  </p>

                </div>

              </div>

            </section>


            {/* ================================================= */}
            {/* CODEBASE INTELLIGENCE */}
            {/* ================================================= */}

            <section className="relative mb-8 overflow-hidden rounded-3xl border border-violet-400/15 bg-[#0b0a14]/80 backdrop-blur-xl">

              {/* Internal glow */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="pointer-events-none absolute bottom-[-100px] left-[35%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />


              <div className="relative flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">

                <div className="max-w-2xl">

                  <div className="mb-4 flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">

                      <span className="text-lg">
                        ◈
                      </span>

                    </div>

                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/80">
                      Codebase Intelligence
                    </span>

                  </div>


                  <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                    Your code is connected.
                  </h2>


                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 lg:text-base">
                    GitLoop can now see your repositories and developer
                    activity. Choose a repository to start exploring
                    your codebase.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() => navigate("/repositories")}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-300 transition hover:border-violet-300/30 hover:bg-violet-500/15 hover:text-violet-200"
                >
                  Explore repositories

                  <span className="ml-2">
                    →
                  </span>
                </button>

              </div>

            </section>


            {/* ================================================= */}
            {/* STATS */}
            {/* ================================================= */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Repositories"
                value={repositories.length}
              />

              <StatCard
                title="Public Repositories"
                value={
                  repositories.filter(
                    (repo) => repo.private === false
                  ).length
                }
              />

              <StatCard
                title="Private Repositories"
                value={
                  repositories.filter(
                    (repo) => repo.private === true
                  ).length
                }
              />

              <StatCard
                title="Languages"
                value={
                  new Set(
                    repositories
                      .map((repo) => repo.language)
                      .filter(Boolean)
                  ).size
                }
              />

            </div>


            {/* ================================================= */}
            {/* RECENT ACTIVITY */}
            {/* ================================================= */}

            <section className="mt-10">

              <div className="mb-5 flex items-end justify-between">

                <div>

                  <h2 className="text-xl font-semibold">
                    Recent activity
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Your latest GitHub work.
                  </p>

                </div>

              </div>


              {/* Loading */}
              {loadingActivity && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center backdrop-blur-md">

                  <p className="text-sm text-slate-400">
                    Loading recent activity...
                  </p>

                </div>
              )}


              {/* Error */}
              {!loadingActivity && activityError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">

                  <p className="text-sm text-red-400">
                    {activityError}
                  </p>

                </div>
              )}


              {/* Empty */}
              {!loadingActivity &&
                !activityError &&
                activities.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center backdrop-blur-md">

                    <p className="text-sm text-slate-300">
                      No recent activity found.
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Your commits and pull requests will appear here.
                    </p>

                  </div>
                )}


              {/* Activity */}
              {!loadingActivity &&
                !activityError &&
                visibleActivities.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md">

                    {visibleActivities.map(
                      (activity, index) => {

                        const isCommit =
                          activity.type === "commit";

                        return (
                          <div
                            key={
                              activity.sha ||
                              `${activity.type}-${activity.number}-${index}`
                            }
                            className={`flex items-start gap-4 p-5 transition hover:bg-white/[0.035] ${
                              index !==
                              visibleActivities.length - 1
                                ? "border-b border-white/10"
                                : ""
                            }`}
                          >

                            {/* Icon */}
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                isCommit
                                  ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                              }`}
                            >

                              {isCommit ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="3"
                                  />

                                  <path
                                    strokeLinecap="round"
                                    d="M3 12h6m6 0h6"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 7h10M7 12h6m-8 8 3-3h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3v1Z"
                                  />
                                </svg>
                              )}

                            </div>


                            {/* Details */}
                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                                  {isCommit
                                    ? "Commit"
                                    : "Pull request"}
                                </span>

                                <span className="text-xs text-slate-700">
                                  •
                                </span>

                                <span className="truncate text-xs text-slate-500">
                                  {activity.repo_name}
                                </span>

                              </div>


                              <p className="mt-1 truncate text-sm font-medium text-white">
                                {activity.message}
                              </p>


                              <p className="mt-1 text-xs text-slate-500">
                                {formatRelativeTime(
                                  activity.timestamp
                                )}
                              </p>

                            </div>


                            {/* GitHub link */}
                            {activity.url && (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(
                                    activity.url,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                                className="shrink-0 text-sm text-violet-400 transition hover:text-violet-300"
                              >
                                Open →
                              </button>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

            </section>


            {/* ================================================= */}
            {/* REPOSITORIES */}
            {/* ================================================= */}

            <section className="mt-10 pb-10">

              <div className="mb-5 flex items-end justify-between">

                <div>

                  <h2 className="text-xl font-semibold">
                    Your repositories
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Your connected GitHub repositories.
                  </p>

                </div>


                {repositories.length > 5 && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/repositories")
                    }
                    className="text-sm text-violet-400 transition hover:text-violet-300"
                  >
                    See all →
                  </button>
                )}

              </div>


              {/* Loading */}
              {loadingRepositories && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center backdrop-blur-md">

                  <p className="text-sm text-slate-400">
                    Loading your GitHub repositories...
                  </p>

                </div>
              )}


              {/* Error */}
              {!loadingRepositories &&
                repositoryError && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">

                    <p className="text-sm text-red-400">
                      {repositoryError}
                    </p>

                  </div>
                )}


              {/* Empty */}
              {!loadingRepositories &&
                !repositoryError &&
                repositories.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center backdrop-blur-md">

                    <p className="text-sm text-slate-300">
                      No repositories found.
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Connect a GitHub repository to start using GitLoop.
                    </p>

                  </div>
                )}


              {/* Repository cards */}
              {!loadingRepositories &&
                !repositoryError &&
                visibleRepositories.length > 0 && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                    {visibleRepositories.map((repo) => (
                      <RepositoryCard
                        key={repo.id}
                        repository={repo}
                      />
                    ))}

                  </div>
                )}

            </section>

          </main>

        </div>

      </div>

    </div>
  );
}