// api/chat.js
// 一个最简单的 Vercel 函数：
// - GET 用来测试服务是否正常
// - POST 用来接收问题，并返回一条测试回复

// 处理 GET 请求（方便你在浏览器直接访问 /api/chat 测试）
export function GET() {
  const body = JSON.stringify({ ok: true, message: "chat API is working" });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// 处理 POST 请求：前端之后会以 POST 方式发送 { question: "..." }
export async function POST(request) {
  let question = "";
  try {
    const data = await request.json();
    question = data?.question || "";
  } catch (e) {
    // 如果解析失败就忽略，保持 question 为空
  }

  const answer = question
    ? `我收到了你的问题：“${question}”。这是来自后端 API 的测试回复（还没接 LLM）。`
    : "这是来自后端 API 的测试回复（你没有传 question 字段）。";

  const body = JSON.stringify({ answer });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
