import {BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./components/auth/ProtectedRout";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
        } 
        />
    </Routes>
    </BrowserRouter>
  );
}

export default App;