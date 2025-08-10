import React, { useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatOnce } from '../lib/aiClient';
import { useNavigate } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
// 规范校验工具模块化：集中于独立文件，便于扩展与复用
import { buildComplianceReport, autofillMissingSections, getCaseTypeGuidance, type ComplianceItem } from '../lib/documentCompliance';
import { exportToDocx } from '../lib/exporters';

const DocumentGenerator: React.FC = () => {
    const navigate = useNavigate();

    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [documentContent, setDocumentContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
    const [documentInfo, setDocumentInfo] = useState({
        plaintiff: '',
        defendant: '',
        case_type: '',
        court: '',
        case_number: '',
        case_details: ''
    });

    // 结果全屏页开关 + 高级选项

    // 中文注释：showResultPage 控制是否以全屏独立页展示生成结果；adv 为生成偏好
    const [showResultPage, setShowResultPage] = useState(false);
    const [adv, setAdv] = useState({
        citeLaw: true,        // 是否引用具体法律条文与司法解释
        citeCases: true,      // 是否引用典型案例/指导性案例
        tone: '正式',         // 语言风格：正式/稳健/通俗
        includeEvidence: true // 是否自动生成证据清单
    });

    // 规范检查结果状态
    const [compliance, setCompliance] = useState<ComplianceItem[] | null>(null);



    const templates = [
        {
            id: 'civil_complaint',
            name: '民事起诉状',
            description: '专业起草民事诉讼起诉文书，包含完整诉讼请求和法理依据',
            icon: '⚖️',
            color: 'blue',
            difficulty: '中等',
            time: '10-15分钟',
            features: ['诉讼请求', '事实理由', '法条引用', '证据清单']
        },
        {
            id: 'civil_response',
            name: '民事答辩状',
            description: '专业起草答辩文书，提供有力抗辩理由和法律依据',
            icon: '🛡️',
            color: 'green',
            difficulty: '中等',
            time: '10-15分钟',
            features: ['抗辩理由', '事实澄清', '法理论证', '程序抗辩']
        },
        {
            id: 'appeal',
            name: '上诉状',
            description: '专业起草二审上诉文书，深度分析一审判决问题',
            icon: '📈',
            color: 'purple',
            difficulty: '复杂',
            time: '20-25分钟',
            features: ['上诉理由', '事实重审', '法律纠错', '改判请求']
        },
        {
            id: 'evidence_list',
            name: '证据清单',
            description: '专业整理证据材料，分析证明力和关联性',
            icon: '📋',
            color: 'orange',
            difficulty: '简单',
            time: '5-8分钟',
            features: ['证据分类', '证明目的', '关联分析', '补强建议']
        },
        {
            id: 'counter_suit',
            name: '反诉状',
            description: '专业起草反诉文书，维护当事人合法权益',
            icon: '⚔️',
            color: 'red',
            difficulty: '复杂',
            time: '20-30分钟',
            features: ['反诉理由', '损失计算', '法律依据', '程序合规']
        },
        {
            id: 'settlement_agreement',
            name: '调解协议书',
            description: '专业起草调解协议，确保双方权益平衡',
            icon: '🤝',
            color: 'emerald',
            difficulty: '中等',
            time: '12-18分钟',
            features: ['协议条款', '履行保障', '违约责任', '争议解决']
        }
    ];

    const generateDocument = async () => {
        if (!selectedTemplate) {
            alert('请先选择文书模板');
            return;
        }

        // 验证必要信息
        const templateInfo = templates.find(t => t.id === selectedTemplate);
        const templateName = templateInfo?.name || '法律文书';

        if (!documentInfo.plaintiff && !documentInfo.defendant) {
            alert('请至少填写原告或被告姓名');
            return;
        }
        // 中文注释：新增案件详情必填校验，避免生成空洞文书
        if (!documentInfo.case_details || !documentInfo.case_details.trim()) {
            alert('请完善“案件详情”，以便生成更准确、规范的法律文书');
            return;
        }

        setIsGenerating(true);

        try {
            // 构建专业的法律文书起草律师角色
            const lawyerRole = `你是一位资深的法律文书起草专家，拥有20年的执业经验，专门为律师事务所和当事人起草各类专业法律文书。你精通中国法律法规，熟悉各类诉讼程序，能够根据案件具体情况起草规范、专业、有说服力的法律文书。

你的专业特长：
- 精通《民事诉讼法》、《民法典》等相关法律法规
- 熟悉各级法院的文书格式要求和审理习惯
- 擅长运用法理和判例支撑论证观点
- 能够准确把握案件争议焦点和法律关系
- 文书语言严谨、逻辑清晰、论证有力`;

            // 根据不同文书类型构建专业提示词
            const getDocumentPrompt = (templateId: string) => {
                // 中文注释：根据高级选项组合生成要求说明，提升生成质量
                const advDirectives = `\n【生成要求加固】\n${adv.citeLaw ? '- 请引用具体法律条文与相关司法解释；\n' : ''}${adv.citeCases ? '- 如有，可引用典型案例或指导性案例（简要说明关联）；\n' : ''}- 语言风格：${adv.tone || '正式'}；\n${adv.includeEvidence ? '- 请附带“证据材料清单”章节，包含编号、名称、证明目的；' : ''}`;

                const baseInfo = `
【当事人信息】
原告：${documentInfo.plaintiff || '（请完善）'}
被告：${documentInfo.defendant || '（请完善）'}
案件类型：${documentInfo.case_type || '（请选择）'}
审理法院：${documentInfo.court || '（请填写）'}
案件编号：${documentInfo.case_number || '（待分配）'}

【案件详情】
${documentInfo.case_details}
${advDirectives}`;

                switch (templateId) {
                    case 'civil_complaint':
                        return `${baseInfo}

【文书类型】民事起诉状

【起草要求】
请作为原告代理律师，起草一份专业的民事起诉状，要求：

1. **格式规范**：严格按照《民事诉讼法》和最高法院相关规定的格式
2. **当事人信息完整**：包括姓名、性别、年龄、民族、职业、住址、联系方式
3. **诉讼请求明确具体**：
   - 请求事项要具体、明确、可执行
   - 金额要准确，有计算依据
   - 包含诉讼费承担请求
4. **事实和理由充分**：
   - 按时间顺序叙述案件事实
   - 突出争议焦点和关键证据
   - 分析对方违约或侵权行为
   - 论证己方请求的合法性和合理性
5. **法律依据准确**：
   - 引用具体的法律条文
   - 结合相关司法解释
   - 参考典型判例（如有）
6. **证据材料清单**：列出主要证据及其证明目的
7. **语言专业严谨**：使用规范的法律术语，逻辑清晰

请生成完整的民事起诉状内容。`;

                    case 'civil_response':
                        return `${baseInfo}

【文书类型】民事答辩状

【起草要求】
请作为被告代理律师，起草一份专业的民事答辩状，要求：

1. **答辩策略明确**：
   - 分析原告起诉的薄弱环节
   - 提出有力的抗辩理由
   - 争取减轻或免除责任
2. **事实澄清**：
   - 对原告所述事实进行回应
   - 澄清被歪曲的事实
   - 补充有利的事实情节
3. **法律抗辩**：
   - 质疑原告的法律依据
   - 提出己方的法理观点
   - 运用相关法条和判例
4. **程序抗辩**（如适用）：
   - 管辖权异议
   - 诉讼时效抗辩
   - 当事人主体资格问题
5. **反驳论证**：
   - 逐一回应原告的诉讼请求
   - 提供相反的证据和理由
   - 论证己方行为的合法性
6. **结论明确**：请求法院驳回原告的全部或部分诉讼请求

请生成完整的民事答辩状内容。`;

                    case 'appeal':
                        return `${baseInfo}

【文书类型】上诉状

【起草要求】
请作为上诉人代理律师，起草一份专业的上诉状，要求：

1. **上诉理由充分**：
   - 分析一审判决的错误之处
   - 提出具体的上诉理由
   - 包括事实认定错误、法律适用错误、程序违法等
2. **事实重新梳理**：
   - 指出一审遗漏或误认的事实
   - 补充新的证据材料
   - 澄清争议焦点
3. **法律论证**：
   - 引用正确的法律条文
   - 分析一审适用法律的错误
   - 提供支持性的判例和理论依据
4. **上诉请求明确**：
   - 撤销一审判决
   - 改判或发回重审的具体请求
   - 诉讼费用承担
5. **程序合规**：确保在法定期限内提出，格式符合要求

请生成完整的上诉状内容。`;

                    case 'evidence_list':
                        return `${baseInfo}

【文书类型】证据清单

【起草要求】
请作为代理律师，制作一份专业的证据清单，要求：

1. **证据分类清晰**：
   - 书证、物证、视听资料、电子数据
   - 证人证言、当事人陈述
   - 鉴定意见、勘验笔录
2. **编号规范**：按照证据类型和重要性进行编号
3. **证明目的明确**：每项证据要说明其证明的具体事实
4. **证据来源**：说明证据的获取方式和合法性
5. **关联性分析**：证据与案件事实的关联程度
6. **证明力评估**：分析证据的证明效力
7. **补强建议**：指出需要进一步收集的证据

请生成完整的证据清单。`;

                    case 'counter_suit':
                        return `${baseInfo}

【文书类型】反诉状

【起草要求】
请作为反诉人代理律师，起草一份专业的反诉状，要求：

1. **反诉理由充分**：
   - 分析提起反诉的法律依据
   - 说明与本诉的关联性
   - 论证反诉的必要性和合理性
2. **反诉请求明确**：
   - 具体的反诉请求事项
   - 金额计算和依据
   - 相关费用承担
3. **事实和理由**：
   - 反诉所依据的事实
   - 对方的违约或侵权行为
   - 己方遭受的损失
4. **法律依据**：引用相关法律条文和司法解释
5. **证据支撑**：列出支持反诉的主要证据
6. **管辖和程序**：确保符合反诉的程序要求

请生成完整的反诉状内容。`;

                    case 'settlement_agreement':
                        return `${baseInfo}

【文书类型】调解协议书

【起草要求】
请作为调解律师，起草一份专业的调解协议书，要求：

1. **协议条款明确**：
   - 双方权利义务清晰
   - 履行方式和期限具体
   - 违约责任明确
2. **争议解决**：
   - 明确争议的解决方案
   - 双方的让步和妥协
   - 互谅互让的体现
3. **履行保障**：
   - 履行的具体安排
   - 监督和保障措施
   - 违约后果和救济
4. **法律效力**：
   - 协议的法律约束力
   - 不可撤销条款
   - 生效条件
5. **其他事项**：
   - 保密条款（如需要）
   - 争议解决方式
   - 协议的变更和解除

请生成完整的调解协议书内容。`;

                    default:
                        return `${baseInfo}

请根据上述信息生成专业的${templateName}，要求格式规范、内容完整、法律依据准确。`;
                }
            };

            const documentPrompt = getDocumentPrompt(selectedTemplate);

            const aiResponse = await chatOnce([
                {
                    role: 'system',
                    content: lawyerRole
                },
                {
                    role: 'user',
                    content: documentPrompt
                }
            ], {
                temperature: 0.1, // 极低温度确保文书的严谨性和一致性
                model: 'THUDM/GLM-4-9B-0414'
            });

            if (aiResponse) {
                setDocumentContent(aiResponse);
                // 生成成功：自动跳转结果页（移动端友好）
                const tname = templates.find(t => t.id === selectedTemplate)?.name || '法律文书';
                sessionStorage.setItem('doc_title', tname);
                sessionStorage.setItem('doc_content', aiResponse);
                sessionStorage.setItem('doc_template_id', selectedTemplate);
                sessionStorage.setItem('doc_case_type', documentInfo.case_type || '');
                // 使用路由跳转，避免弹窗策略影响
                navigate('/documents/result');
            } else {
                throw new Error('AI生成失败');
            }
        } catch (error) {
            console.error('AI生成文书失败:', error);
            alert('AI生成失败，请稍后重试');

            // 降级到模板内容
            const fallbackContent = generateFallbackContent();
            setDocumentContent(fallbackContent);
        } finally {
            setIsGenerating(false);
        }
    };

    // 生成降级模板内容（当AI生成失败时使用）
    // 中文注释：根据选择的模板生成一个基础的示例文书，确保导出时不会为空
    const generateFallbackContent = () => {
        const templateInfo = templates.find(t => t.id === selectedTemplate);
        const templateName = templateInfo?.name || '法律文书';

        if (selectedTemplate === 'civil_complaint') {
            return `${templateName}

原告：${documentInfo.plaintiff || '张三'}，男，汉族，1980年1月1日出生
住址：北京市朝阳区xxx路xxx号
联系电话：138xxxxxxxx

被告：${documentInfo.defendant || '李四'}，女，汉族，1985年3月15日出生
住址：北京市海淀区xxx路xxx号
联系电话：139xxxxxxxx

诉讼请求：
一、请求法院判令被告立即偿还欠款人民币50,000元；
二、请求法院判令被告支付逾期利息（按照年利率6%计算，自2023年1月1日起至实际清偿之日止）；
三、本案诉讼费用由被告承担。

事实和理由：
2022年12月1日，原告与被告签订《借款协议》一份，约定被告向原告借款人民币50,000元，借款期限为一年，即自2022年12月1日至2023年12月1日止，年利率为6%。协议签订后，原告按约定将借款50,000元通过银行转账方式交付给被告。

借款到期后，原告多次催收，被告一直拖欠不还，严重违反了双方签订的借款协议。被告的行为已构成违约，应当承担相应的法律责任。

综上所述，被告应当立即偿还借款本金及利息。根据《中华人民共和国民法典》相关规定，特向贵院提起诉讼，恳请贵院依法支持原告的诉讼请求。

此致
${documentInfo.court || '北京市朝阳区人民法院'}

起诉人：${documentInfo.plaintiff || '张三'}
日期：${new Date().toLocaleDateString('zh-CN')}`;
        } else if (selectedTemplate === 'civil_response') {
            return `${templateName}

答辩人：${documentInfo.defendant || '李四'}，女，汉族，1985年3月15日出生
住址：北京市海淀区xxx路xxx号
联系电话：139xxxxxxxx

针对${documentInfo.plaintiff || '张三'}诉本人xxx纠纷一案（案号：${documentInfo.case_number || '(2024)京xxxx民初xxx号'}），现提出如下答辩意见：

一、原告的起诉缺乏事实和法律依据

答辩人认为，原告所述借款事实与客观情况不符。双方之间的款项往来系基于其他合作关系，并非单纯的借贷关系。原告提供的所谓《借款协议》存在重大瑕疵，不能作为认定借贷关系的有效证据。

二、原告主张的金额存在错误

即使双方存在债权债务关系，原告主张的金额也明显高于实际情况。答辩人已通过其他方式向原告偿还了部分款项，原告故意隐瞒相关事实，夸大债务金额。

三、利息计算不当

原告主张的年利率6%没有合法依据，且超出了当时的市场合理水平。根据相关法律规定，应当按照实际约定的利率计算，而非原告单方面主张的标准。

四、请求法院驳回原告的全部诉讼请求

综上所述，原告的起诉缺乏事实和法律依据，其诉讼请求不应得到支持。请求贵院依法驳回原告的全部诉讼请求，维护答辩人的合法权益。

此致
${documentInfo.court || '北京市朝阳区人民法院'}

答辩人：${documentInfo.defendant || '李四'}
日期：${new Date().toLocaleDateString('zh-CN')}`;
        } else {
            return `${templateName}

[此处为${templateName}的标准格式内容]

当事人信息：
原告：${documentInfo.plaintiff || '请填写原告姓名'}
被告：${documentInfo.defendant || '请填写被告姓名'}
案件类型：${documentInfo.case_type || '请选择案件类型'}
审理法院：${documentInfo.court || '请填写审理法院'}

请根据具体案件情况完善文书内容。

日期：${new Date().toLocaleDateString('zh-CN')}`;
        }
    };

    // 已移除简易 Markdown -> HTML 转换函数，统一使用 ReactMarkdown 渲染富文本

    // 富文本格式化函数（仅用于导出PDF的HTML格式化）
    // 中文注释：为避免“先使用后定义”的运行时错误，将此函数上移至 exportToPDF 之前
    const formatDocumentContentForExport = (content: string) => {
        if (!content) return '';
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^([^\n]*(?:起诉状|答辩状|上诉状|反诉状|协议书|清单)[^\n]*)/gm,'<h1 class="document-title">$1</h1>')
            .replace(/^(原告|被告|上诉人|被上诉人|申请人|被申请人|甲方|乙方)：([^\n]+)/gm,'<div class="party-info"><strong class="party-label">$1：</strong><span class="party-details">$2</span></div>')
            .replace(/^([一二三四五六七八九十]+、[^\n]+)/gm,'<h2 class="section-title">$1</h2>')
            .replace(/^（([一二三四五六七八九十]+)）([^\n]+)/gm,'<h3 class="subsection-title">（$1）$2</h3>')
            .replace(/^(\d+\.[^\n]+)/gm,'<div class="numbered-item">$1</div>')
            .replace(/(《[^》]+》[^，。；]*条[^，。；]*)/g,'<span class="legal-reference">$1</span>')
            .replace(/(人民币\s*[\d,，]+(?:\.\d+)?(?:\s*元|万元|亿元)?)/g,'<span class="amount">$1</span>')
            .replace(/(\d{4}年\d{1,2}月\d{1,2}日)/g,'<span class="date">$1</span>')
            .replace(/^(此致)$/gm, '<div class="closing">$1</div>')
            .replace(/^[^\n]*人民法院[^\n]*$/gm, '<div class="court-name">$&</div>')
            .replace(/^(起诉人|答辩人|上诉人|申请人|代理人)：([^\n]+)$/gm,'<div class="signature-line"><span class="signature-label">$1：</span><span class="signature-name">$2</span></div>')
            .replace(/^(日期：[^\n]+)$/gm, '<div class="signature-date">$1</div>')
            .replace(/\n\n+/g, '</p><p class="paragraph">')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p class="paragraph">')
            .replace(/$/, '</p>')
            .replace(/<p class="paragraph"><\/p>/g, '')
            .replace(/<p class="paragraph"><br><\/p>/g, '');
    };


    const exportToPDF = () => {
        if (!documentContent) return;

        const title = `${templates.find(t => t.id === selectedTemplate)?.name || '法律文书'}`;
        const win = window.open('', '_blank');
        if (!win) return;

        // 富文本格式化处理（导出PDF专用）：优先 Markdown 转 HTML，其次回退 HTML，最后纯文本转 <br>
        const fallbackContent = formatDocumentContentForExport(documentContent);
        // 优先使用 ReactMarkdown 渲染为静态 HTML，保证富文本（标题/列表/粗斜体/链接等）
        const mdHtml = renderToStaticMarkup(
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{documentContent}</ReactMarkdown>
        );
        const escaped = documentContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        const htmlBody = (mdHtml && mdHtml.trim()) ? mdHtml : ((fallbackContent && fallbackContent.trim()) ? fallbackContent : escaped);

        win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap');

        @page {
            size: A4;
            margin: 2.5cm 2cm;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Serif SC', 'SimSun', '宋体', 'Microsoft YaHei', serif;
            line-height: 1.8;
            margin: 0;
            padding: 20px;
            font-size: 15px;
            color: #000;
            background: white;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-feature-settings: "kern" 1;
        }

        h1 {
            text-align: center;
            margin: 0 0 40px 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: 2px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }

        .content {
            text-align: justify;
            text-justify: inter-ideograph;
            word-break: break-word;
            hyphens: auto;
        }

        .paragraph {
            margin: 15px 0;
            text-indent: 2em;
            line-height: 1.8;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin: 25px 0 15px 0;
            color: #000;
            text-indent: 0;
            line-height: 1.6;
        }

        .sub-title {
            font-size: 15px;
            font-weight: 500;
            margin: 20px 0 10px 0;
            color: #000;
            text-indent: 1em;
            line-height: 1.6;
        }

        .numbered-item {
            margin: 8px 0;
            text-indent: 2em;
            line-height: 1.7;
        }

        .signature-section {
            margin-top: 50px;
            text-align: right;
            line-height: 2;
        }

        .date-line {
            margin-top: 30px;
            text-align: right;
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
                font-size: 14px;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }

            .no-print {
                display: none !important;
            }

            h1 {
                font-size: 20px;
                margin-bottom: 30px;
            }

            .section-title {
                font-size: 15px;
                page-break-after: avoid;
            }

            .paragraph {
                orphans: 3;
                widows: 3;
            }

            /* 确保重要内容不被分页 */
            .signature-section {
                page-break-inside: avoid;
            }
        }

        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }

        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .print-btn:active {
            transform: translateY(0);
        }

        /* 优化中文字体渲染 */
        .content, .paragraph, .section-title, .sub-title, .numbered-item {
            font-variant-east-asian: traditional;
            text-rendering: optimizeLegibility;
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">
        📄 打印/保存为PDF
    </button>

    <div class="document">
        <h1>${title}</h1>
        <div class="content" id="md-content">${htmlBody}</div>
    </div>

    <script>
        // 页面加载完成后的处理
        window.onload = function() {
            // 自动聚焦到打印按钮
            const printBtn = document.querySelector('.print-btn');
            if (printBtn) {
                printBtn.focus();
            }

            // 注：某些浏览器会阻止 window.open 后立即同步写入渲染，这里主动触发一次重绘


            // 优化字体加载
            if (document.fonts) {
                document.fonts.ready.then(() => {
                    console.log('字体加载完成');
                });
            }
        }

        // 键盘快捷键
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
            if (e.key === 'Escape') {
                window.close();
            }
        });

        // 打印前的处理
        window.addEventListener('beforeprint', function() {
            document.title = '${title} - 准备打印';
        });

        // 打印后的处理
        window.addEventListener('afterprint', function() {
            document.title = '${title}';
        });
    </script>
