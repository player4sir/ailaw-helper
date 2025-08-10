// Markdown -> docx 的简易映射：标题/粗体/斜体/有序&无序列表/引用
// 非完整实现：覆盖常见语法，保持样式简洁
import { Paragraph, TextRun, HeadingLevel, AlignmentType, Indent } from 'docx';

// {{ AURA: Modify - 优化段落样式：两端对齐、行距与段距、列表缩进、标题字号与字体 }}
const baseParagraph = (children?: TextRun[] | string) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, before: 120, after: 120 },
  indent: { firstLine: 480 },
  ...(typeof children === 'string' ? { text: children } : { children: children || [] }),
});

const listParagraph = (text: string, opts?: { ordered?: boolean; index?: number }) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, before: 60, after: 60 },
  indent: { left: 720, hanging: 360 },
  text: opts?.ordered ? `${(opts.index ?? 0) + 1}. ${text}` : `• ${text}`,
});

export function mdToDocxParagraphs(md: string): Paragraph[] {
  const lines = (md || '').split(/\r?\n/);
  const paras: Paragraph[] = [];

  for (const raw of lines) {
    const line = raw ?? '';
    if (!line.trim()) { paras.push(new Paragraph('')); continue; }
    // 标题
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) { paras.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: h3[1], bold: true })], spacing: { before: 240, after: 120 } })); continue; }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) { paras.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: h2[1], bold: true })], spacing: { before: 360, after: 180 } })); continue; }
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) { paras.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: h1[1], bold: true })], spacing: { before: 480, after: 240 } })); continue; }
    // 列表（有序）
    const oli = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (oli) { paras.push(listParagraph(`${oli[1]}. ${oli[2]}`)); continue; }
    // 列表（无序）
    const uli = line.match(/^[-*]\s+(.+)/);
    if (uli) { paras.push(listParagraph(uli[1])); continue; }
    // 引用
    const bq = line.match(/^>\s+(.+)/);
    if (bq) { paras.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 360 }, children: [new TextRun({ text: bq[1], italics: true })], indent: { left: 480 } })); continue; }

    // 粗体/斜体（简易替换）
    const runs: TextRun[] = [];
    const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    let lastIndex = 0; let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) != null) {
      if (m.index > lastIndex) runs.push(new TextRun(line.slice(lastIndex, m.index)));
      const token = m[0];
      const isBold = token.startsWith('**');
      const text = token.replace(/^\*\*|\*\*$/g, '').replace(/^\*|\*$/g, '');
      runs.push(new TextRun({ text, bold: isBold, italics: !isBold }));
      lastIndex = m.index + token.length;
    }
    if (lastIndex < line.length) runs.push(new TextRun(line.slice(lastIndex)));
    paras.push(baseParagraph(runs));
  }

  return paras;
}



// HTML -> docx 的简易映射：标题/段落/列表/引用/预格式
export function htmlToDocxParagraphs(html: string): Paragraph[] {
  try {
    const dom = new DOMParser().parseFromString(html || '', 'text/html');
    const paras: Paragraph[] = [];
    const walk = (node: Element) => {
      const tag = node.tagName?.toLowerCase();
      const text = (node.textContent || '').trim();
      if (!text) return;
      if (tag === 'h1') paras.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true })], spacing: { before: 480, after: 240 } }));
      else if (tag === 'h2') paras.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true })], spacing: { before: 360, after: 180 } }));
      else if (tag === 'h3') paras.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true })], spacing: { before: 240, after: 120 } }));
      else if (tag === 'p' || tag === 'div' || tag === 'span') paras.push(baseParagraph(text));
      else if (tag === 'blockquote') paras.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text, italics: true })], indent: { left: 480 } }));
      else if (tag === 'ul') {
        Array.from(node.querySelectorAll(':scope > li')).forEach(li => paras.push(listParagraph((li.textContent||'').trim())));
      } else if (tag === 'ol') {
        Array.from(node.querySelectorAll(':scope > li')).forEach((li, i) => paras.push(listParagraph((li.textContent||'').trim(), { ordered: true, index: i })));
      } else if (tag === 'pre') {
        (node.textContent || '').split(/\r?\n/).forEach(line => paras.push(new Paragraph({ text: line })));
      }
    };
    Array.from(dom.body.children).forEach(el => walk(el as Element));
    return paras.length ? paras : [baseParagraph((dom.body.textContent||'').trim())];
  } catch {
    return [baseParagraph((html || '').replace(/<[^>]+>/g, ''))];
  }
}
