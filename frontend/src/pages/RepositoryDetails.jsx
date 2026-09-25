import Architecture from "./repository/Architecture";
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import Codebase from "./repository/Codebase";


const repositoryTabs = [
  {
    id: "information",
    label: "Information",
  },
  {
    id: "codebase",
    label: "Codebase",
  },
  {
    id: "architecture",
    label: "Architecture",
  },
  {
    id: "ai-chat",
    label: "AI Chat",
  },
  {
    id: "suggestions",
    label: "Suggestions",
  },
  {
    id: "code-review",
    label: "Code Review",
  },
  {
    id: "security",
    label: "Security",
  },
];


function getActiveTab(pathname) {
  const parts = pathname.split("/").filter(Boolean);

  const lastPart = parts[parts.length - 1];

  const isValidTab = repositoryTabs.some(
    (tab) => tab.id === lastPart
  );

  return isValidTab ? lastPart : "information";
}


function formatDate(date) {
  if (!date) {
    return "Unknown";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


function formatRelativeDate(date) {
  if (!date) {
    return "Unknown";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  const now = new Date();
  const difference =
    now.getTime() - parsedDate.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function getStatusDetails(status) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Indexed",
        description:
          "Repository is ready for GitLoop intelligence.",
        dot: "bg-emerald-400",
        badge:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      };

    case "INDEXING":
      return {
        label: "Indexing",
        description:
          "GitLoop is currently processing this repository.",
        dot: "bg-yellow-400",
        badge:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      };

    case "PARTIAL":
      return {
        label: "Partially Indexed",
        description:
          "Some repository files were not indexed.",
        dot: "bg-yellow-400",
        badge:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      };

    case "FAILED":
      return {
        label: "Index Failed",
        description:
          "GitLoop could not complete repository indexing.",
        dot: "bg-red-400",
        badge:
          "border-red-500/20 bg-red-500/10 text-red-400",
      };

    default:
      return {
        label: "Not Indexed",
        description:
          "Index this repository to unlock GitLoop intelligence.",
        dot: "bg-slate-500",
        badge:
          "border-white/10 bg-white/[0.03] text-slate-400",
      };
  }
}


function StackGroup({
  title,
  items,
  color,
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-600">
        {title}
      </p>

      {items?.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{
                borderColor: `${color}25`,
                backgroundColor: `${color}0b`,
                color,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Not detected
        </p>
      )}
    </div>
  );
}


export default function RepositoryDetails() {
  const { repositoryId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [repository, setRepository] =
    useState(null);

  const [repositoryInfo, setRepositoryInfo] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingInformation, setLoadingInformation] =
    useState(false);

  const [indexing, setIndexing] =
    useState(false);

  const [error, setError] = useState("");
  const [informationError, setInformationError] =
    useState("");

  const activeTab = getActiveTab(
    location.pathname
  );


  async function fetchRepository() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:8000/api/github/repositories",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load repository."
        );
      }

      const repositories =
        data.repositories || data || [];

      const selectedRepository =
        repositories.find(
          (item) =>
            String(item.id) ===
            String(repositoryId)
        );

      if (!selectedRepository) {
        throw new Error(
          "Repository not found."
        );
      }

      setRepository(selectedRepository);
    } catch (error) {
      console.error(
        "Repository details error:",
        error
      );

      setError(
        error.message ||
          "Unable to load repository."
      );
    } finally {
      setLoading(false);
    }
  }


  async function fetchRepositoryInformation() {
    try {
      setLoadingInformation(true);
      setInformationError("");

      const response = await fetch(
        `http://localhost:8000/api/github/repositories/${repositoryId}/information`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load repository information."
        );
      }

      setRepositoryInfo(data);
    } catch (error) {
      console.error(
        "Repository information error:",
        error
      );

      setInformationError(
        error.message ||
          "Unable to load repository information."
      );
    } finally {
      setLoadingInformation(false);
    }
  }


  useEffect(() => {
    fetchRepository();
    fetchRepositoryInformation();
  }, [repositoryId]);


  async function handleIndexRepository() {
    try {
      setIndexing(true);
      setInformationError("");

      const response = await fetch(
        `http://localhost:8000/api/github/repositories/${repositoryId}/index`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to index repository."
        );
      }

      await fetchRepositoryInformation();
    } catch (error) {
      console.error(
        "Repository indexing error:",
        error
      );

      setInformationError(
        error.message ||
          "Unable to index repository."
      );
    } finally {
      setIndexing(false);
    }
  }


  function openTab(tabId) {
    navigate(
      `/repositories/${repositoryId}/${tabId}`
    );
  }


  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading repository...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }


  if (error) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-10">
            <p className="text-sm text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/repositories")
              }
              className="mt-4 text-sm text-purple-400 transition hover:text-purple-300"
            >
              ← Back to Repositories
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }


  const index =
    repositoryInfo?.index || {};

  const statusDetails =
    getStatusDetails(index.status);

  const languages =
    repositoryInfo?.languages || [];

  const stack =
    repositoryInfo?.stack || {};

  const recentCommits =
    repositoryInfo?.recent_commits || [];


  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px]">

        {/* Repository Header */}
        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              navigate("/repositories")
            }
            className="mb-4 text-sm text-slate-500 transition hover:text-white"
          >
            ← Repositories
          </button>


          <div className="flex flex-wrap items-start justify-between gap-5">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="truncate text-3xl font-semibold tracking-tight text-white">
                  {repository.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    repository.private
                      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {repository.private
                    ? "Private"
                    : "Public"}
                </span>

              </div>


              <p className="mt-2 text-sm text-slate-500">
                {repository.full_name}
              </p>


              {repositoryInfo?.repository
                ?.description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                  {
                    repositoryInfo.repository
                      .description
                  }
                </p>
              )}


              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">

                <span>
                  {repositoryInfo?.repository
                    ?.primary_language ||
                    repository.language ||
                    "Unknown"}
                </span>

                <span className="h-1 w-1 rounded-full bg-slate-700" />

                <span>
                  {repository.default_branch ||
                    "main"}
                </span>

                <span className="h-1 w-1 rounded-full bg-slate-700" />

                <span>
                  {repositoryInfo?.branches
                    ?.count || 0}{" "}
                  branch
                  {(
                    repositoryInfo
                      ?.branches?.count || 0
                  ) === 1
                    ? ""
                    : "es"}
                </span>

              </div>

            </div>


            <a
              href={repository.html_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            >
              Open GitHub ↗
            </a>

          </div>
        </div>


        {/* Repository Tabs */}
        <div className="mb-6 overflow-x-auto border-b border-white/10">

          <div className="flex min-w-max items-center gap-1">

            {repositoryTabs.map((tab) => {
              const isActive =
                activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    openTab(tab.id)
                  }
                  className={`relative px-4 py-3 text-sm transition ${
                    isActive
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {tab.label}

                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-purple-400" />
                  )}
                </button>
              );
            })}

          </div>
        </div>


        {/* =====================================================
            INFORMATION TAB
        ====================================================== */}
        {activeTab === "information" && (
          <div className="space-y-5">

            {informationError && (
              <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] px-5 py-4">
                <p className="text-sm text-red-400">
                  {informationError}
                </p>
              </div>
            )}


            {/* Top Overview */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {/* Repository */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                  Repository
                </p>

                <h2 className="mt-3 break-words text-xl font-semibold text-white">
                  {repository.name}
                </h2>

                <p className="mt-1 break-words text-sm text-slate-500">
                  {repository.full_name}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                    {repository.private
                      ? "Private"
                      : "Public"}
                  </span>

                  <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                    {repository.default_branch ||
                      "main"}
                  </span>
                </div>

              </div>


              {/* Owner */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                  Owner
                </p>

                <p className="mt-3 text-xl font-semibold text-white">
                  {repositoryInfo?.repository
                    ?.owner ||
                    repository.full_name?.split(
                      "/"
                    )[0] ||
                    "Unknown"}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  GitHub repository owner
                </p>

                <div className="mt-5">
                  <a
                    href={repository.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-purple-400 transition hover:text-purple-300"
                  >
                    View repository →
                  </a>
                </div>

              </div>


              {/* Index Status */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                      GitLoop Status
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${statusDetails.dot} ${
                          index.status ===
                          "INDEXING"
                            ? "animate-pulse"
                            : ""
                        }`}
                      />

                      <span className="text-xl font-semibold text-white">
                        {statusDetails.label}
                      </span>
                    </div>
                  </div>

                </div>


                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {statusDetails.description}
                </p>


                <button
                  type="button"
                  onClick={
                    handleIndexRepository
                  }
                  disabled={indexing}
                  className="mt-5 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-500/15 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {indexing
                    ? "Indexing..."
                    : index.status ===
                        "COMPLETED"
                      ? "Re-index Repository"
                      : "Index Repository"}
                </button>

              </div>

            </div>


            {/* Index & Repository Statistics */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex flex-wrap items-end justify-between gap-4">

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-400">
                    Repository Statistics
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Codebase snapshot
                  </h2>
                </div>


                <div className="text-right">
                  <p className="text-xs text-slate-600">
                    Last indexed
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {index.completed_at
                      ? formatDate(
                          index.completed_at
                        )
                      : "Not indexed yet"}
                  </p>
                </div>

              </div>


              <div className="mt-6 grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Files
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-white">
                    {index.files_count ||
                      0}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Indexed repository files
                  </p>
                </div>


                <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Code
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-white">
                    {index.code_files_count ||
                      0}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Source and configuration files
                  </p>
                </div>


                <div className="rounded-xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Other
                  </p>

                  <p className="mt-3 text-3xl font-semibold text-white">
                    {index.other_files_count ||
                      0}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Documentation and other files
                  </p>
                </div>

              </div>

            </div>


            {/* Technology Section */}
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">

              {/* Languages */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-400">
                    Technology Stack
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Languages
                  </h2>
                </div>


                {loadingInformation ? (
                  <div className="mt-6 h-32 animate-pulse rounded-xl bg-white/[0.03]" />
                ) : languages.length > 0 ? (
                  <div className="mt-6 space-y-5">

                    {languages
                      .slice(0, 6)
                      .map((language) => (
                        <div
                          key={language.name}
                        >

                          <div className="mb-2 flex items-center justify-between gap-4">

                            <span className="text-sm text-slate-300">
                              {language.name}
                            </span>

                            <span className="text-xs text-slate-600">
                              {
                                language.percentage
                              }
                              %
                            </span>

                          </div>


                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">

                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-400"
                              style={{
                                width: `${Math.max(
                                  language.percentage,
                                  1
                                )}%`,
                              }}
                            />

                          </div>

                        </div>
                      ))}

                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-white/5 bg-black/10 p-5">
                    <p className="text-sm text-slate-500">
                      Language information is not available yet.
                    </p>
                  </div>
                )}

              </div>


              {/* Detected Stack */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-400">
                    Detected Stack
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Technologies
                  </h2>
                </div>


                <div className="mt-6 space-y-7">

                  <StackGroup
                    title="Frontend"
                    items={stack.frontend}
                    color="#a855f7"
                  />


                  <StackGroup
                    title="Backend"
                    items={stack.backend}
                    color="#38bdf8"
                  />


                  <StackGroup
                    title="Database"
                    items={stack.database}
                    color="#f59e0b"
                  />

                </div>

              </div>

            </div>


            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex flex-wrap items-end justify-between gap-4">

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-400">
                    Recent Activity
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Latest commits
                  </h2>
                </div>


                <div className="text-sm text-slate-600">
                  Updated{" "}
                  {repositoryInfo?.repository
                    ?.pushed_at
                    ? formatRelativeDate(
                        repositoryInfo
                          .repository
                          .pushed_at
                      )
                    : "Unknown"}
                </div>

              </div>


              {recentCommits.length > 0 ? (
                <div className="mt-6 divide-y divide-white/5">

                  {recentCommits.map(
                    (commit) => (
                      <div
                        key={commit.sha}
                        className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-300">
                            {commit.message}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">

                            <span>
                              {commit.author}
                            </span>

                            <span className="h-1 w-1 rounded-full bg-slate-700" />

                            <span>
                              {formatRelativeDate(
                                commit.date
                              )}
                            </span>

                          </div>
                        </div>


                        {commit.html_url && (
                          <a
                            href={
                              commit.html_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-xs text-purple-400 transition hover:text-purple-300"
                          >
                            View commit ↗
                          </a>
                        )}

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-white/5 bg-black/10 p-5">
                  <p className="text-sm text-slate-500">
                    No recent commit information available.
                  </p>
                </div>
              )}

            </div>


            {/* Repository Dates */}
            <div className="grid gap-5 sm:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Created
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {repositoryInfo?.repository
                    ?.created_at
                    ? formatDate(
                        repositoryInfo
                          .repository
                          .created_at
                      )
                    : "Unknown"}
                </p>
              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Last Updated
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {repositoryInfo?.repository
                    ?.updated_at
                    ? formatDate(
                        repositoryInfo
                          .repository
                          .updated_at
                      )
                    : "Unknown"}
                </p>
              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Last Push
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {repositoryInfo?.repository
                    ?.pushed_at
                    ? formatDate(
                        repositoryInfo
                          .repository
                          .pushed_at
                      )
                    : "Unknown"}
                </p>
              </div>

            </div>

          </div>
        )}


        {/* Codebase */}
        {activeTab === "codebase" && (
          <Codebase
            repositoryId={repositoryId}
          />
        )}


        {/* Architecture */}
        {activeTab === "architecture" && (
          <Architecture
            repository={repository}
          />
        )}


        {/* AI Chat */}
        {activeTab === "ai-chat" && (
          <Placeholder
            title="AI Chat"
            description="Repository-aware AI chat will appear here."
          />
        )}


        {/* Suggestions */}
        {activeTab === "suggestions" && (
          <Placeholder
            title="Suggestions"
            description="AI-powered development suggestions will appear here."
          />
        )}


        {/* Code Review */}
        {activeTab === "code-review" && (
          <Placeholder
            title="Code Review"
            description="AI code review findings will appear here."
          />
        )}


        {/* Security */}
        {activeTab === "security" && (
          <Placeholder
            title="Security"
            description="Repository security analysis will appear here."
          />
        )}

      </div>
    </AppLayout>
  );
}


function Placeholder({
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">

      <p className="text-sm text-purple-400">
        Repository workspace
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}