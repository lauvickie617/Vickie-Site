// api/chat.js
// Vercel Node.js Serverless Function
// - GET: 简单测试接口是否正常
// - POST: 接收 { question }，调用 OpenAI，返回 { answer }

export default async function handler(req, res) {
  // GET：用来测试函数还活着
  if (req.method === "GET") {
    return res.status(200).json({
      answer: "chat API is working (LLM ready)", // 也用 answer 字段，方便前端统一处理
    });
  }

  // 只允许 POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(200).json({
      answer: "Method not allowed. Please use POST with JSON { question: ... }.",
    });
  }

  // 读环境变量里的 OpenAI API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // 这里直接在 answer 里告诉你问题出在哪
    return res.status(200).json({
      answer:
        "服务器没有配置 OPENAI_API_KEY。\n请在 Vercel 项目 Settings → Environment Variables 中设置 OPENAI_API_KEY。",
    });
  }

  // 解析 body
  let question = "";
  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body || "{}");
    }
    question = body?.question?.toString().trim() || "";
  } catch (e) {
    console.error("Error parsing request body", e);
    return res.status(200).json({
      answer:
        "请求体解析失败。请确认前端发送的是 JSON 格式：{ question: \"...\" }。",
    });
  }

  if (!question) {
    return res.status(200).json({
      answer: "我没有在请求里找到 question 字段，可以再试着问一次吗？",
    });
  }

  // 调 OpenAI Chat Completions
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 如果报模型错误，可以先换成 "gpt-4o" 或 "gpt-3.5-turbo"
        messages: [
          {
            role: "system",
            content:
              "You are an AI version of Vickie (Yueqi Liu), a product manager with experience in mobile OS, brand communities and fintech growth. " +
              "Answer questions in a clear, concise, friendly tone. If you don't know something, say you don't know.",
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
      // 把 OpenAI 错误信息写到 answer 里让你看见
      console.error("OpenAI API error", data);
      const msg =
        data?.error?.message || JSON.stringify(data) || "Unknown OpenAI API error";
      return res.status(200).json({
        answer: `调用 OpenAI 失败：${msg}`,
      });
    }

    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "我没有生成出合适的回答，可以再试一次吗？";

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("Error calling OpenAI", err);
    return res.status(200).json({
      answer: "调用 OpenAI 过程中出错了（可能是网络或配置问题），可以稍后再试一下。",
    });
  }
}
