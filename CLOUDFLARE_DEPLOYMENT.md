# Cloudflare Pages 部署指南

## 🚀 部署步骤

### 1. 准备工作
确保项目已经推送到 GitHub 仓库：
```bash
git add .
git commit -m "feat: add Cloudflare Pages deployment config"
git push origin feature/ui-nav-refactor
```

### 2. 在 Cloudflare Dashboard 中创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Pages** > **Create a project**
3. 选择 **Connect to Git**
4. 选择您的 GitHub 仓库：`player4sir/ailaw-helper`
5. 配置构建设置：
   - **Project name**: `ailaw-helper`
   - **Production branch**: `main` (或 `feature/ui-nav-refactor`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (留空)

### 3. 环境变量配置

在 Cloudflare Pages 项目设置中添加环境变量：

#### Production 环境变量：
- `SILICONFLOW_API_KEY`: 您的 SiliconFlow API Key

#### 设置步骤：
1. 进入项目 > **Settings** > **Environment variables**
2. 点击 **Add variable**
3. 添加变量名和值
4. 选择 **Production** 环境
5. 点击 **Save**

### 4. 自定义域名（可选）

如果您有自定义域名：
1. 进入项目 > **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入您的域名
4. 按照指示配置 DNS 记录

## 📁 项目结构

```
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       ├── chat-completions.js  # AI API 代理
│       └── health.js            # 健康检查
├── dist/                   # 构建输出目录
├── public/
│   └── _redirects         # SPA 路由重定向
├── src/                   # 源代码
└── wrangler.toml          # Cloudflare 配置
```

## 🔧 本地测试

### 安装 Wrangler CLI（可选）
```bash
npm install -g wrangler
```

### 本地预览
```bash
# 构建项目
npm run build

# 使用 Wrangler 本地预览（如果安装了）
wrangler pages dev dist

# 或使用 Vite 预览
npm run preview
```

## 🌐 API 端点

部署后，API 端点将可用：
- **健康检查**: `https://your-domain.pages.dev/api/health`
- **AI 对话**: `https://your-domain.pages.dev/api/chat-completions`

## 🔒 安全配置

### CORS 设置
Functions 已配置 CORS 头部，允许跨域请求。

### 环境变量安全
- API Key 仅在 Cloudflare Functions 中使用
- 前端代码不包含敏感信息
- 所有 API 请求通过 Cloudflare Functions 代理

## 🚨 故障排除

### 1. 构建失败
- 检查 Node.js 版本兼容性
- 确保所有依赖已正确安装
- 查看构建日志中的错误信息

### 2. API 请求失败
- 确认环境变量 `SILICONFLOW_API_KEY` 已正确设置
- 检查 Functions 日志
- 验证 SiliconFlow API 服务状态

### 3. 路由问题
- 确认 `public/_redirects` 文件存在
- 检查 React Router 配置

## 📊 性能优化

### 已实现的优化：
- ✅ 代码分割（vendor, router, ui, markdown chunks）
- ✅ 静态资源压缩
- ✅ CDN 分发（Cloudflare 全球网络）
- ✅ 函数边缘计算

### 监控和分析：
- Cloudflare Analytics 提供访问统计
- Functions 执行日志和性能指标
- Real User Monitoring (RUM) 数据

## 🔄 自动部署

每次推送到配置的分支时，Cloudflare Pages 将自动：
1. 拉取最新代码
2. 运行构建命令
3. 部署到全球 CDN
4. 更新 Functions

## 📞 支持

如果遇到问题：
1. 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
2. 检查项目的 Functions 日志
3. 联系 Cloudflare 支持团队
