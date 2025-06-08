import { useState, useEffect } from "react";

interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  logoutOnTabClose: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  timeoutMinutes: 30,
  warningMinutes: 5,
  logoutOnTabClose: false,
};

export function useSessionConfig() {
  const [config, setConfig] = useState<SessionConfig>(() => {
    const stored = localStorage.getItem("sessionConfig");
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem("sessionConfig", JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: Partial<SessionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return {
    config,
    updateConfig,
    resetToDefaults: () => setConfig(DEFAULT_CONFIG),
  };
}

export function getSessionTimeout() {
  const stored = localStorage.getItem("sessionConfig");
  const config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  return config.timeoutMinutes * 60 * 1000; // Convert to milliseconds
}

export function getWarningTime() {
  const stored = localStorage.getItem("sessionConfig");
  const config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  return config.warningMinutes * 60 * 1000; // Convert to milliseconds
}

export function shouldLogoutOnTabClose() {
  const stored = localStorage.getItem("sessionConfig");
  const config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  return config.logoutOnTabClose;
} 