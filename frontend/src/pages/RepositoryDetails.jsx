import Architecture from "./repository/Architecture";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import Codebase from "./repository/Codebase";

const API_BASE = "http://localhost:8000";

const repositoryTabs = [
  { id: "information", label: "Information", icon: "⌘" },
  { id: "codebase", label: "Codebase", icon: "<>" },
  { id: "architecture", label: "Architecture", icon: "◈" },
  { id: "ai-chat", label: "AI Chat", icon: "✦" },
  { id: "suggestions", label: "Suggestions", icon: "✧" },
  { id: "code-review", label: "Code Review", icon: "✓" },
  { id: "security", label: "Security", icon: "◉" },
];

function getActiveTab(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];

  return repositoryTabs.some((tab) => tab.id === lastPart)
    ? lastPart
    : "information";
}

function formatDate(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRelativeDate(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days} days ago`;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

function formatBytes(bytes) {
  if (typeof bytes !== "number" || bytes < 0) return "Unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatRepositorySize(mb) {
  if (typeof mb !== "number") return "Unavailable";
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toLocaleString()} MB`;
}

function statusClass(status) {
  if (status === "COMPLETED") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "PARTIAL") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  if (status === "INDEXING") {
    return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }

  if (status === "FAILED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-slate-400";
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-purple-300/80">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail, icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-purple-400/20 hover:bg-white/[0.045]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition duration-300 group-hover:bg-purple-400/20" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          {detail && (
            <p className="mt-2 text-xs text-slate-600">{detail}</p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-lg text-purple-300 transition group-hover:border-purple-400/20 group-hover:text-purple-200">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div className="group rounded-xl border border-white/10 bg-black/10 p-4 transition hover:border-white/15 hover:bg-white/[0.03]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-sm font-medium text-slate-200 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value === null || value === undefined || value === ""
          ? "Unavailable"
          : value}
      </p>
    </div>
  );
}

