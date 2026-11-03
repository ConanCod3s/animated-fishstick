const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ status: "ok" });
    }

    if (request.method === "POST" && url.pathname === "/chat") {
      const token = getAuthToken(request);

      if (!token) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const userId = getUserId(token);

      if (!userId) {
        return jsonResponse({ error: "Invalid token" }, 401);
      }

      const approved = await isApprovedUser(userId, token);

      if (!approved) {
        return jsonResponse({ error: "User is not approved" }, 403);
      }

      const chatRequest = await getChatRequest(request);

      if (!chatRequest) {
        return jsonResponse({ error: "Message and tank details are required" }, 400);
      }

      const { message, tank } = chatRequest;
      const systemPrompt = env.AQUAGUARD_SYSTEM_PROMPT?.trim();

      if (!systemPrompt) {
        return jsonResponse({ error: "AI prompt is not configured" }, 500);
      }

      const tankDetails =
        `Tank: ${tank.name}\n` +
        `Type: ${tank.type}\n` +
        `Size: ${tank.gallons} gallons\n` +
        `Status: ${tank.status}\n` +
        `Temperature: ${tank.temperature} °C\n` +
        `pH: ${tank.ph}\n` +
        `Ammonia: ${tank.ammonia} ppm`;

      const result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\nCurrent tank:\n${tankDetails}`,
          },
          { role: "user", content: message },
        ],
        chat_template_kwargs: {
          enable_thinking: false,
        },
      });

      const answer = result.choices?.[0]?.message?.content;

      if (!answer) {
        return jsonResponse({ error: "AquaGuard did not return an answer" }, 502);
      }

      env.AI_USAGE.writeDataPoint({
        indexes: [userId],
        blobs: [tank.id || tank.name],
        doubles: [1, message.length, answer.length],
      });

      return jsonResponse({ response: answer });
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
    const message = body.message?.trim();

    if (!message || !body.tank) {
      return null;
    }

    return { message, tank: body.tank };
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

async function isApprovedUser(userId, token) {
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
    return false;
  }

  const user = await response.json();
  return user.fields?.approved?.booleanValue === true;
}
