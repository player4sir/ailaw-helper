// 文书规范校验模块（启发式）
// 参考最新趋势（示范文本要素化/表格化）与通行格式要点；不作法律结论判断

export function getCaseTypeGuidance(caseType?: string): string[] {
  switch (caseType) {
    case 'loan':
      return [
        '提供借款合同/借据/转账凭证等证明借贷关系的材料',
        '明确本金、利息、起止时间与利息计算方法',
        '说明催收经过与对方违约事实'];
    case 'labor':
      return [
        '提供劳动合同、社保缴纳、工资条、考勤记录等',
        '明确争议事项（欠薪/赔偿/工伤等）与金额依据',
        '引用相关法律（劳动法/劳动合同法）条款支持'];
    case 'finance':
      return [
        '附金融合同/授信/担保要素与违约事实说明',
        '披露催收/通知流程与关键风险提示',
        '如涉及保证保险，区分主债务与保险责任要素'];
    case 'insurance':
      return [
        '提供保单信息、保险合同条款与保险金请求项目',
        '描述出险事实、报案、理赔/拒赔理由与证据',
        '对争议条款（免责/比例赔付等）给出依据'];
    default:
      return [];
  }
}


export type ComplianceItem = {
  key: string;
  label: string;
  pass: boolean;
  suggestion?: string;
};

export type ComplianceOptions = {
  includeEvidence: boolean;
  citeLaw: boolean;
  caseType?: 'loan' | 'labor' | 'finance' | 'insurance' | '';
};

// 针对不同模板（起诉状/答辩状/上诉状/反诉状/协议书/证据清单）设置基本要素
// 后续可扩展到更细的案件类型（借贷/劳动/金融等）
export function buildComplianceReport(
  content: string,
  templateId: string,
  options: ComplianceOptions
): ComplianceItem[] {
  const text = (content || '').replace(/\s+/g, '');
  const items: ComplianceItem[] = [];
  const push = (
    key: string,
    label: string,
    pass: boolean,
    suggestion?: string
  ) => items.push({ key, label, pass, suggestion });

  // 标题
  const titleOk = /起诉状|答辩状|上诉状|反诉状|调解协议书|证据清单/.test(text);
  push('title', '标题规范（如：民事起诉状/答辩状）', titleOk, '建议在首行设置明确标题，如“民事起诉状”。');

  // 当事人信息
  const partyOk = /(原告|被告|上诉人|被上诉人|申请人|被申请人|甲方|乙方)[：:]/.test(text);
  push('party', '当事人信息（原告/被告等）', partyOk, '建议列明姓名/性别/住址/联系方式等信息。');

  // 法院称谓
  const courtOk = /人民法院/.test(text);
  push('court', '法院称谓（如：××人民法院）', courtOk, '建议在“此致”后单独一行写明受理法院全称。');

  // 诉讼请求
  const claimOk = /(诉讼请求|请求事项)/.test(text);
  push('claims', '诉讼请求（具体明确，可执行）', claimOk, '建议逐条列出，金额要有计算依据，并包含诉讼费承担。');

  // 事实与理由
  const factOk = /(事实和理由|事实与理由)/.test(text);
  push('facts', '事实与理由（时间线、争议焦点、证据支撑）', factOk, '建议按时间顺序叙述，并突出争议焦点与关键证据。');

  // 法律依据（若启用“引用法条”则强校验，否则弱提示）
  const lawOk = /(法律依据|《[^》]+》[^，。；]*条)/.test(text);
  push('law', '法律依据（具体法条/司法解释）', options.citeLaw ? lawOk : true, '建议引用具体条文与司法解释。');

  // 证据清单（若启用则强校验）
  const evidenceOk = /(证据清单|证据材料清单|证据目录)/.test(text);
  push('evidence', '证据清单（编号/名称/证明目的）', options.includeEvidence ? evidenceOk : true, '建议附“证据清单”，逐项写明证明目的。');

  // 落款与日期
  const signOk = /(起诉人|答辩人|上诉人|申请人|代理人)[：:]/.test(text);
  const dateOk = /(\d{4}年\d{1,2}月\d{1,2}日|日期[：:])/.test(text);
  push('signature', '落款（主体签名）', signOk, '建议在末尾处签名/盖章。');
  push('date', '日期', dateOk, '建议以“YYYY年MM月DD日”格式标注日期。');

  // 专项检查（按案件类型）
  switch (options.caseType) {
    case 'loan':
      items.push({ key: 'loan_contract', label: '借贷关系证明（合同/转账凭证）', pass: /借款|转账|借据|合同/.test(text), suggestion: '建议提供借款合同、转账记录、借据/收据等证明材料。' });
      items.push({ key: 'interest_calc', label: '本金与利息计算依据', pass: /本金|利息|计算|年利率/.test(text), suggestion: '建议列明本金金额、约定利率、起止时间与计算方式。' });
      break;
    case 'labor':
      items.push({ key: 'labor_relation', label: '劳动关系证明（合同/社保/考勤）', pass: /劳动合同|社保|公积金|考勤|薪资/.test(text), suggestion: '建议提供劳动合同、社保缴纳、工资条、考勤记录等。' });
      items.push({ key: 'dispute_item', label: '争议事项（欠薪/赔偿/工伤）', pass: /欠薪|赔偿|工伤|解除|经济补偿/.test(text), suggestion: '建议明确争议事项及金额、法律依据（劳动法/劳动合同法）。' });
      break;
    case 'finance':
      items.push({ key: 'finance_product', label: '金融产品要素与合同', pass: /贷款|信用卡|保证保险|担保|抵押|质押/.test(text), suggestion: '建议附合同、授信/担保要素与违约事实说明。' });
      items.push({ key: 'reg_compliance', label: '监管合规要点', pass: /催收|通知|风险提示|资质|授权/.test(text), suggestion: '建议说明催收/通知流程与合规性，披露关键风险提示。' });
      break;
    case 'insurance':
      items.push({ key: 'policy', label: '保险合同与保单信息', pass: /保单|保险合同|保险金|条款/.test(text), suggestion: '建议提供保单号、保险条款、保险金请求项目与依据。' });
      items.push({ key: 'claim_fact', label: '出险事实与理赔流程', pass: /出险|报案|理赔|拒赔|鉴定/.test(text), suggestion: '建议描述出险时间、报案、理赔/拒赔理由与证据。' });
      break;
    default:
      break;
  }


  return items;
}

