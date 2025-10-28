import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const API_BASE = "http://localhost:3001";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    if (error) {
      console.error("Authentication error:", error);
      setLoading(false);
      return;
    }

    if (token) {
      localStorage.setItem("authToken", token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for existing token
    const existingToken = localStorage.getItem("authToken");
    if (existingToken) {
      fetchUser(existingToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        console.error("Failed to fetch user:", response.statusText);
        localStorage.removeItem("authToken");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    window.location.href = `${API_BASE}/auth/logout`;
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
