import { useState } from "react";
import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";
import AppBackground from "./AppBackground";
import { useAuth } from "../../context/useAuth";

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AppBackground>
      <div className="min-h-screen">
        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 z-50 h-screen overflow-hidden transition-[width] duration-200 ease-out ${
            sidebarOpen ? "w-72" : "w-16"
          }`}
        >
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((value) => !value)}
          />
        </div>

        {/* Open control
            The closed state keeps a 64px rail on the left, so this
            control never overlaps the topbar / GitLoop branding. */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            title="Open sidebar"
            className="fixed left-4 top-4 z-[70] flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#070812]/95 text-slate-400 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M9 4V20"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        )}

        <div
          className={`min-h-screen transition-[padding-left] duration-200 ease-out ${
            sidebarOpen ? "pl-72" : "pl-16"
          }`}
        >
          <Topbar user={user} />

          <main className="min-h-[calc(100vh-72px)] px-8 py-8">
            {children}
          </main>
        </div>
      </div>
    </AppBackground>
  );
}
