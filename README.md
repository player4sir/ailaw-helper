# AI法律助手应用

一个基于 React + TypeScript + AI 的智能法律助手应用，提供案件分析、文书生成和法条查询功能。

## ✨ 功能特性

- 🤖 **AI智能案件分析** - 基于大模型的专业案件分析
- 📝 **智能文书生成** - AI驱动的法律文书自动生成
- 🔍 **法条查询** - 快速检索相关法律条文
- 📱 **移动端优化** - 完美适配手机和平板设备
- 🎨 **现代化UI** - 基于 Tailwind CSS 的美观界面

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置AI服务
1. 复制环境变量模板：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的 SiliconFlow API Key：
   ```env
   SILICONFLOW_API_KEY=your_api_key_here
   ```

   > 💡 如何获取API Key：访问 [SiliconFlow](https://cloud.siliconflow.cn/) 注册账号并创建API Key

### 3. 启动应用

#### 方式一：同时启动前后端（推荐）
```bash
npm run dev:all
```

#### 方式二：分别启动
```bash
# 终端1：启动后端服务器
npm run server

# 终端2：启动前端开发服务器
npm run dev
```

### 4. 访问应用
- 前端应用：http://localhost:5173
- 后端API：http://localhost:8787

## 📱 移动端适配

本应用已完全适配移动端，支持：
- 响应式布局设计
- 触摸友好的交互
- 移动端专用导航
- 安全区域适配（支持刘海屏）

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Vite** - 快速的构建工具
- **Lucide React** - 美观的图标库

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **SiliconFlow API** - AI大模型服务

## 📂 项目结构

```
├── src/
│   ├── components/          # React组件
│   │   ├── CaseAnalysis.tsx    # 案件分析组件
│   │   ├── DocumentGenerator.tsx # 文书生成组件
│   │   ├── LawQuery.tsx        # 法条查询组件
│   │   └── Navigation.tsx      # 导航组件
│   ├── lib/
│   │   └── aiClient.ts         # AI客户端封装
│   ├── App.tsx              # 主应用组件
│   └── main.tsx            # 应用入口
├── server/
│   └── index.mjs           # 后端服务器
├── .env.example            # 环境变量模板
└── AI_SETUP.md            # AI配置详细说明
```

## 🔧 开发命令

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run server          # 启动后端服务器
npm run dev:all         # 同时启动前后端

# 构建
npm run build           # 构建生产版本
npm run preview         # 预览构建结果

# 代码质量
npm run lint            # 运行ESLint检查
```

## 📋 环境要求

- Node.js >= 16
- npm >= 8

## 🔒 安全说明

- API Key 仅在后端使用，前端不直接接触
- 所有AI请求通过本地代理服务器转发
- 敏感信息不会暴露给前端

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果遇到问题，请查看：
1. [AI配置说明](./AI_SETUP.md)
2. [移动端优化文档](./MOBILE_OPTIMIZATION.md)
3. 或提交 Issue