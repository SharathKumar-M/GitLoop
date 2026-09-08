import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import StatCard from "../components/dashboard/StatCard";
import { useAuth } from "../context/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [activities, setActivities] = useState([]);

  const [loadingRepositories, setLoadingRepositories] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [repositoryError, setRepositoryError] = useState("");
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    async function fetchRepositories() {
      try {
        setLoadingRepositories(true);
        setRepositoryError("");

        const response = await fetch(
          "http://localhost:8000/api/github/repositories",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const data = await response.json();

        setRepositories(data.repositories || data || []);
      } catch (error) {
        console.error("Repository fetch error:", error);
        setRepositoryError("Unable to load repositories.");
      } finally {
        setLoadingRepositories(false);
      }
    }

    fetchRepositories();
  }, []);

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoadingActivity(true);
        setActivityError("");

        const response = await fetch(
          "http://localhost:8000/api/github/activity",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch activity");
        }

        const data = await response.json();

        setActivities(data.activities || data || []);
      } catch (error) {
        console.error("Activity fetch error:", error);
        setActivityError("Unable to load recent activity.");
      } finally {
        setLoadingActivity(false);
      }
    }

    fetchActivity();
  }, []);

  const publicRepositories = repositories.filter(
    (repository) => repository.private === false
  ).length;

  const privateRepositories = repositories.filter(
    (repository) => repository.private === true
  ).length;

  const languages = [
    ...new Set(
      repositories
        .map((repository) => repository.language)
        .filter(Boolean)
    ),
  ];

  function formatRelativeTime(dateString) {
    if (!dateString) {
      return "";
    }

    const date = new Date(dateString);
    const now = new Date();

    const difference = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );

    if (difference < 60) {
      return `${difference}s ago`;
    }

    const minutes = Math.floor(difference / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 30) {
      return `${days}d ago`;
    }

    const months = Math.floor(days / 30);

    return `${months}mo ago`;
  }

  function getActivityTitle(activity) {
    if (activity.type === "commit") {
      return "Committed";
    }

    if (activity.type === "pull_request") {
      return activity.state === "merged"
        ? "Merged pull request"
        : "Opened pull request";
    }

    return activity.type || "Activity";
  }

  function getActivityDescription(activity) {
    return (
      activity.message ||
      activity.title ||
      activity.commit_message ||
      "GitHub activity"
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-purple-400">
            Codebase Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Welcome back, {user?.username || "Developer"}
          </h1>

          <p className="mt-2 text-slate-400">
            Understand, explore and interact with your GitHub codebases.
          </p>
        </div>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Repositories"
            value={repositories.length}
          />

          <StatCard
            title="Public Repositories"
            value={publicRepositories}
          />

          <StatCard
            title="Private Repositories"
            value={privateRepositories}
          />

          <StatCard
            title="Languages"
            value={languages.length}
          />
        </section>

        {/* Main dashboard grid */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Recent Activity */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">
                  Recent Activity
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest GitHub activity
                </p>
              </div>
            </div>

            <div className="mt-6">
              {loadingActivity ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Loading activity...
                </div>
              ) : activityError ? (
                <div className="py-10 text-center text-sm text-red-400">
                  {activityError}
                </div>
              ) : activities.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No recent activity found.
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 6).map((activity, index) => (
                    <div
                      key={
                        activity.id ||
                        activity.url ||
                        `${activity.type}-${index}`
                      }
                      className="group rounded-xl border border-white/5 bg-black/20 p-4 transition hover:border-purple-500/20 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-300">
                            {getActivityTitle(activity)}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                            {getActivityDescription(activity)}
                          </p>

                          {activity.repository && (
                            <p className="mt-2 text-xs text-purple-400">
                              {activity.repository}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs text-slate-600">
                            {formatRelativeTime(
                              activity.timestamp ||
                                activity.created_at ||
                                activity.updated_at
                            )}
                          </p>

                          {activity.url && (
                            <a
                              href={activity.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-xs text-slate-500 transition hover:text-white"
                            >
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Repositories */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">
                  Repositories
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your connected GitHub repositories
                </p>
              </div>

              <button
                onClick={() => navigate("/repositories")}
                className="text-sm text-purple-400 transition hover:text-purple-300"
              >
                See all
              </button>
            </div>

            <div className="mt-6">
              {loadingRepositories ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Loading repositories...
                </div>
              ) : repositoryError ? (
                <div className="py-10 text-center text-sm text-red-400">
                  {repositoryError}
                </div>
              ) : repositories.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No repositories found.
                </div>
              ) : (
                <div className="space-y-3">
                  {repositories.slice(0, 5).map((repository) => (
                    <div
                      key={repository.id}
                      className="rounded-xl border border-white/5 bg-black/20 p-4 transition hover:border-white/10 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {repository.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {repository.full_name}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                          {repository.private
                            ? "Private"
                            : "Public"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {repository.language || "Unknown"}
                        </span>

                        <a
                          href={repository.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-500 transition hover:text-white"
                        >
                          Open GitHub →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Future AI section */}
        <section className="mt-6 rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-6">
          <p className="text-sm font-medium text-purple-400">
            GitLoop AI
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Ask questions about your codebase
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Soon you will be able to ask GitLoop questions about your
            repositories, understand architecture, find relevant code,
            review pull requests and explore your entire codebase using AI.
          </p>

          <button
            disabled
            className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-500"
          >
            AI Code Chat — Coming next
          </button>
        </section>
      </div>
    </AppLayout>
  );
}