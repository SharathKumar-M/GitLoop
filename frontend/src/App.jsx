import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Landing from "./pages/landing";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile";
import Repositories from "./pages/Repositories";
import RepositoryDetails from "./pages/RepositoryDetails";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public */}
          <Route
            path="/"
            element={<Landing />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          {/* Main application */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories"
            element={
              <ProtectedRoute>
                <Repositories />
              </ProtectedRoute>
            }
          />

          {/* Repository workspace */}
          <Route
            path="/repositories/:repositoryId"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories/:repositoryId/codebase"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories/:repositoryId/ai-chat"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories/:repositoryId/suggestions"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories/:repositoryId/architecture"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories/:repositoryId/code-review"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repositories/:repositoryId/security"
            element={
              <ProtectedRoute>
                <RepositoryDetails />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }s
          />

          <Route
          path="/repositories/:repositoryId"
          element={
            <ProtectedRoute>
              <RepositoryDetails />
            </ProtectedRoute>
          }
          />

          <Route
          path="/repositories/:repositoryId/:tab"
          element={
            <ProtectedRoute>
              <RepositoryDetails />
            </ProtectedRoute>
          }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;