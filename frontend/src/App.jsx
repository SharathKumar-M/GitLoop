import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/landing";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRout";


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;