function mockDefaultExport() {
  return null;
}

Object.assign(mockDefaultExport, {
  APP_NAME: "AquaGuard",
  AI_WORKER_URL: "http://localhost:8787",
  SIMULATION_INTERVAL_MS: 15000,
  auth: {},
  db: {},
  addDoc: jest.fn(),
  collection: jest.fn((database, name) => ({ database, name })),
  createUserWithEmailAndPassword: jest.fn(),
  doc: jest.fn((database, collectionName, id) => ({
    database,
    collectionName,
    id,
  })),
  serverTimestamp: jest.fn(() => "server-timestamp"),
  signInWithEmailAndPassword: jest.fn(),
  updateDoc: jest.fn(),
});

module.exports = mockDefaultExport;
