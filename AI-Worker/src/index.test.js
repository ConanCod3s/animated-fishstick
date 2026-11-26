
import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import worker from "./index.js";

const BASE_URL = "https://aquaguard.test";

// Sample tank readings used throughout the tests.
// Temperatures are stored in Fahrenheit.
const testTank = {
  id: "tank-1",
  name: "Test Tank",
  type: "Freshwater",
  gallons: 20,
  status: "normal",
  temperature: 77,
  ph: 7.2,
  ammonia: 0,
};

// Creates a fake Firebase token for testing.
// These tokens are not cryptographically valid and should never
// be treated as proof that production authentication is secure.
function createMockToken(userId = "test-user") {
  return `header.${btoa(JSON.stringify({ user_id: userId }))}.signature`;
}

// Builds requests for the Worker endpoints.
// Keeps the URL, headers, and request body consistent across tests.
function createRequest(path, { method = "GET", token, body } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // Only include the authorization header when a token is supplied.
  if (token != null) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Request(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

// Creates a standard chat request using sample aquarium data.
// Tests can override the token or body to simulate invalid requests.
function createChatRequest({
  token = createMockToken(),
  body = {
    message: "How is my aquarium?",
    tank: testTank,
  },
} = {}) {
  return createRequest("/chat", {
    method: "POST",
    token,
    body,
  });
}

// Mocks the Firestore lookup used to check user approval.
// This allows us to test approved and unapproved users
// without connecting to a live Firebase database.
function mockUserApproval(approved) {
  globalThis.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      fields: {
        approved: { booleanValue: approved },
      },
    }),
  });
}

function mockTankRead() {
  globalThis.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      fields: Object.fromEntries(
        Object.entries(testTank).map(([key, value]) => [
          key,
          typeof value === "number"
            ? { doubleValue: value }
            : { stringValue: value },
        ]),
      ),
    }),
  });
}

// Creates a mock Cloudflare environment with AI and analytics bindings.
// Each test can control the AI response without calling the real model.
function createEnvironment(aiResponse) {
  return {
    AQUAGUARD_SYSTEM_PROMPT: "You are an aquarium assistant.",
    AI: {
      run: jest.fn().mockResolvedValue(aiResponse),
    },
    AI_USAGE: {
      writeDataPoint: jest.fn(),
    },
  };
}

describe("AquaGuard AI Worker", () => {
  let originalFetch;

  // Save the original fetch function before each test.
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  // Restore fetch and clear mocks so tests do not affect each other.
  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // Verify that the health endpoint responds successfully.
  test("health endpoint returns OK", async () => {
    const response = await worker.fetch(createRequest("/health"), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  // Requests without an authorization token should be rejected.
  test("chat rejects requests without an authorization token", async () => {
    const request = createChatRequest({ token: null });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  // A malformed token should not be accepted as a valid user identity.
  test("chat rejects malformed tokens", async () => {
    const request = createChatRequest({ token: "invalid-token" });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid token" });
  });

  // Verify that requests to unsupported endpoints return 404.
  test("unknown endpoints return 404", async () => {
    const response = await worker.fetch(createRequest("/unknown"), {});

    expect(response.status).toBe(404);
  });

  // Simulate a user who exists in Firestore but is not approved.
  // The Worker should deny access before calling the AI model.
  test("chat rejects users who are not approved", async () => {
    mockUserApproval(false);

    const response = await worker.fetch(createChatRequest(), {});

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "User is not approved",
    });
  });

  // Chat requests must include a message before AI processing begins.
  test("chat rejects requests with missing messages", async () => {
    mockUserApproval(true);

    const request = createChatRequest({
      body: { tank: { name: "Test Tank" } },
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Message and tank details are required",
    });
  });

  // Chat requests must include tank information so the AI
  // has the aquarium context needed to generate guidance.
  test("chat rejects requests without tank details", async () => {
    mockUserApproval(true);

    const request = createChatRequest({
      body: { message: "How is my tank?" },
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Message and tank details are required",
    });
  });

  // Simulate a successful request from an approved user.
  // The AI response is mocked so the test remains predictable.
  test("chat returns an AI response for an approved user", async () => {
    mockUserApproval(true);
    mockTankRead();

    const env = createEnvironment({
      choices: [
        {
          message: {
            content: JSON.stringify({
              response: "Your aquarium looks healthy.",
              escalation: "none",
              reason: "",
            }),
          },
        },
      ],
    });

    const response = await worker.fetch(createChatRequest(), env);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      response: "Your aquarium looks healthy.",
      escalationUnavailable: false,
    });

    // Confirm that the Worker called the AI model exactly once.
    expect(env.AI.run).toHaveBeenCalledTimes(1);

    // Check the information sent to the AI, not just its response.
    // Temperature must be labeled in Fahrenheit to match stored readings.
    const aiRequest = env.AI.run.mock.calls[0][1];

    expect(aiRequest.messages[0].content).toContain(
      "Temperature: 77 °F"
    );
  });

  // An empty AI response should produce an error rather than
  // appearing to be a successful chat response.
  test("chat handles an empty AI response", async () => {
    mockUserApproval(true);
    mockTankRead();

    const env = createEnvironment({ response: "" });

    const response = await worker.fetch(createChatRequest(), env);

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBeTruthy();
  });
});
