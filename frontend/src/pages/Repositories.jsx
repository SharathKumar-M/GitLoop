import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import RepositoryCard from "../components/dashboard/RepositoryCard";

export default function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRepositories() {
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

        setRepositories(data.repositories || data || []);
      } catch (error) {
        console.error("Repositories fetch error:", error);
        setError("Unable to load repositories.");
      } finally {
        setLoading(false);
      }
    }

    fetchRepositories();
  }, []);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-purple-400">
            GitHub
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Repositories
          </h1>

          <p className="mt-2 text-slate-400">
            Explore the repositories connected to your GitLoop account.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading repositories...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-10 text-center">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          repositories.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <p className="text-sm text-slate-500">
                No repositories found.
              </p>
            </div>
          )}

        {/* Repository cards */}
        {!loading && !error && repositories.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {repositories.map((repository) => (
              <RepositoryCard
                key={repository.id}
                repository={repository}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}