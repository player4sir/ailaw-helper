#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 检查AI功能配置...\n');

// 检查 .env 文件
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
    console.log('❌ 未找到 .env 文件');
    console.log('💡 请运行: cp .env.example .env');
    process.exit(1);
}

// 读取环境变量
try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    let hasApiKey = false;
    
    for (const line of lines) {
        if (line.startsWith('SILICONFLOW_API_KEY=') && line.includes('=')) {
            const value = line.split('=')[1].trim();
            if (value && value !== 'your_api_key_here' && value !== '') {
                hasApiKey = true;
                console.log('✅ SILICONFLOW_API_KEY 已配置');
            }
        }
    }
    
    if (!hasApiKey) {
        console.log('❌ SILICONFLOW_API_KEY 未配置或为空');
        console.log('💡 请在 .env 文件中设置你的 SiliconFlow API Key');
        console.log('🔗 获取API Key: https://cloud.siliconflow.cn/');
        process.exit(1);
    }
    
} catch (error) {
    console.log('❌ 读取 .env 文件失败:', error.message);
    process.exit(1);
}

// 检查依赖
try {
    const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = ['express', 'node-fetch'];
    
    for (const dep of requiredDeps) {
        if (packageJson.dependencies[dep]) {
            console.log(`✅ ${dep} 依赖已安装`);
        } else {
            console.log(`❌ 缺少依赖: ${dep}`);
            console.log('💡 请运行: npm install');
            process.exit(1);
        }
    }
} catch (error) {
    console.log('❌ 检查依赖失败:', error.message);
    process.exit(1);
}

console.log('\n🎉 AI功能配置检查通过！');
console.log('🚀 现在可以启动应用了:');
console.log('   npm run dev:all  # 同时启动前后端');
console.log('   或者分别启动:');
console.log('   npm run server   # 启动后端');
console.log('   npm run dev      # 启动前端');