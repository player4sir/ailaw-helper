# AI功能配置说明

## 概述
本项目使用 SiliconFlow 提供的 AI 服务来实现智能案件分析和文书生成功能。

## 配置步骤

### 1. 获取 API Key
1. 访问 [SiliconFlow 官网](https://cloud.siliconflow.cn/)
2. 注册账号并登录
3. 在控制台中创建 API Key
4. 复制生成的 API Key

### 2. 配置环境变量
1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的 API Key：
   ```env
   SILICONFLOW_API_KEY=your_actual_api_key_here
   PORT=8787
   ```

### 3. 启动服务

#### 开发环境
```bash
# 启动后端服务器
npm run server

# 启动前端开发服务器（新终端窗口）
npm run dev
```

#### 生产环境
```bash
# 构建前端
npm run build

# 启动后端服务器
npm run server
```

## 使用的AI模型
- **默认模型**: `THUDM/GLM-4-9B-0414`
- **模型特点**: GLM-4是智谱AI开发的高性能大语言模型，在中文理解和生成方面表现优秀
- **用途**: 
  - 案件分析：智能分析案件优势、风险和建议
  - 文书生成：根据案件信息生成专业法律文书

## API 端点
- **健康检查**: `GET /api/health`
- **AI对话**: `POST /api/chat-completions`

## 故障排除

### 1. API Key 错误
如果看到 "Missing SILICONFLOW_API_KEY" 错误：
- 检查 `.env` 文件是否存在
- 确认 API Key 已正确填入
- 重启后端服务器

### 2. 网络连接问题
如果 AI 功能无法使用：
- 检查网络连接
- 确认 SiliconFlow 服务状态
- 查看浏览器控制台错误信息

### 3. 端口冲突
如果 8787 端口被占用：
- 修改 `.env` 文件中的 `PORT` 值
- 重启服务器

## 安全注意事项
- ⚠️ **不要将 `.env` 文件提交到版本控制系统**
- ⚠️ **不要在前端代码中直接使用 API Key**
- ⚠️ **定期更换 API Key**

## 费用说明
SiliconFlow 采用按使用量计费，请根据实际需求合理使用 AI 功能。