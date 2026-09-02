import { useEffect, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import StatCard from "../components/dashboard/StatCard";
import RepositoryCard from "../components/dashboard/RepositoryCard";
import {useAuth} from "../context/useAuth";


export default function Dashboard() {
  const { user } = useAuth();

  const [repositories, setRepositories] = useState([]);
  const [loadingRepositories, setLoadingRepositories] = useState(true);
  const [repositoryError, setRepositoryError] = useState("");


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
        console.error("Failed to fetch repositories:", error);
        setRepositoryError(
          "Unable to load your GitHub repositories."
        );
      } finally {
        setLoadingRepositories(false);
      }
    };

    fetchRepositories();
  }, []);


  return (
    <div className="min-h-screen bg-[#05050b] text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar />


        {/* Main Content */}
        <div className="flex-1">

          {/* Topbar */}
          <Topbar user={user} />


          {/* Dashboard Content */}
          <main className="p-6 lg:p-8">

            {/* Header */}
            <div className="mb-8">
              <p className="text-sm text-gray-400">
                Welcome back
              </p>

              <h1 className="mt-1 text-3xl font-semibold">
                {user?.username || "Developer"}
              </h1>

              <p className="mt-2 text-gray-400">
                Your GitHub codebase intelligence dashboard.
              </p>
            </div>


            {/* Stats */}
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


            {/* Repository Section */}
            <section className="mt-10">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Your repositories
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Repositories available through your GitHub App installation.
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-400">
                  {repositories.length}
                </span>
              </div>


              {/* Loading */}
              {loadingRepositories && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <p className="text-gray-400">
                    Loading your GitHub repositories...
                  </p>
                </div>
              )}


              {/* Error */}
              {!loadingRepositories && repositoryError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                  <p className="text-red-400">
                    {repositoryError}
                  </p>
                </div>
              )}


              {/* Empty */}
              {!loadingRepositories &&
                !repositoryError &&
                repositories.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                    <p className="text-gray-300">
                      No repositories found.
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Connect a GitHub repository to start using GitLoop.
                    </p>
                  </div>
                )}


              {/* Repositories */}
              {!loadingRepositories &&
                !repositoryError &&
                repositories.length > 0 && (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                    {repositories.map((repo) => (
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