export function autofillMissingSections(
  content: string,
  report: ComplianceItem[],
  templateName: string
): string {
  let out = content || '';
  const need = (key: string) => report.find((i) => i.key === key)?.pass === false;
  const blocks: string[] = [];

  if (need('title') && !/^.{0,50}(起诉状|答辩状|上诉状|反诉状|调解协议书|证据清单)/m.test(out)) {
    blocks.push(`${templateName}`);
  }
  if (need('claims')) {
    blocks.push(`\n诉讼请求：\n1、请在此逐条列明具体请求事项及金额计算依据；\n2、诉讼费用承担等。`);

  }
  if (need('facts')) {
    blocks.push(`\n事实和理由：\n请按时间顺序叙述关键事实，突出争议焦点，并注明对应证据。`);
  }
  if (need('law')) {
    blocks.push(`\n法律依据：\n请引用相关法条及司法解释（示例：依据《民法典》第××条……）。`);
  }
  if (need('evidence')) {
    blocks.push(`\n证据材料清单：\n证据1：名称——证明目的；\n证据2：名称——证明目的。`);
  }
  if (need('court')) {
    blocks.push(`\n此致\n××市××区人民法院`);
  }
  if (need('signature')) {
    blocks.push(`\n起诉人：\n`);
  }
  if (need('date')) {
    blocks.push(`日期：${new Date().toLocaleDateString('zh-CN')}`);
  }
  if (blocks.length) {
    out = out.trimEnd() + '\n\n' + blocks.join('\n\n');
  }
  return out;
}

