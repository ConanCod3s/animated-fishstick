const APP_NAME = "AquaGuard";
const AI_WORKER_URL =
  import.meta.env.VITE_AI_WORKER_URL || "http://localhost:8787";

const SIMULATION_INTERVAL_MS = 5_000;
const HISTORY_SAVE_INTERVAL_MS = 5 * 60 * 1_000;

export {
  APP_NAME,
  AI_WORKER_URL,
  SIMULATION_INTERVAL_MS,
  HISTORY_SAVE_INTERVAL_MS,
};
