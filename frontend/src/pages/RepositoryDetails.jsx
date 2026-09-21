import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

export default function RepositoryDetails() {
  const { repositoryId } = useParams();
  const navigate = useNavigate();

  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (!response.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const data = await response.json();

        const repositories = data.repositories || data || [];

        const selectedRepository = repositories.find(
          (repo) => String(repo.id) === String(repositoryId)
        );

        if (!selectedRepository) {
          throw new Error("Repository not found");
        }

        setRepository(selectedRepository);
      } catch (error) {
        console.error("Repository details error:", error);
        setError("Unable to load repository information.");
      } finally {
        setLoading(false);
      }
    }

    fetchRepository();
  }, [repositoryId]);

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

  if (error || !repository) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-10 text-center">
            <p className="text-sm text-red-400">
              {error || "Repository not found."}
            </p>

            <button
              onClick={() => navigate("/repositories")}
              className="mt-5 text-sm text-slate-400 transition hover:text-white"
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
      <div className="mx-auto max-w-7xl">

        {/* Back button */}
        <button
          onClick={() => navigate("/repositories")}
          className="mb-6 text-sm text-slate-500 transition hover:text-white"
        >
          ← Back to Repositories
        </button>

        {/* Repository Header */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {repository.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    repository.private
                      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {repository.private ? "Private" : "Public"}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {repository.full_name}
              </p>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
                Repository information and GitLoop intelligence for this
                GitHub repository.
              </p>
            </div>

            <a
              href={repository.html_url}
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Open on GitHub ↗
            </a>
          </div>
        </section>

        {/* Repository Information */}
        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">
              Repository Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic information about this repository.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            {/* Language */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-500">
                Primary Language
              </p>

              <p className="mt-3 text-xl font-semibold text-white">
                {repository.language || "Unknown"}
              </p>
            </div>

            {/* Branch */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-500">
                Default Branch
              </p>

              <p className="mt-3 text-xl font-semibold text-white">
                {repository.default_branch || "Unknown"}
              </p>
            </div>

            {/* Visibility */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-slate-500">
                Visibility
              </p>

              <p className="mt-3 text-xl font-semibold text-white">
                {repository.private ? "Private" : "Public"}
              </p>
            </div>

            {/* GitLoop status */}
            <div className="rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-6">
              <p className="text-sm text-slate-500">
                GitLoop Status
              </p>

              <p className="mt-3 text-xl font-semibold text-purple-400">
                Not Indexed
              </p>
            </div>

          </div>
        </section>

        {/* GitLoop Intelligence */}
        <section className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">

            <p className="text-sm font-medium text-purple-400">
              GitLoop Intelligence
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Repository is not indexed yet
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              GitLoop needs to analyze this repository before its AI
              features can understand the codebase.
            </p>

            <button
              onClick={() =>
                alert("Repository indexing will be built next.")
              }
              className="mt-6 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500"
            >
              Analyze Repository
            </button>

          </div>
        </section>

        {/* Future features */}
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-medium text-white">
              Files
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Explore repository files and source code.
            </p>

            <p className="mt-4 text-xs text-slate-600">
              Coming next
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-medium text-white">
              AI Chat
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Ask questions about this repository.
            </p>

            <p className="mt-4 text-xs text-slate-600">
              Coming later
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-medium text-white">
              Architecture
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Understand relationships inside the codebase.
            </p>

            <p className="mt-4 text-xs text-slate-600">
              Coming later
            </p>
          </div>

        </section>

      </div>
    </AppLayout>
  );
}