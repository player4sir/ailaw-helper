// 文书导出工具（PDF 已内置在组件中，这里提供 .docx 导出）
// 依赖 docx（需浏览器环境）
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun, PageOrientation } from 'docx';
import { mdToDocxParagraphs, htmlToDocxParagraphs } from './mdToDocx';

// 将 Markdown 内容渲染为 docx：支持 Markdown 或 HTML 输入
export async function exportToDocx(title: string, content: string, opts?: { isHtml?: boolean }) {
  const safeTitle = (title || '法律文书').replace(/[\\/:*?"<>|]/g, '_');

  // {{ AURA: Modify - 全局样式优化：设置默认字体、行距、段前后距、两端对齐与首行缩进 }}
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            // 正文字体：宋体，小四（12pt）
            font: '宋体',
            size: 24, // 12pt（docx为half-points）
          },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, before: 120, after: 120 }, // 行距1.5，段前/段后6pt
            indent: { firstLine: 480 }, // 首行缩进约两个汉字宽
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 2.54cm
            size: { orientation: PageOrientation.PORTRAIT },
          },
        },
        children: [
          // 标题：居中、加粗、较大字号
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({ text: title || '法律文书', bold: true, font: '黑体', size: 36 /* 18pt */ }),
            ],
            spacing: { after: 400 },
          }),
          ...(opts?.isHtml ? htmlToDocxParagraphs(content || '') : mdToDocxParagraphs(content || '')),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

