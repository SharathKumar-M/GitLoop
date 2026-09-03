import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import RepositoryCard from "../components/dashboard/RepositoryCard";
import { useAuth } from "../context/useAuth";


export default function Repositories() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        setError("");

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
        setError("Unable to load your GitHub repositories.");
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, []);


  return (
    <div className="min-h-screen bg-[#05050b] text-white">

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <Sidebar />


        {/* Main content */}
        <div className="flex-1">

          {/* Topbar */}
          <Topbar user={user} />


          <main className="p-6 lg:p-8">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  GitHub
                </p>

                <h1 className="mt-1 text-3xl font-semibold">
                  Repositories
                </h1>

                <p className="mt-2 text-slate-400">
                  All repositories available to GitLoop.
                </p>
              </div>


              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                ← Dashboard
              </button>

            </div>


            {/* Repository count */}
            {!loading && !error && (
              <div className="mb-6">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-slate-400">
                  {repositories.length} repositories
                </span>
              </div>
            )}


            {/* Loading */}
            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-slate-400">
                  Loading repositories...
                </p>
              </div>
            )}


            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center">
                <p className="text-red-400">
                  {error}
                </p>
              </div>
            )}


            {/* Empty */}
            {!loading &&
              !error &&
              repositories.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">

                  <p className="text-slate-300">
                    No repositories found.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Make sure your GitHub App has repository access.
                  </p>

                </div>
              )}


            {/* All repositories */}
            {!loading &&
              !error &&
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

          </main>

        </div>
      </div>

    </div>
  );
}