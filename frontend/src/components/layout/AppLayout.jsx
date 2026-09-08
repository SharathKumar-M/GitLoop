import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";
import AppBackground from "./AppBackground";
import { useAuth } from "../../context/useAuth";

export default function AppLayout({ children }) {
  const { user } = useAuth();

  return (
    <AppBackground>
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 z-50 h-screen w-72">
        <Sidebar />
      </div>

      {/* Main application */}
      <div className="min-h-screen pl-72">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-72px)] px-8 py-8">
          {children}
        </main>
      </div>
    </AppBackground>
  );
}