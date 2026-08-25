import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/topbar";
import StatCard from "../components/dashboard/StatCard";
import RepositoryCard from "../components/dashboard/RepositoryCard";
import { useAuth } from "../context/useAuth";

function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-[#05050b] text-white">

      <div className="flex min-h-screen">

        <Sidebar />

        <div className="min-w-0 flex-1">

          <Topbar />

          <section className="p-6 md:p-8">

           

            <div className="mb-8">

              <p className="text-sm font-medium text-violet-400">
                Dashboard
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Welcome back,{" "}
                <span className="text-violet-400">
                  {user?.username}
                </span>
              </h1>

              <p className="mt-2 text-slate-500">
                Here's what's happening across your codebases.
              </p>

            </div>


            

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                label="Repositories"
                value="4"
                description="Connected repositories"
              />

              <StatCard
                label="Files analyzed"
                value="1,284"
                description="Across your repositories"
              />

              <StatCard
                label="AI queries"
                value="86"
                description="Questions answered"
              />

              <StatCard
                label="Code health"
                value="92%"
                description="Average repository score"
              />

            </div>


            

            <div className="mt-10">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-semibold">
                    Your repositories
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Repositories connected to GitLoop
                  </p>
                </div>

                <button className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
                  View all
                </button>

              </div>


              <div className="grid gap-4 xl:grid-cols-2">

                <RepositoryCard
                  name="shopping-assistant"
                  language="JavaScript"
                  files="127"
                />

                <RepositoryCard
                  name="portfolio"
                  language="React"
                  files="48"
                />

                <RepositoryCard
                  name="gitloop"
                  language="Python"
                  files="214"
                />

                <RepositoryCard
                  name="skillmorph-ai"
                  language="JavaScript"
                  files="93"
                />

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}

export default Dashboard;