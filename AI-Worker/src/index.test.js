
import { jest, describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import worker from "./index.js";

describe("AquaGuard AI Worker", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("health endpoint returns OK", async () => {
    const request = new Request("https://aquaguard.test/health");

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("chat rejects requests without an authorization token", async () => {
    const request = new Request("https://aquaguard.test/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "How is my aquarium?",
        tank: { name: "Test Tank" },
      }),
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  test("chat rejects malformed tokens", async () => {
    const request = new Request("https://aquaguard.test/chat", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "How is my aquarium?",
        tank: { name: "Test Tank" },
      }),
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid token" });
  });

  test("unknown endpoints return 404", async () => {
    const request = new Request("https://aquaguard.test/unknown");

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(404);
  });

  test("chat rejects users who are not approved", async () => {
    const token = `header.${btoa(JSON.stringify({ user_id: "test-user" }))}.signature`;

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: { approved: { booleanValue: false } },
      }),
    });

    const request = new Request("https://aquaguard.test/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "How is my tank?",
        tank: { name: "Test Tank" },
      }),
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "User is not approved",
    });
  });

  test("chat rejects requests with missing messages", async () => {
    const token = `header.${btoa(JSON.stringify({ user_id: "test-user" }))}.signature`;

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: { approved: { booleanValue: true } },
      }),
    });

    const request = new Request("https://aquaguard.test/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tank: { name: "Test Tank" },
      }),
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Message and tank details are required",
    });
  });

  test("chat rejects requests without tank details", async () => {
    const token = `header.${btoa(JSON.stringify({ user_id: "test-user" }))}.signature`;

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: { approved: { booleanValue: true } },
      }),
    });

    const request = new Request("https://aquaguard.test/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "How is my tank?",
      }),
    });

    const response = await worker.fetch(request, {});

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Message and tank details are required",
    });
  });

  test("chat returns an AI response for an approved user", async () => {
    const token = `header.${btoa(JSON.stringify({ user_id: "test-user" }))}.signature`;

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fields: { approved: { booleanValue: true } },
      }),
    });

    const env = {
      AQUAGUARD_SYSTEM_PROMPT: "You are an aquarium assistant.",
      AI: {
        run: jest.fn().mockResolvedValue({
          choices: [
            { message: { content: "Your aquarium looks healthy." } },
          ],
        }),
      },
      AI_USAGE: {
        writeDataPoint: jest.fn(),
      },
    };

    const request = new Request("https://aquaguard.test/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "How is my aquarium?",
        tank: {
          id: "tank-1",
          name: "Test Tank",
          type: "Freshwater",
          gallons: 20,
          status: "normal",
          temperature: 77,
          ph: 7.2,
          ammonia: 0,
        },
      }),
    });

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      response: "Your aquarium looks healthy.",
    });
    expect(env.AI.run).toHaveBeenCalledTimes(1);
    const aiRequest = env.AI.run.mock.calls[0][1];

expect(aiRequest.messages[0].content).toContain(
  "Temperature: 77 °F"
);
  });

test("chat handles an empty AI response", async () => {
  const token = `header.${btoa(JSON.stringify({ user_id: "test-user" }))}.signature`;

  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      fields: { approved: { booleanValue: true } },
    }),
  });

  const env = {
    AQUAGUARD_SYSTEM_PROMPT: "You are an aquarium assistant.",
    AI: {
      run: jest.fn().mockResolvedValue({ response: "" }),
    },
    AI_USAGE: {
      writeDataPoint: jest.fn(),
    },
  };

  const request = new Request("https://aquaguard.test/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "How is my aquarium?",
      tank: {
        id: "tank-1",
        name: "Test Tank",
        type: "Freshwater",
        gallons: 20,
        status: "normal",
        temperature: 77,
        ph: 7.2,
        ammonia: 0,
      },
    }),
  });

  const response = await worker.fetch(request, env);

  expect(response.status).toBe(502);
  expect((await response.json()).error).toBeTruthy();
});

});