</body>
</html>`);
        win.document.close();
    };

    // 已上移至 exportToPDF 之前定义，避免重复声明

    return (
        <>
            {/* 富文本样式 */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .formatted-document {
                    font-family: 'SimSun', '宋体', serif;
                    line-height: 1.8;
                    color: #1a1a1a;
                }

                .document-title {
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin: 0 0 2rem 0;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #333;
                }

                .party-info {
                    margin: 0.5rem 0;
                    padding: 0.5rem 0;
                }

                .party-label {
                    font-weight: bold;
                    color: #2563eb;
                    min-width: 4rem;
                    display: inline-block;
                }

                .party-details {
                    margin-left: 0.5rem;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin: 1.5rem 0 1rem 0;
                    color: #1e40af;
                    border-left: 4px solid #3b82f6;
                    padding-left: 0.75rem;
                }

                .subsection-title {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 1rem 0 0.5rem 0;
                    color: #1e40af;
                    text-indent: 1rem;
                }

                .numbered-item {
                    margin: 0.5rem 0;
                    text-indent: 2rem;
                    line-height: 1.6;
                }

                .legal-reference {
                    background-color: #fef3c7;
                    color: #92400e;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-weight: 500;
                }

                .amount {
                    background-color: #dcfce7;
                    color: #166534;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-weight: 600;
                }

                .date {
                    background-color: #e0e7ff;
                    color: #3730a3;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-weight: 500;
                }

                .closing {
                    margin-top: 2rem;
                    text-align: left;
                    font-weight: 500;
                }

                .court-name {
                    margin: 0.5rem 0;
                    font-weight: 600;
                    color: #1e40af;
                }

                .signature-line {
                    margin: 1rem 0;
                    text-align: right;
                }

                .signature-label {
                    font-weight: 500;
                }

                .signature-name {
                    margin-left: 1rem;
                    font-weight: 600;
                }

                .signature-date {
                    margin: 1rem 0;
                    text-align: right;
                    font-weight: 500;
                }

                .paragraph {
                    margin: 1rem 0;
                    text-indent: 2rem;
                    text-align: justify;
                    line-height: 1.8;
                }

                .paragraph:first-child {
                    margin-top: 0;
                }

                .paragraph:last-child {
                    margin-bottom: 0;
                }
                `
            }} />

            <div className="space-y-4">
                {/* 简洁化：移除顶部大标题，使焦点在功能本身 */}

                {/* 模板选择 - 移动端优化的两列网格布局 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm">选择文书模板</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`p-3 rounded-xl border-2 transition-all text-left relative ${selectedTemplate === template.id
                                    ? template.color === 'blue' ? 'border-blue-500 bg-blue-50' :
                                        template.color === 'green' ? 'border-green-500 bg-green-50' :
                                            template.color === 'purple' ? 'border-purple-500 bg-purple-50' :
                                                template.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                                                    template.color === 'red' ? 'border-red-500 bg-red-50' :
                                                        'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {selectedTemplate === template.id && (
                                    <div className="absolute top-2 right-2 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                        已选
                                    </div>
                                )}

                                {/* 移除emoji图标，纯文字风格更简洁 */}
                                <h4 className="font-medium text-gray-800 text-sm mb-1">{template.name}</h4>
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                                {/* 专业特性标签 */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {template.features?.slice(0, 2).map((feature, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                            {feature}
                                        </span>
                                    ))}
                                    {template.features && template.features.length > 2 && (
                                        <span className="text-xs text-gray-400">+{template.features.length - 2}</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className={`px-2 py-1 rounded-full ${template.difficulty === '简单' ? 'bg-green-100 text-green-700' :
                                        template.difficulty === '中等' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {template.difficulty}
                                    </span>
                                    <div className="flex items-center text-gray-500">
                                        <span className="text-[11px]">耗时约 {template.time}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 基本信息表单 - 移动端优化 */}
                {selectedTemplate && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                            📝 {templates.find(t => t.id === selectedTemplate)?.name} - 专业信息录入
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        原告姓名
                                    </label>
                                    <input
                                        type="text"
                                        value={documentInfo.plaintiff}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, plaintiff: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                        placeholder="请输入原告姓名"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        被告姓名
                                    </label>
                                    <input
                                        type="text"
                                        value={documentInfo.defendant}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, defendant: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                        placeholder="请输入被告姓名"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    案件类型
                                </label>
                                <select
                                    value={documentInfo.case_type}
                                    onChange={(e) => setDocumentInfo({ ...documentInfo, case_type: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                >
                                    <option value="">请选择案件类型</option>
                                    <option value="contract">合同纠纷</option>
                                    <option value="loan">借贷纠纷</option>
                                    <option value="property">财产纠纷</option>
                                    <option value="tort">侵权纠纷</option>
                                    <option value="labor">劳动纠纷</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    审理法院
                                </label>
                                <input
                                    type="text"
                                    value={documentInfo.court}
                                    onChange={(e) => setDocumentInfo({ ...documentInfo, court: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                    placeholder="请输入审理法院"
                                />
                            </div>

                                {/* 高级生成选项 */}
                                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={adv.citeLaw}
                                            onChange={(e)=>setAdv(v=>({...v, citeLaw: e.target.checked}))} />
                                        引用法律条文/司法解释
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={adv.citeCases}
                                            onChange={(e)=>setAdv(v=>({...v, citeCases: e.target.checked}))} />
                                        引用典型/指导性案例
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={adv.includeEvidence}
                                            onChange={(e)=>setAdv(v=>({...v, includeEvidence: e.target.checked}))} />
                                        生成证据清单章节
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">语言风格</span>
                                        <select className="border rounded px-2 py-1" value={adv.tone} onChange={(e)=>setAdv(v=>({...v, tone: e.target.value}))}>
                                            <option value="正式">正式</option>
                                            <option value="稳健">稳健</option>
                                            <option value="通俗">通俗</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 类型专项编写指引 */}
                                <div className="mt-2 text-xs text-gray-600 bg-amber-50 border border-amber-200 p-2 rounded">
                                    <div className="font-medium text-amber-700 mb-1">编写指引（按案件类型）</div>
                                    {(() => {
                                        const tips: string[] = getCaseTypeGuidance(documentInfo.case_type);
                                        return tips?.length ? (
                                            <ul className="list-disc list-inside space-y-0.5">
                                                {tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                            </ul>
                                        ) : <div className="opacity-70">根据案件类型选择不同要素，系统会给出专项提示</div>;
                                    })()}
                                </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    案件详情 <span className="text-purple-600">*</span>
                                </label>
                                <textarea
                                    value={documentInfo.case_details || ''}
                                    onChange={(e) => setDocumentInfo({ ...documentInfo, case_details: e.target.value })}
                                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
                                    placeholder={`请详细描述案件情况，以便AI生成更准确的${templates.find(t => t.id === selectedTemplate)?.name}：

📋 争议事实：发生了什么？关键争议点是什么？
📅 时间节点：重要事件的时间顺序
💰 涉及金额：具体的金额和计算依据
📄 证据情况：您掌握了哪些证据？
🎯 诉求目标：希望达到什么结果？

详细信息有助于AI生成更专业的法律文书！`}
                                />
                            </div>

                            <button
                                onClick={generateDocument}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:hover:shadow-lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span className="text-sm">AI生成中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm">生成文书</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* 专业文书编辑器 */}
                {documentContent && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                        {/* 编辑器头部 */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800 text-sm">
                                    📄 {templates.find(t => t.id === selectedTemplate)?.name} - 专业编辑器
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            // 同步缓存到 sessionStorage 供结果页读取
                                            const tname = templates.find(t => t.id === selectedTemplate)?.name || '法律文书';
                                            sessionStorage.setItem('doc_title', tname);
                                            sessionStorage.setItem('doc_content', documentContent || '');
                                            sessionStorage.setItem('doc_template_id', selectedTemplate);
                                            sessionStorage.setItem('doc_case_type', documentInfo.case_type || '');
                                            window.location.href = '/documents/result';
                                        }}
                                        className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                    >
                                        <span>查看完整页面</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={exportToPDF}
                                            className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg绿色-700 transition-colors text-sm"
                                        >
                                            <span>导出PDF</span>
                                        </button>
                                        <button
                                            onClick={() => {
    const html = renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm]}>{documentContent}</ReactMarkdown>);
    exportToDocx(templates.find(t => t.id === selectedTemplate)?.name || '法律文书', html || documentContent, { isHtml: !!html });
  }}
                                            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <span>导出Word</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 工具栏 */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setViewMode('preview')}
                                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${viewMode === 'preview'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        <span>预览</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('edit')}
                                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${viewMode === 'edit'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        <span>编辑</span>
                                    </button>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span>字数: {documentContent.length}</span>
                                    <span>•</span>
                                    <span>AI生成</span>
                                </div>
                            </div>
                        </div>

                        {/* 编辑/预览区域 */}
                        <div className="p-4">

                {/* 全屏独立结果页 */}
                {showResultPage && documentContent && (
                    <div className="fixed inset-0 bg-white z-50 flex flex-col">
                        <div className="p-3 border-b flex items-center justify-between">
                            <div className="font-semibold text-gray-800 text-sm">
                                📄 {templates.find(t => t.id === selectedTemplate)?.name} - 结果预览
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowResultPage(false)} className="px-3 py-1.5 rounded-lg border text-sm">返回</button>
                                <button onClick={exportToPDF} className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm">
                                    <span>导出PDF</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="prose prose-sm max-w-4xl mx-auto">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {documentContent}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                            {viewMode === 'preview' ? (
                                /* 富文本预览模式（使用 ReactMarkdown + GFM，与咨询页保持一致） */
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: (p) => <a {...p} target="_blank" rel="noreferrer" className="text-blue-600 underline" />,
                                            ul: (p) => <ul {...p} className="list-disc list-inside space-y-1" />,
                                            ol: (p) => <ol {...p} className="list-decimal list-inside space-y-1" />,
                                            li: (p) => <li {...p} className="leading-relaxed" />,
                                            blockquote: (p) => <blockquote {...p} className="border-l-4 pl-3 text-gray-600" />,
                                            code: (p) => <code {...p} className="bg-gray-100 px-1 rounded" />,
                                            h1: (p) => <h1 {...p} className="text-lg font-semibold" />,
                                            h2: (p) => <h2 {...p} className="text-base font-semibold" />,
                                            h3: (p) => <h3 {...p} className="text-sm font-semibold" />
                                        }}
                                    >
                                        {documentContent}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                /* 编辑模式 */
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                        💡 提示：您可以直接编辑文书内容，系统会自动保存您的修改。
                                    </div>
                                    {/* 规范检查与一键补全 */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <button
                                            onClick={() => {
                                                const report = buildComplianceReport(documentContent, selectedTemplate, { includeEvidence: adv.includeEvidence, citeLaw: adv.citeLaw, caseType: documentInfo.case_type as any });
                                                setCompliance(report);
                                            }}
                                            className="px-2 py-1 rounded border hover:bg-gray-50"
                                        >
                                            规范检查
                                        </button>
                                        <button
                                            onClick={() => {
                                                const report = buildComplianceReport(documentContent, selectedTemplate, { includeEvidence: adv.includeEvidence, citeLaw: adv.citeLaw, caseType: documentInfo.case_type as any });
                                                const tname = templates.find(t => t.id === selectedTemplate)?.name || '法律文书';
                                                const fixed = autofillMissingSections(documentContent, report, tname);
                                                setDocumentContent(fixed);
                                                setCompliance(report);
                                            }}
                                            className="px-2 py-1 rounded border hover:bg-gray-50"
                                        >
                                            一键补全缺失章节
                                        </button>
                                    </div>
                                    {Array.isArray(compliance) && (
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {compliance.map((it) => (
                                                <div key={it.key} className={`text-xs p-2 rounded border ${it.pass ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                    <div className="font-medium">{it.label}：{it.pass ? '通过' : '建议完善'}</div>
                                                    {!it.pass && it.suggestion && <div className="mt-1 opacity-80">建议：{it.suggestion}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <textarea
                                        value={documentContent}
                                        onChange={(e) => setDocumentContent(e.target.value)}
                                        className="w-full h-80 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm leading-relaxed"
                                        placeholder="生成的文书内容将在这里显示..."
                                        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default DocumentGenerator;