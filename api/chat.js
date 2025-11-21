// api/chat.js
// Vercel Node.js Serverless Function（固定 gpt-4o-mini + 输出上限 200 tokens）
// - 所有返回都用 { answer: string }，前端好处理
// - 模型写死为 gpt-4o-mini
// - max_tokens: 200，更适合详述项目经历
// - 出错信息也会通过 answer 返回到前端，方便排查

export default async function handler(req, res) {
  // GET：用来测试接口是不是活着
  if (req.method === "GET") {
    return res.status(200).json({
      answer: "chat API is working with gpt-4o-mini.",
    });
  }

  // 只允许 POST，其他方法直接友好提示
  if (req.method !== "POST") {
    return res.status(200).json({
      answer: 'Please use POST with JSON body: { "question": "..." }',
    });
  }

  // 读取环境变量里的 OpenAI Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      answer:
        "Server is missing OPENAI_API_KEY. Please set it in Vercel Environment Variables.",
    });
  }

  // 解析前端发来的 question
  let question = "";
  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body || "{}");
    }
    question = body?.question?.toString().trim() || "";
  } catch (err) {
    console.error("Error parsing request body:", err);
    return res.status(200).json({
      answer:
        "Request JSON could not be parsed. Please send JSON like: { \"question\": \"...\" }.",
    });
  }

  if (!question) {
    return res.status(200).json({
      answer: "I didn't receive your question. Could you ask it again?",
    });
  }

  // 真正调用 OpenAI：固定使用 gpt-4o-mini + 限制输出长度
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ 模型写死为 gpt-4o-mini
        max_tokens: 200,      // ✅ 最多输出 200 tokens，适合稍微详细一点的回答
        temperature: 0.4,     // 稍微理性一点，减少胡编乱造
        messages: [
          {
            role: "system",
            content:
              "You are an AI version of Vickie (Yueqi Liu), speaking in the first person as \"I\".\n\n" +
              "Background:\n" +
              "- I am a product manager with over 7 years of experience across mobile OS, brand communities, and fintech growth.\n" +
              "- At OnePlus (2018–2021) I first worked on the Android-based phone OS: system settings, display and reading mode, personalization features, and large version upgrade UX/UI polish. Later I moved to the OnePlus Community app, leading a major redesign, the Ideas 2.0 co-creation platform, and user growth initiatives.\n" +
              "- At moomoo / Futu (2021–2024) I worked on the global investor community and then on growth. I led projects like trading notes, premium content modules, long-term community strategy, a configurable accounts tab for different user states, and optimisation of the Canada account-opening funnel (e.g. SIN field placement, KYC guidance), improving conversion from registration to account opening.\n" +
              "- I focus on user-centric design, data-informed decisions, and working closely with engineering, design and operations.\n\n" +
              "Style:\n" +
              "- Think deeply and answer in a structured, logical way.\n" +
              "- Prioritise high-value insights over small talk. Avoid generic advice or filler.\n" +
              "- When helpful, organise answers with short paragraphs or bullet points so they are easy to scan.\n" +
              "- Be concise but not shallow: explain the \"why\" and \"how\", not just the conclusion.\n" +
              "- Default to English unless the user writes in Chinese, then reply in Chinese.\n" +
              "- If you are unsure about something, say so honestly instead of making things up.",
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
      console.error("OpenAI API error:", data);
      const msg =
        data?.error?.message || JSON.stringify(data) || "Unknown OpenAI error";
      return res.status(200).json({
        answer: `调用 OpenAI 失败：${msg}`,
      });
    }

    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate an answer this time. Could you try again?";

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("Error calling OpenAI:", err);
    return res.status(200).json({
      answer:
        "There was an error calling OpenAI (network or configuration issue). Please try again later.",
    });
  }
}
