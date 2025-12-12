import Constants from "expo-constants";
import { Platform } from "react-native";

interface AppConfig {
  env: "development" | "staging" | "production";
  version: string;
  buildNumber: string;
  platform: typeof Platform.OS;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  apiTimeout: number;
  maxRetries: number;
  logLevel: "debug" | "info" | "warn" | "error";
}

function getEnv(): AppConfig["env"] {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
  if (releaseChannel === "production") return "production";
  if (releaseChannel === "staging") return "staging";
  return "development";
}

function getLogLevel(): AppConfig["logLevel"] {
  const env = getEnv();
  if (env === "production") return "error";
  if (env === "staging") return "warn";
  return "debug";
}

export const config: AppConfig = {
  env: getEnv(),
  version: Constants.expoConfig?.version ?? "1.0.0",
  buildNumber: Constants.expoConfig?.ios?.buildNumber ?? "1",
  platform: Platform.OS,
  isWeb: Platform.OS === "web",
  isIOS: Platform.OS === "ios",
  isAndroid: Platform.OS === "android",
  apiTimeout: 30000,
  maxRetries: 3,
  logLevel: getLogLevel(),
};

export const isDev = config.env === "development";
export const isProd = config.env === "production";
export const isStaging = config.env === "staging";

export function shouldLog(level: AppConfig["logLevel"]): boolean {
  const levels: AppConfig["logLevel"][] = ["debug", "info", "warn", "error"];
  return levels.indexOf(level) >= levels.indexOf(config.logLevel);
}

export const log = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.log("[DEBUG]", ...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info("[INFO]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn("[WARN]", ...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error("[ERROR]", ...args);
  },
};
