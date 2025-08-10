import React, { useEffect, useMemo, useRef, useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatStream, type ChatMessage } from '../lib/aiClient';

// 法律咨询（增强版）：
// - 支持多轮对话与流式输出
// - 支持“停止生成”、清空会话、复制/导出
// - 本地持久化对话记录（localStorage）
const LegalConsultation: React.FC = () => {
  // 对话消息（不在UI中显示system，但会随请求一起发送）
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const raw = localStorage.getItem('consult_messages_v1');
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // 消息列表底部锚点与自动滚动到最新
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);


  // 系统提示（合规与结构化回答）
  const systemPrompt = useMemo(
    () =>
      '你是一名专业的法律咨询助手，请使用 Markdown 输出（如 # 标题、- 列表、**加粗**、引用等），用通俗中文、结构化分点回答。若问题复杂或高风险，请提醒咨询执业律师，并在末尾给出相关法律依据（如有）。',
    []
  );

  // 持久化
  useEffect(() => {
    localStorage.setItem('consult_messages_v1', JSON.stringify(messages));
  }, [messages]);

  // 快速问题模版
  const quickPrompts = [
    '劳动合同纠纷如何维权？',
    '租房押金不退怎么办？',
    '电商退款被拒如何申诉？',
    '交通事故责任如何划分？',
  ];

  // 发送消息（流式）
  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    // 追加用户消息
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');

    // 追加占位的助手消息，用于流式拼接
    const assistantIndex = nextMessages.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // 发起流式请求
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    try {
      await chatStream(
        [
          { role: 'system', content: systemPrompt },
          ...nextMessages,
        ],
        // 流式回调：逐步拼接到最后一条助手消息
        (chunk) => {
          setMessages(prev => {
            const copy = [...prev];
            copy[assistantIndex] = {
              role: 'assistant',
              content: (copy[assistantIndex]?.content || '') + chunk,
            } as ChatMessage;
            return copy;
          });
        },
        { signal: controller.signal }
      );
    } catch (err) {
      console.error('咨询流式失败：', err);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleQuickPrompt = (p: string) => {
    setInput(p);
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
  };

  const handleCopyAll = async () => {
    const text = messages
      .filter(m => m.role !== 'system')
      .map(m => (m.role === 'user' ? `用户：${m.content}` : `助手：${m.content}`))
      .join('\n\n');
    await navigator.clipboard.writeText(text || '');
  };

  return (
    <div className="space-y-4">
      {/* 顶部提示与合规说明 + 操作区 */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-700">
            <div className="font-medium">AI 法律咨询</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleCopyAll} title="复制对话" className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 text-xs">
              复制
            </button>
            <button onClick={handleClear} title="清空会话" className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 text-xs">
              清空
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500 flex items-start space-x-2">
          <span>提示：AI 仅供参考，复杂或高风险情形请咨询执业律师。</span>
        </p>
      </div>

      {/* 简洁化：移除“快速提问”块，减少视觉噪点 */}

      {/* 对话区（标准聊天布局） */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
        <div className="h-[50vh] sm:h-[60vh] overflow-y-auto mobile-scroll space-y-4 pr-1">
          {messages.filter(m => m.role !== 'system').length === 0 && (
            <div className="text-sm text-gray-400 fade-in-up">开始你的提问吧，支持多轮追问～</div>
          )}
          {messages
            .filter(m => m.role !== 'system')
            .map((m, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'} fade-in-up`}>
                {/* 头像 */}
                {m.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <span className="text-xs">AI</span>
                  </div>
                )}
                <div className={`${m.role === 'user' ? 'order-2' : ''} max-w-[85%]`}>
                  {/* 气泡 */}
                  <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900'} px-3 py-2 rounded-2xl text-sm`}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: (p) => <a {...p} target="_blank" rel="noreferrer" className="text-blue-600 underline" />,
                            ul: (p) => <ul {...p} className="list-disc list-inside space-y-1" />,
                            ol: (p) => <ol {...p} className="list-decimal list-inside space-y-1" />,
                            strong: (p) => <strong {...p} className="font-semibold" />,
                            blockquote: (p) => <blockquote {...p} className="border-l-4 pl-3 text-gray-600" />,
                            code: (p) => <code {...p} className="bg-gray-100 px-1 rounded" />,
                          }}
                        >
                          {m.content || (idx === messages.length - 1 && streaming ? '正在生成…' : '')}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                  {/* 气泡操作：复制、重新生成（仅最后一条AI消息） */}
                  {m.role === 'assistant' && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <button
                        className="inline-flex items-center gap-1 hover:text-gray-600"
                        onClick={async () => {
                          await navigator.clipboard.writeText(m.content);
                        }}
                      >
                        复制
                      </button>
                      {idx === messages.filter(x => x.role !== 'system').length - 1 && !streaming && (
                        <button
                          className="inline-flex items-center gap-1 hover:text-gray-600"
                          onClick={() => {
                            // 删除最后一条AI消息并重新发起
                            setMessages(prev => prev.slice(0, -1));
                            handleSend();
                          }}
                        >
                          重新生成
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <span className="text-xs">我</span>
                  </div>
                )}
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区：Enter发送，Shift+Enter换行 */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">请输入你的法律问题</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!streaming && input.trim()) handleSend();
            }
          }}
          placeholder="按 Enter 发送，Shift+Enter 换行。示例：房东拒绝退还押金，如何依法维权？"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="mt-3 flex justify-end gap-2">
          {streaming ? (
            <button
              onClick={handleStop}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-white bg-gray-500 hover:bg-gray-600 transition-colors"
            >
              <span>停止生成</span>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-white ${!input.trim() ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              <span>发送</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalConsultation;
