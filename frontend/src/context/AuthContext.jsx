import { createContext, useEffect, useState } from "react";

import {
  getCurrentUser,
  logout as logoutApi,
} from "../services/api";


export const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);


  const logout = async () => {
    await logoutApi();

    setUser(null);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}