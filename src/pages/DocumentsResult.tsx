import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { renderToStaticMarkup } from 'react-dom/server';
import { Download, ArrowLeft } from 'lucide-react';
import { exportToDocx } from '../lib/exporters';

// 结果页：从路由 state 或 sessionStorage 读取数据
export default function DocumentsResult() {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const state = location.state || {};
  const title = state.title || sessionStorage.getItem('doc_title') || '法律文书';
  const content = state.content || sessionStorage.getItem('doc_content') || '';

  // 将Markdown转换为HTML，使用useMemo优化性能
  const mdHtml = useMemo(() => {
    try {
      return renderToStaticMarkup(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(content)}</ReactMarkdown>
      );
    } catch (error) {
      console.error('Markdown转换失败:', error);
      return null;
    }
  }, [content]);

  const handleExport = () => {
    // 为避免重复实现，复用窗口打印方案：新开页写入 HTML 并调用 window.print
    const win = window.open('', '_blank');
    if (!win) return;

    const escaped = String(content)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    const htmlBody = mdHtml && mdHtml.trim() ? mdHtml : `<pre>${escaped}</pre>`;
    const doc = win.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body>${htmlBody}<script>window.onload=()=>window.print()</script></body></html>`);
    doc.close();
  };

  const handleExportWord = () => {
    try {
      exportToDocx(String(title), mdHtml || String(content), { isHtml: !!mdHtml });
    } catch (error) {
      console.error('Word导出失败:', error);
      alert('Word导出失败，请稍后重试');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="px-2 py-1 rounded border text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div className="font-semibold text-gray-800 text-sm">{String(title)} - 结果预览</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm">
            <Download className="w-3 h-3" />
            <span>导出PDF</span>
          </button>
          <button onClick={handleExportWord} className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Download className="w-3 h-3" />
            <span>导出Word</span>
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(content)}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

