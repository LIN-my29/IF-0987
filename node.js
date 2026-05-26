const express = require('express');
const cors = require('cors'); // 解决跨域问题
const app = express();

// 中间件配置
app.use(express.json());
app.use(cors()); // 允许所有跨域请求（生产环境可限定域名）

// 替换为你的DeepSeek API Key
const DEEPSEEK_API_KEY = 'sk-478397c04e074508958eae8027460298';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 中转接口（支持流式响应）
app.post('/chat', async (req, res) => {
  try {
    // 转发请求到DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 响应失败: ${response.status}`);
    }

    // 处理流式响应（核心）
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 流式转发数据到前端
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
      await new Promise(resolve => setImmediate(resolve)); // 防止数据积压
    }

    res.end();
  } catch (error) {
    console.error('代理请求错误:', error);
    res.status(500).json({ 
      error: '服务异常', 
      message: error.message 
    });
  }
});

// 静态文件托管（可选：方便前端直接访问）
app.use(express.static('.'));

// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`中转服务已启动，地址：http://localhost:${PORT}`);
});