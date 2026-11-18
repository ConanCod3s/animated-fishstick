const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

import {
  readDocument,
  createTicket,
  parseDecision,
  escalationInstructions,
} from "./tickets.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    if (
      request.method === "POST" &&
      ["/chat", "/tickets/confirm"].includes(url.pathname)
    ) {
      try {
        const token = getAuthToken(request);

        if (!token) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const userId = getUserId(token);

        if (!userId) {
          return jsonResponse({ error: "Invalid token" }, 401);
        }

        const approvedUser = await getApprovedUser(userId, token);

        if (!approvedUser) {
          return jsonResponse({ error: "User is not approved" }, 403);
        }

        const chatRequest = await getChatRequest(request);

        if (!chatRequest) {
          return jsonResponse(
            { error: "Message and tank details are required" },
            400,
          );
        }

        const { message, tank: suppliedTank } = chatRequest;
        if (
          typeof suppliedTank.id !== "string" ||
          !suppliedTank.id ||
          suppliedTank.id.includes("/") ||
          suppliedTank.id.length > 1500
        ) {
          return jsonResponse({ error: "A valid tank ID is required" }, 400);
        }
        const tank = await readDocument(
          `tanks/${encodeURIComponent(suppliedTank.id)}`,
          token,
        );
        if (!tank) return jsonResponse({ error: "Tank not found" }, 404);
        tank.id = suppliedTank.id;
        if (url.pathname === "/tickets/confirm") {
          if (tank.ownerId !== userId)
            return jsonResponse(
              { error: "Only the tank owner can create a ticket" },
              403,
            );
          if (chatRequest.confirmEscalation !== true)
            return jsonResponse(
              { error: "Confirmation is required" },
              400,
            );
          const saved = await createTicket({
            tankId: tank.id,
            tank,
            userId,
            displayName: approvedUser.displayName ?? "",
            token,
            question: message,
            reason: "Request for human review as has been requested.",
            aiResponse: "",
            source: "user_confirmed",
          });
          return jsonResponse({
            response: saved.created
              ? "Request for human review has been submitted."
              : "There is already a support ticket for this tank.",
            ...saved,
          });
        }

        const systemPrompt = env.AQUAGUARD_SYSTEM_PROMPT?.trim();

        if (!systemPrompt) {
          return jsonResponse({ error: "AI prompt is not configured" }, 500);
        }

        const tankDetails =
          `Tank: ${tank.name}\n` +
          `Type: ${tank.type}\n` +
          `Size: ${tank.gallons} gallons\n` +
          `Status: ${tank.status}\n` +
          `Temperature: ${tank.temperature} °F\n` +
          `pH: ${tank.ph}\n` +
          `Ammonia: ${tank.ammonia} ppm`;

        const result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
          messages: [
            {
              role: "system",
              content: `${systemPrompt}\n\n${escalationInstructions}\n\nCurrent tank:\n${tankDetails}`,
            },
            { role: "user", content: message },
          ],
          chat_template_kwargs: {
            enable_thinking: false,
          },
        });

        const answer = result.choices?.[0]?.message?.content;

        if (!answer) {
          return jsonResponse(
            { error: "AquaGuard did not return an answer" },
            502,
          );
        }

        try {
          env.AI_USAGE?.writeDataPoint({
            indexes: [userId],
            blobs: [tank.id || tank.name],
            doubles: [1, message.length, answer.length],
          });
        } catch {
          // Ignore usage logging errors, as they should not block the functionality.
        }
        const decision = parseDecision(answer);
        if (!decision)
          return jsonResponse(
            {
              error:
                "AquaGuard returned an invalid response.",
            },
            502,
          );
        if (decision.escalation === "user_requested") {
          const existing = await readDocument(
            `supportTickets/${encodeURIComponent(tank.id)}`,
            token,
          );
          if (existing)
            return jsonResponse({
              response: "This tank already has a support ticket.",
              ticket: { ...existing, id: tank.id },
              created: false,
            });
          return jsonResponse({
            response: "Do you want to escalate this issue to an AquaGuard representative?",
            confirmationRequired: tank.ownerId === userId,
            escalationQuestion: message,
            escalationUnavailable: tank.ownerId !== userId,
          });
        }
        if (decision.escalation === "ai_required" && tank.ownerId === userId) {
          try {
            const saved = await createTicket({
              tankId: tank.id,
              tank,
              userId,
              displayName: approvedUser.displayName ?? "",
              token,
              question: message,
              reason: decision.reason,
              aiResponse: decision.response,
              source: "ai_required",
            });
            return jsonResponse({ response: decision.response, ...saved });
          } catch {
            return jsonResponse({
              response: decision.response,
              escalationError:
                "Human help was requested but the ticket could not be submitted.",
            });
          }
        }
        return jsonResponse({
          response: decision.response,
          escalationUnavailable:
            decision.escalation === "ai_required" && tank.ownerId !== userId,
        });
      } catch {
        return jsonResponse(
          { error: "AquaGuard is unavailable. Please try again." },
          503,
        );
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

function jsonResponse(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

async function getChatRequest(request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 2000 || !body.tank) {
      return null;
    }

    return {
      message,
      tank: body.tank,
      confirmEscalation: body.confirmEscalation,
    };
  } catch {
    return null;
  }
}

function getAuthToken(request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7);
}

function getUserId(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const user = JSON.parse(atob(base64));

    return user.user_id || user.sub;
  } catch {
    return null;
  }
}

async function getApprovedUser(userId, token) {
  const projectId = "animated-fishstick";
  const userUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/users/${encodeURIComponent(userId)}`;

  const response = await fetch(userUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const user = await response.json();
  if (user.fields?.approved?.booleanValue !== true) return null;

  return { displayName: user.fields?.displayName?.stringValue ?? "" };
}
