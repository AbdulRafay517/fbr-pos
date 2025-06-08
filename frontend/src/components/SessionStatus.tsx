import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const getSessionTimeout = () => {
  const stored = localStorage.getItem("sessionConfig");
  const defaultConfig = { timeoutMinutes: 30 };
  const config = stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
  return config.timeoutMinutes * 60 * 1000;
};

export function SessionStatus() {
  const { user, extendSession } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!user) return;

    const updateTimeRemaining = () => {
      const sessionTimeout = getSessionTimeout();
      const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0");
      const timeSinceLastActivity = Date.now() - lastActivity;
      const remaining = sessionTimeout - timeSinceLastActivity;
      
      setTimeRemaining(Math.max(0, remaining));
      
      // Show status when less than 10 minutes remaining
      setShowStatus(remaining < 10 * 60 * 1000 && remaining > 0);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [user]);

  if (!user || !showStatus) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Session Warning
          </h3>
          <p className="text-sm text-yellow-700">
            Session expires in {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>
        <button
          onClick={extendSession}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Extend Session
        </button>
      </div>
    </div>
  );
} 