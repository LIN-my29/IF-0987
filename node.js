const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// 中间件：解析JSON + 允许跨域（适配GitHub Pages）
app.use(express.json());
app.use(cors());

// 从环境变量读取API Key（安全不泄露）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// AI聊天接口（流式响应）
app.post('/chat', async (req, res) => {
  try {
    // 请求DeepSeek官方接口
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "AI接口调用失败" });
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 转发流式数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();

  } catch (error) {
    res.status(500).json({ error: "服务异常", msg: error.message });
  }
});

// 适配Cyclic端口（核心！不能写死3000）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务启动成功：端口 ${PORT}`);
});