// api/chat.js
// 这是一个 Vercel 的 Node.js Serverless Function
// - GET: 测试接口是否正常
// - POST: 接受 { question }，调用 OpenAI，返回 { answer }

export default async function handler(req, res) {
  // 处理 GET 请求：方便你在浏览器打开 /api/chat 看看服务活着没
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "chat API is working (LLM ready)",
    });
  }

  // 限制只允许 POST，其它方法直接返回 405
  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 读环境变量里的 OpenAI API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    return res.status(500).json({
      error: "Server misconfiguration: OPENAI_API_KEY is not set",
    });
  }

  // 安全地解析 body
  let question = "";
  try {
    let body = req.body;
    // 有的运行时 body 已经是对象，有的是字符串，这里两种都兼容一下
    if (typeof body === "string") {
      body = JSON.parse(body || "{}");
    }
    question = body?.question?.toString().trim() || "";
  } catch (e) {
    console.error("Error parsing request body", e);
  }

  if (!question) {
    return res.status(400).json({ error: "Missing 'question' in request body" });
  }

  // 调 OpenAI Chat Completions 接口
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 体量小一点、便宜一点的模型，足够做 QA 用 :contentReference[oaicite:1]{index=1}
        messages: [
          {
            role: "system",
            content:
              "You are an AI version of Vickie (Yueqi Liu), a product manager with experience in mobile OS, brand communities and fintech growth. " +
              "Answer questions in a clear, concise, friendly tone. If the question is not about Vickie or her work, you can still answer briefly as a normal assistant.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error", data);
      return res.status(500).json({
        error: "OpenAI API error",
        details: data,
      });
    }

    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate an answer, please try again.";

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("Error calling OpenAI", err);
    return res.status(500).json({
      error: "Failed to call OpenAI",
    });
  }
}
