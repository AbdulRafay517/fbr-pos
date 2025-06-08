import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isSessionExpired: boolean;
  extendSession: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session configuration functions
const getSessionConfig = () => {
  const stored = localStorage.getItem("sessionConfig");
  const defaultConfig = {
    timeoutMinutes: 30,
    warningMinutes: 5,
    logoutOnTabClose: false,
  };
  return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
};

const getSessionTimeout = () => getSessionConfig().timeoutMinutes * 60 * 1000;
const getWarningTime = () => getSessionConfig().warningMinutes * 60 * 1000;
const shouldLogoutOnTabClose = () => getSessionConfig().logoutOnTabClose;

const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  
  const lastActivityRef = useRef<number>(Date.now());
  const sessionTimeoutRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem("lastActivity", lastActivityRef.current.toString());
  }, []);

  // Extend session (reset timeout)
  const extendSession = useCallback(() => {
    updateActivity();
    setIsSessionExpired(false);
  }, [updateActivity]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsSessionExpired(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");
    clearTimers();
  }, [clearTimers]);

  // Check if session should expire due to inactivity
  const checkSessionExpiry = useCallback(() => {
    if (!token || !user) return;

    const sessionTimeout = getSessionTimeout();
    const warningTime = getWarningTime();
    const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0");
    const timeSinceLastActivity = Date.now() - lastActivity;

    if (timeSinceLastActivity >= sessionTimeout) {
      setIsSessionExpired(true);
      logout();
      alert("Your session has expired due to inactivity. Please log in again.");
    } else if (timeSinceLastActivity >= sessionTimeout - warningTime) {
      const remainingTime = Math.ceil((sessionTimeout - timeSinceLastActivity) / 1000 / 60);
      if (remainingTime > 0) {
        const shouldExtend = window.confirm(
          `Your session will expire in ${remainingTime} minute(s). Do you want to continue?`
        );
        if (shouldExtend) {
          extendSession();
        } else {
          logout();
        }
      }
    }
  }, [token, user, logout, extendSession]);

  // Set up session monitoring
  const setupSessionMonitoring = useCallback(() => {
    if (!token || !user) return;

    // Set up periodic session check
    checkIntervalRef.current = setInterval(checkSessionExpiry, CHECK_INTERVAL);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [token, user, checkSessionExpiry, updateActivity]);

  // Handle browser/tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (shouldLogoutOnTabClose()) {
        logout();
      } else {
        // Just clean up timers
        clearTimers();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - could implement additional logic here
        updateActivity();
      } else {
        // Tab is visible again - check if session expired while away
        if (token && user) {
          checkSessionExpiry();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user, logout, clearTimers, updateActivity, checkSessionExpiry]);

  // Initialize session monitoring when user logs in
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (token && user) {
      updateActivity();
      cleanup = setupSessionMonitoring();
    } else {
      clearTimers();
    }

    return cleanup;
  }, [token, user, setupSessionMonitoring, clearTimers, updateActivity]);

  // Check session on component mount
  useEffect(() => {
    if (token && user) {
      checkSessionExpiry();
    }
  }, [token, user, checkSessionExpiry]);

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    setIsSessionExpired(false);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    updateActivity();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isSessionExpired,
      extendSession 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}