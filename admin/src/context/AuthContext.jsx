import { createContext, useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.role !== "admin") {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser(res.data);
      }
    } catch (err) {
      localStorage.removeItem("token");
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    const { token, user: userData } = res.data;
    if (userData.role !== "admin") {
      throw new Error("Admin access only");
    }
    localStorage.setItem("token", token);
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
