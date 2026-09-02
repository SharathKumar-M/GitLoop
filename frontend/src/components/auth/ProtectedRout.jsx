import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";


export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05050b] text-white">
        <p className="text-slate-400">
          Loading...
        </p>
      </div>
    );
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }


  return children;
}