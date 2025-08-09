import express from 'express';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// 加载环境变量
config();

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 8787;
const SILICONFLOW_BASE = 'https://api.siliconflow.cn/v1';

// 安全代理：前端请求 /api/chat-completions -> 由本地服务携带服务端环境变量转发到 SiliconFlow
app.post('/api/chat-completions', async (req, res) => {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing SILICONFLOW_API_KEY in server environment' });
    }

    const resp = await fetch(`${SILICONFLOW_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // 流式透传（如果需要 stream: true）
    const isStream = req.body?.stream === true;
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (!resp.ok || !resp.body) {
        res.status(resp.status).end();
        return;
      }
      resp.body.pipe(res);
      return;
    }

    // 非流式 JSON
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'proxy error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