function LanguageRow({ item, active, onSelect }) {
  const percentage =
    typeof item.percentage === "number"
      ? Math.max(0, Math.min(100, item.percentage))
      : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-xl p-3 text-left transition ${
        active
          ? "bg-purple-400/[0.07] ring-1 ring-purple-400/20"
          : "hover:bg-white/[0.025]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]" />
          <span className="truncate text-sm font-medium text-slate-200 group-hover:text-white">
            {item.name}
          </span>
        </div>

        <span className="shrink-0 font-mono text-xs text-slate-500">
          {percentage.toFixed(2)}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-400 transition-[width] duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}

function TechnologyChip({ item, active }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border px-3.5 py-3 transition duration-300 hover:-translate-y-0.5 ${
        active
          ? "border-purple-400/20 bg-purple-400/[0.07]"
          : "border-white/10 bg-black/10 hover:border-purple-400/15 hover:bg-white/[0.03]"
      }`}
    >
      <div className="absolute -right-6 -top-6 h-14 w-14 rounded-full bg-purple-500/10 blur-xl opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs text-purple-300">
          ✦
        </span>
        <span className="text-sm text-slate-200">{item}</span>
      </div>
    </div>
  );
}

function TechnologyGroup({ label, items, active }) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            {label}
          </p>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-600">
            none found
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No matching technology was detected in the repository manifests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <span className="rounded-full border border-purple-400/10 bg-purple-400/[0.04] px-2 py-1 text-[10px] text-purple-300/80">
          {items.length} detected
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <TechnologyChip
            key={`${label}-${item}`}
            item={item}
            active={active}
          />
        ))}
      </div>
    </div>
  );
}

function CommitItem({ commit }) {
  return (
    <a
      href={commit.url}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl border border-white/10 bg-black/10 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-purple-400/15 hover:bg-white/[0.03]"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-400/10 bg-purple-400/[0.05] text-sm text-purple-300 transition group-hover:border-purple-400/20">
          ↗
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-slate-200 transition group-hover:text-white">
            {commit.message || "No commit message"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span>{commit.author || "Unknown author"}</span>
            <span>•</span>
            <span>{formatRelativeDate(commit.date)}</span>
            <span>•</span>
            <span className="font-mono">{commit.sha?.slice(0, 7)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function RepositoryDetails() {
  const { repositoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [repository, setRepository] = useState(null);
  const [information, setInformation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [informationLoading, setInformationLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState("");
  const [informationError, setInformationError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("all");

  const activeTab = getActiveTab(location.pathname);

  async function fetchRepository() {
    // Use the repository information endpoint as the single source for
    // repository metadata. This avoids the separate repositories-list
    // request, which can time out while talking to GitHub.
    const response = await fetch(
      `${API_BASE}/api/github/repositories/${repositoryId}/information`,
      { credentials: "include" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to load repository information."
      );
    }

    setRepository(data.repository || null);
  }

  async function fetchInformation() {
    setInformationLoading(true);
    setInformationError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/github/repositories/${repositoryId}/information`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load repository information."
        );
      }

      setInformation(data);
    } catch (requestError) {
      console.error("Repository information error:", requestError);
      setInformationError(
        requestError.message || "Unable to load repository information."
      );
    } finally {
      setInformationLoading(false);
    }
  }

  async function refreshInformation() {
    await fetchInformation();
  }

  async function indexRepository() {
    try {
      setIndexing(true);
      setInformationError("");

      const response = await fetch(
        `${API_BASE}/api/github/repositories/${repositoryId}/index`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Repository indexing failed.");
      }

      await fetchInformation();
      await fetchRepository().catch(() => {});
    } catch (requestError) {
      console.error("Repository indexing error:", requestError);
      setInformationError(
        requestError.message || "Repository indexing failed."
      );
    } finally {
      setIndexing(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        await fetchRepository();
      } catch (requestError) {
        console.error("Repository details error:", requestError);
        setError(
          requestError.message || "Unable to load repository."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
    fetchInformation();
  }, [repositoryId]);

  useEffect(() => {
    if (!information) return;
    if (information.index?.status !== "INDEXING") return;

    const timer = window.setInterval(() => {
      refreshInformation();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [information]);

  const indexed = useMemo(
    () =>
      information?.index?.status === "COMPLETED" ||
      information?.index?.status === "PARTIAL",
    [information]
  );

  const repositoryData = information?.repository || repository;
  const index = information?.index;
  const statistics = information?.statistics;
  const languages = information?.languages || [];
  const stack = information?.stack || {};
  const branches = information?.branches;
  const manifests = information?.manifests || [];
  const topDirectories = information?.top_directories || [];
  const recentCommits = information?.recent_commits || [];

  const visibleTechnologies = useMemo(() => {
    const groups = [
      ["frontend", stack.frontend || []],
      ["backend", stack.backend || []],
      ["database", stack.database || []],
      ["other", stack.other || []],
    ];

    if (technologyFilter === "all") return groups;

    return groups.filter(([key]) => key === technologyFilter);
  }, [stack, technologyFilter]);

  const languageTotal = useMemo(
    () => languages.reduce((sum, item) => sum + (item.percentage || 0), 0),
    [languages]
  );

  const maxDirectoryCount = useMemo(
    () =>
      Math.max(
        1,
        ...topDirectories.map((item) => Number(item.files) || 0)
      ),
    [topDirectories]
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
          <p className="mt-5 text-sm text-slate-500">Loading repository...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !repositoryData) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl rounded-3xl border border-red-500/10 bg-red-500/[0.03] p-10">
          <p className="text-sm text-red-300">{error || "Repository not found."}</p>
          <button
            type="button"
            onClick={() => navigate("/repositories")}
            className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-sm text-purple-300 transition hover:bg-white/[0.04]"
          >
            ← Back to Repositories
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px] pb-12">
        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/[0.09] via-white/[0.025] to-cyan-500/[0.04] p-7">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-400/[0.06] blur-3xl" />

          <div className="relative">
            <button
              type="button"
              onClick={() => navigate("/repositories")}
              className="mb-5 text-sm text-slate-500 transition hover:text-white"
            >
              ← Repositories
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/15 bg-purple-400/[0.07] text-xl text-purple-300">
                    ◈
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="truncate text-3xl font-semibold tracking-tight text-white">
                        {repositoryData.name}
                      </h1>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          repositoryData.private
                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        }`}
                      >
                        {repositoryData.private ? "Private" : "Public"}
                      </span>

                      {index?.status && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${statusClass(
                            index.status
                          )}`}
                        >
                          {index.status.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {repositoryData.full_name}
                    </p>
                  </div>
                </div>

                {repositoryData.description && (
                  <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-400">
                    {repositoryData.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>
                    Branch: <strong className="text-slate-400">{index?.branch || repositoryData.default_branch || "Unavailable"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Last push: <strong className="text-slate-400">{formatRelativeDate(repositoryData.pushed_at)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {indexed && (
                  <button
                    type="button"
                    onClick={indexRepository}
                    disabled={indexing}
                    className="rounded-xl border border-purple-400/20 bg-purple-400/[0.07] px-4 py-2.5 text-sm font-medium text-purple-100 transition hover:border-purple-300/30 hover:bg-purple-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {indexing ? "Re-indexing..." : "↻ Re-index"}
                  </button>
                )}

                <a
                  href={repositoryData.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                >
                  Open GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace tabs */}
        <div className="sticky top-0 z-30 mb-7 rounded-2xl border border-white/10 bg-[#09090d]/80 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex min-w-max gap-1 overflow-x-auto">
            {repositoryTabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    navigate(`/repositories/${repositoryId}/${tab.id}`)
                  }
                  className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-purple-500/[0.12] text-white"
                      : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`text-xs transition ${
                      isActive ? "text-purple-300" : "text-slate-600 group-hover:text-slate-400"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}

                  {isActive && (
                    <span className="absolute inset-x-4 -bottom-1 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "information" && (
          <div className="space-y-6">
            {informationError && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-400/15 bg-red-400/[0.04] px-5 py-4">
                <p className="text-sm text-red-300">{informationError}</p>
                <button
                  type="button"
                  onClick={refreshInformation}
                  className="rounded-lg border border-red-400/15 px-3 py-2 text-xs text-red-200 transition hover:bg-red-400/[0.06]"
                >
                  Retry
                </button>
              </div>
            )}

            {informationLoading && !information && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
                <p className="mt-4 text-sm text-slate-500">
                  Fetching live repository intelligence...
                </p>
              </div>
            )}

            {!informationLoading && information && !indexed && (
              <section className="relative overflow-hidden rounded-3xl border border-purple-400/10 bg-gradient-to-br from-purple-500/[0.08] via-white/[0.025] to-transparent p-8">
                <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="relative flex flex-wrap items-center justify-between gap-7">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/[0.06] text-purple-300">
                        ◎
                      </span>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-purple-300/80">
                          Repository intelligence
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">
                          Index this repository to unlock its real codebase data.
                        </h2>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-500">
                      GitLoop will read the repository tree and save file metadata. After indexing, this page will show real language distribution, technology detection, structure, branches, commits, and repository statistics.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={indexRepository}
                    disabled={indexing || index?.status === "INDEXING"}
                    className="rounded-2xl border border-purple-300/20 bg-purple-500/[0.1] px-6 py-3 text-sm font-medium text-purple-100 transition hover:-translate-y-0.5 hover:border-purple-300/30 hover:bg-purple-500/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {indexing || index?.status === "INDEXING"
                      ? "Indexing repository..."
                      : "Index Repository →"}
                  </button>
                </div>
              </section>
            )}

            {information && indexed && (
              <>
                {/* Snapshot metrics */}
                <section>
                  <SectionHeading
                    eyebrow="Repository snapshot"
                    title="Codebase at a glance"
                    description="Live statistics calculated from the current GitLoop index."
                    action={
                      <div className="text-xs text-slate-600">
                        Indexed {formatRelativeDate(index?.completed_at)}
                      </div>
                    }
                  />

                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Files"
                      value={statistics?.files ?? 0}
                      detail="Indexed repository files"
                      icon="▦"
                    />
                    <MetricCard
                      label="Code"
                      value={statistics?.code ?? 0}
                      detail="Source files"
                      icon="<>"
                    />
                    <MetricCard
                      label="Config"
                      value={statistics?.config ?? 0}
                      detail="Configuration files"
                      icon="⚙"
                    />
                    <MetricCard
                      label="Docs"
                      value={statistics?.documentation ?? 0}
                      detail="Documentation files"
                      icon="□"
                    />
                  </div>
                </section>

                {/* Languages + technologies */}
                <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <SectionHeading
                      eyebrow="Technology stack"
                      title="Language distribution"
                      description="Percentages returned directly by GitHub for this repository. Click a language to inspect it."
                      action={
                        languages.length > 0 ? (
                          <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 font-mono text-[10px] text-slate-500">
                            {languageTotal.toFixed(2)}% represented
                          </span>
                        ) : null
                      }
                    />

                    {languages.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6">
                        <p className="text-sm text-slate-500">
                          GitHub did not return language statistics for this repository.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {languages.map((item) => (
                          <LanguageRow
                            key={item.name}
                            item={item}
                            active={selectedLanguage === item.name}
                            onSelect={() =>
                              setSelectedLanguage((current) =>
                                current === item.name ? "" : item.name
                              )
                            }
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <SectionHeading
                      eyebrow="Detected stack"
                      title="Technologies found"
                      description="Detected from real dependency and configuration manifests present in the indexed repository."
                    />

                    <div className="mb-4 flex flex-wrap gap-2">
                      {["all", "frontend", "backend", "database", "other"].map(
                        (filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setTechnologyFilter(filter)}
                            className={`rounded-lg border px-3 py-2 text-xs capitalize transition ${
                              technologyFilter === filter
                                ? "border-purple-400/20 bg-purple-400/[0.08] text-purple-200"
                                : "border-white/10 bg-black/10 text-slate-500 hover:border-white/15 hover:text-slate-300"
                            }`}
                          >
                            {filter}
                          </button>
                        )
                      )}
                    </div>

                    <div className="space-y-3">
                      {visibleTechnologies.map(([key, items]) => (
                        <TechnologyGroup
                          key={key}
                          label={key}
                          items={items}
                          active={technologyFilter === key || technologyFilter === "all"}
                        />
                      ))}
                    </div>

                    {manifests.length > 0 && (
                      <div className="mt-4 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
                          Evidence files
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {manifests.map((path) => (
                            <span
                              key={path}
                              className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5 font-mono text-[11px] text-slate-500"
                            >
                              {path}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* Structure + metadata */}
                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <SectionHeading
                      eyebrow="Repository structure"
                      title="Top directories"
                      description="Directory distribution calculated from indexed file paths."
                    />

                    {topDirectories.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-600">
                        No directory data is available from this index.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {topDirectories.map((item) => {
                          const count = Number(item.files) || 0;
                          const width = Math.max(
                            5,
                            Math.round((count / maxDirectoryCount) * 100)
                          );

                          return (
                            <div key={item.path} className="group">
                              <div className="mb-2 flex items-center justify-between gap-4">
                                <span className="font-mono text-sm text-slate-300 transition group-hover:text-white">
                                  {item.path}
                                </span>
                                <span className="text-xs text-slate-600">
                                  {count} files
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500/80 to-cyan-400/80 transition-[width] duration-700"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <SectionHeading
                      eyebrow="Repository details"
                      title="GitHub metadata"
                      description="Metadata comes from the connected GitHub repository."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Detail label="Owner" value={repositoryData.owner} />
                      <Detail
                        label="Default branch"
                        value={repositoryData.default_branch}
                        mono
                      />
                      <Detail
                        label="Repository size"
                        value={formatRepositorySize(repositoryData.size_mb)}
                      />
                      <Detail
                        label="Indexed size"
                        value={formatBytes(statistics?.indexed_bytes)}
                      />
                      <Detail label="Stars" value={repositoryData.stars ?? 0} />
                      <Detail label="Forks" value={repositoryData.forks ?? 0} />
                      <Detail
                        label="Open issues"
                        value={repositoryData.open_issues ?? 0}
                      />
                      <Detail
                        label="Branches"
                        value={branches?.count ?? 0}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Detail
                        label="Created"
                        value={formatDate(repositoryData.created_at)}
                      />
                      <Detail
                        label="Last pushed"
                        value={formatDate(repositoryData.pushed_at)}
                      />
                    </div>
                  </section>
                </div>

                {/* Branches + commits */}
                <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <SectionHeading
                      eyebrow="Git branches"
                      title="Branches"
                      description="Branches returned from GitHub for this repository."
                    />

                    {!branches?.items?.length ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-600">
                        No branch data was returned by GitHub.
                      </div>
                    ) : (
                      <div className="flex max-h-72 flex-wrap content-start gap-2 overflow-auto pr-1">
                        {branches.items.map((branch) => (
                          <span
                            key={branch.name}
                            className="group rounded-xl border border-white/10 bg-black/10 px-3 py-2 transition hover:border-purple-400/15 hover:bg-purple-400/[0.04]"
                          >
                            <span className="font-mono text-xs text-slate-300">
                              {branch.name}
                            </span>
                            {branch.protected && (
                              <span className="ml-2 text-[10px] text-emerald-300/70">
                                protected
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <SectionHeading
                      eyebrow="Recent activity"
                      title="Latest commits"
                      description="The latest five commits returned by GitHub."
                    />

                    {recentCommits.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-600">
                        GitHub did not return recent commit data.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {recentCommits.map((commit) => (
                          <CommitItem key={commit.sha} commit={commit} />
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Index health */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                  <SectionHeading
                    eyebrow="GitLoop index"
                    title="Index health"
                    description="The current synchronization snapshot stored by GitLoop."
                    action={
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs ${statusClass(
                          index?.status
                        )}`}
                      >
                        {index?.status || "NOT_INDEXED"}
                      </span>
                    }
                  />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Detail label="Status" value={index?.status} />
                    <Detail label="Branch" value={index?.branch} mono />
                    <Detail
                      label="Started"
                      value={formatDate(index?.started_at)}
                    />
                    <Detail
                      label="Completed"
                      value={formatDate(index?.completed_at)}
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Detail
                      label="Files indexed"
                      value={index?.files_indexed ?? 0}
                    />
                    <Detail
                      label="Indexed size"
                      value={formatBytes(statistics?.indexed_bytes)}
                    />
                  </div>

                  {index?.truncated && (
                    <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.035] px-4 py-3 text-xs leading-5 text-amber-200/70">
                      This repository was partially indexed because the current GitLoop indexing limits were reached.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {activeTab === "codebase" && <Codebase repositoryId={repositoryId} />}

        {activeTab === "architecture" && (
          <Architecture repository={repositoryData} />
        )}

        {activeTab === "ai-chat" && (
          <Placeholder
            title="AI Chat"
            description="Repository-aware AI chat will appear here."
          />
        )}

        {activeTab === "suggestions" && (
          <Placeholder
            title="Suggestions"
            description="AI-powered development suggestions will appear here."
          />
        )}

        {activeTab === "code-review" && (
          <Placeholder
            title="Code Review"
            description="AI code review findings will appear here."
          />
        )}

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

function Placeholder({ title, description }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10">
      <p className="text-sm text-purple-300">Repository workspace</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
        {description}
      </p>
    </div>
  );
}
