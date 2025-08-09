// 前端 AI 客户端封装：统一与后端代理交互
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatOnce(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number }
) {
  // 调用后端代理进行一次性对话
  const resp = await fetch('/api/chat-completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options?.model || 'THUDM/GLM-4-9B-0414',
      messages,
      temperature: options?.temperature ?? 0.7,
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content as string;
}

export async function chatStream(
  messages: ChatMessage[],
  onDelta: (chunk: string) => void,
  options?: { model?: string; signal?: AbortSignal }
) {
  // 流式对话：支持 AbortSignal 以便在前端中止生成
  const resp = await fetch('/api/chat-completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: options?.model || 'THUDM/GLM-4-9B-0414', messages, stream: true }),
    signal: options?.signal,
  });
  if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) onDelta(delta);
        } catch {
          // 忽略JSON解析错误
        }
      }
    }
  } catch (err: any) {
    // 若为主动中断（AbortError），静默结束
    if (err?.name === 'AbortError') return;
    throw err;
  }
}

