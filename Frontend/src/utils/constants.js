const APP_NAME = "AquaGuard";

const SIMULATION_INTERVAL_MS = 30_000;
const HISTORY_SAVE_INTERVAL_MS = 5 * 60 * 1_000;

// Currently all hard coded until the DB is initialized
const EXAMPLE_TANKS = [
  {
    id: "tank-001",
    ownerEmail: "josh@example.com",
    name: "Josh's Tank",
    type: "Freshwater community",
    gallons: 40,
    status: "Normal",
    temperature: 25.6,
    ph: 7.2,
    ammonia: 0,
  },
  {
    id: "tank-002",
    ownerEmail: "gregory@example.com",
    name: "Gregory's Tank",
    type: "Saltwater reef",
    gallons: 55,
    status: "Warning",
    temperature: 25,
    ph: 8.1,
    ammonia: 0.25,
  },
  {
    id: "tank-003",
    ownerEmail: "rhyanna@example.com",
    name: "Rhyanna's Tank",
    type: "Freshwater betta",
    gallons: 10,
    status: "Normal",
    temperature: 26.1,
    ph: 7,
    ammonia: 0,
  },
];

export {
  APP_NAME,
  SIMULATION_INTERVAL_MS,
  HISTORY_SAVE_INTERVAL_MS,
  EXAMPLE_TANKS,
};
