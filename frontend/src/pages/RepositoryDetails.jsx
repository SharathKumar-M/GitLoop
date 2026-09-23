import Architecture from "./repository/Architecture";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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


export default function RepositoryDetails() {
  const { repositoryId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeTab = getActiveTab(location.pathname);


  useEffect(() => {
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
            data.detail || "Unable to load repository."
          );
        }

        const repositories =
          data.repositories || data || [];

        const selectedRepository = repositories.find(
          (item) =>
            String(item.id) === String(repositoryId)
        );

        if (!selectedRepository) {
          throw new Error("Repository not found.");
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

    fetchRepository();
  }, [repositoryId]);


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
              onClick={() => navigate("/repositories")}
              className="mt-4 text-sm text-purple-400 transition hover:text-purple-300"
            >
              ← Back to Repositories
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="mx-auto max-w-[1600px]">

        {/* Repository Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/repositories")}
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


        {/* Tab Content */}
        {activeTab === "information" && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                Repository
              </p>

              <p className="mt-3 break-words text-lg font-medium text-white">
                {repository.name}
              </p>

              <p className="mt-1 break-words text-sm text-slate-500">
                {repository.full_name}
              </p>
            </div>


            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                Language
              </p>

              <p className="mt-3 text-lg font-medium text-white">
                {repository.language ||
                  "Unknown"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Primary repository language
              </p>
            </div>


            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                Default Branch
              </p>

              <p className="mt-3 text-lg font-medium text-white">
                {repository.default_branch ||
                  "Unknown"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Default Git branch
              </p>
            </div>


            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                Visibility
              </p>

              <p className="mt-3 text-lg font-medium text-white">
                {repository.private
                  ? "Private"
                  : "Public"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                GitHub repository visibility
              </p>
            </div>


            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                GitLoop
              </p>

              <p className="mt-3 text-lg font-medium text-purple-400">
                Repository Workspace
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Explore code and intelligence
              </p>
            </div>


            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                Next
              </p>

              <button
                type="button"
                onClick={() =>
                  openTab("codebase")
                }
                className="mt-3 text-lg font-medium text-white transition hover:text-purple-300"
              >
                Open Codebase →
              </button>

              <p className="mt-1 text-sm text-slate-500">
                Browse indexed repository files
              </p>
            </div>

          </div>
        )}


        {activeTab === "codebase" && (
          <Codebase
            repositoryId={repositoryId}
          />
        )}


        {activeTab === "architecture" && (
  <Architecture repository={repository} />
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