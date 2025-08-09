import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown, AlertTriangle, Shield, BarChart3, Clock, DollarSign, Scale, FileText, Brain, Award, AlertCircle, ChevronRight, Check } from 'lucide-react';
import { chatOnce } from '../lib/aiClient';

interface BaseAnalysisData {
  vulnerabilities: string[];
  recommendations: string[];
  timelineAnalysis: {
    criticalDates: string[];
    statuteOfLimitations: string;
    urgentActions: string[];
  };
  evidenceAnalysis: {
    strongEvidence: string[];
    weakEvidence: string[];
    missingEvidence: string[];
    evidenceScore: number;
  };
  financialAnalysis: {
    claimAmount: string;
    recoverabilityScore: string;
    costBenefit: string;
    alternativeResolution: string[];
  };
  legalPrecedents: {
    favorableCases: string[];
    unfavorableCases: string[];
    keyPrinciples: string[];
  };
  riskAssessment: {
    overallRisk: string;
    reputationalRisk: string;
    financialRisk: string;
    timeRisk: string;
  };
}

interface PlaintiffAnalysisData extends BaseAnalysisData {
  winningPoints: string[];
  successProbability: string;
  counterSuitRisk: string;
}

interface DefendantAnalysisData extends BaseAnalysisData {
  defensePoints: string[];
  counterSuitOpportunity: string;
  defenseStrength: string;
}

interface AnalysisResult {
  plaintiff: PlaintiffAnalysisData;
  defendant: DefendantAnalysisData;
}

const CaseAnalysis: React.FC = () => {
  const [caseDetails, setCaseDetails] = useState('');
  const [perspective, setPerspective] = useState<'plaintiff' | 'defendant'>('plaintiff');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [caseType, setCaseType] = useState('contract');
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const [showAllTypes, setShowAllTypes] = useState(false); // 是否展开全部案件类型

  const [showAllSuggestions, setShowAllSuggestions] = useState(false); // 是否展开全部建议提示


  const caseTypes = [
    { id: 'contract', name: '合同纠纷', icon: '📋', color: 'blue' },
    { id: 'tort', name: '侵权纠纷', icon: '⚖️', color: 'red' },
    { id: 'property', name: '财产纠纷', icon: '🏠', color: 'green' },
    { id: 'labor', name: '劳动纠纷', icon: '👥', color: 'purple' },
    { id: 'intellectual', name: '知识产权', icon: '💡', color: 'yellow' },
    { id: 'corporate', name: '公司纠纷', icon: '🏢', color: 'indigo' },
    // 增强：更多常见案件类型
    { id: 'marriage', name: '婚姻家庭', icon: '💍', color: 'pink' },
    { id: 'inherit', name: '继承纠纷', icon: '🧾', color: 'amber' },
    { id: 'lease', name: '房屋租赁', icon: '🏢', color: 'cyan' },
    { id: 'traffic', name: '交通事故', icon: '🚗', color: 'orange' },
    { id: 'loan', name: '民间借贷', icon: '💰', color: 'emerald' },
    { id: 'it', name: '网络信息', icon: '🖥️', color: 'slate' },
    { id: 'consumer', name: '消费者维权', icon: '🛒', color: 'teal' },
    { id: 'env', name: '环保纠纷', icon: '🌿', color: 'green' },
    { id: 'edu', name: '教育培训', icon: '🎓', color: 'indigo' },
    { id: 'medical', name: '医疗纠纷', icon: '🏥', color: 'rose' },
    { id: 'housing', name: '房产买卖', icon: '🏠', color: 'violet' }
  ];

  const analysisTypes = [
    {
      id: 'overview',
      name: perspective === 'plaintiff' ? '胜诉策略分析' : '辩护策略分析',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'evidence',
      name: '证据评估报告',
      icon: FileText,
      color: 'green'
    },
    {
      id: 'timeline',
      name: '时效与程序分析',
      icon: Clock,
      color: 'orange'
    },
    {
      id: 'financial',
      name: '成本效益分析',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      id: 'precedents',
      name: '判例法理研究',
      icon: Scale,
      color: 'purple'
    },
    {
      id: 'risks',
      name: '风险防控方案',
      icon: AlertTriangle,
      color: 'red'
    }
  ];
  // 根据案件类型提供“建议补充信息”chips（类型 → 建议补充信息清单）
  const suggestionMap: Record<string, string[]> = {
    traffic: ['事故认定书/简要经过', '就诊病历/票据', '保险保单/理赔沟通', '行车记录仪/监控截图', '修车评估/发票', '收入证明/误工情况', '伤残鉴定或计划', '现场照片/目击证言'],
    marriage: ['婚姻关系证明', '共同财产清单', '共同债务线索', '子女基本情况/抚养诉求', '家暴报警/病历/保护令', '房屋产证/按揭合同'],
    loan: ['转账流水', '借条/借据', '利息约定', '催收/沟通记录', '已还款凭证', '担保/保证资料'],
    labor: ['劳动关系证明（考勤/社保/工牌）', '工资条/加班记录', '解除/辞退材料', '工伤认定/劳动鉴定', '竞业限制协议'],
    contract: ['合同签订/履行证据', '发票/收据/交付凭证', '催告/违约通知', '损失计算明细', '变更/补充协议'],
    property: ['权属证明', '占有/使用情况', '交易/履约记录', '不当得利相关凭证'],
    corporate: ['股东信息/出资证明', '股权转让协议', '公司章程/决议', '对外担保资料'],
    intellectual: ['权属证明（专利/商标/著作权）', '侵权比对材料', '侵权收益线索', '公证/取证材料'],
    lease: ['租赁合同', '押金收据', '交接清单', '维修/停用记录', '解约通知/沟通记录'],
    housing: ['网签/预售/备案资料', '按揭/解押材料', '交房/办证记录', '面积误差/质量问题证据'],
    medical: ['就诊病历/检查报告', '医疗费用票据', '医疗机构沟通记录', '鉴定意见或计划'],
    consumer: ['发票/订单/聊天记录', '宣传材料/页面截图', '退换货沟通记录', '损失明细'],
    it: ['账号/数据证据', '隐私泄露/侵权证据', '平台沟通与处理记录'],
    env: ['监测数据/鉴定', '行政处理文书', '污染源线索', '修复/赔偿依据'],
    edu: ['培训合同/收据', '退费沟通记录', '宣传对比材料', '未成年保护相关材料'],
    tort: ['侵权事实经过', '损害评估', '证据链条清单'],
    default: ['当事人基本信息', '争议焦点概述', '已掌握的关键证据', '期望目标与底线']
  };



  // 按案件类型动态强化提示要点（不改变返回JSON结构，仅引导模型聚焦）
  const getTypeFocus = (id: string) => {
    switch (id) {
      case 'traffic':
        return `
【类型侧重点—交通事故】
- 责任划分：交警事故认定书/监控行车记录/目击证言
- 赔偿项目：医疗费、护理费、误工费、交通费、营养费、残疾赔偿金、精神损害抚慰金等
- 保险理赔：交强险、商业三者险、代位求偿、免赔率
- 程序与时效：调解/诉讼选择，鉴定节点与诉讼时效
- 证据要点：病历票据、修车/评估、收入证明、伤残鉴定`;
      case 'marriage':
        return `
【类型侧重点—婚姻家庭】
- 财产分割：共同财产范围、共同债务认定、隐匿转移财产线索
- 子女抚养：抚养权归属、探望权安排、抚养费计算与支付方式
- 住房与居住权：婚前/婚后产、按揭贷款、使用权安排
- 家暴与证据：人身安全保护令、报警/病历/邻里证言
- 程序选择：诉前调解与取证难点、举证责任`;
      case 'loan':
        return `
【类型侧重点—民间借贷】
- 借贷真实性：转账流水、借据/借条、聊天记录
- 利率合法性：司法保护上限、复利与罚息约定
- 清偿抗辩：已还款证据、以物抵债、债务抵销
- 共同债务：配偶/合伙连带、保证担保效力
- 时效与管辖：起算点、分期/部分清偿中断、中止`;
      case 'labor':
        return `
【类型侧重点—劳动纠纷】
- 劳动关系证明：考勤、社保、工牌、同事证言
- 工资待遇：加班工资、未签合同双倍工资、经济补偿金/赔偿金
- 工伤与鉴定：工伤认定、劳动能力鉴定、三期保护
- 仲裁前置：时效、举证、调解安排
- 竞业限制与保密：有效性与赔偿`;
      case 'property':
        return `
【类型侧重点—财产纠纷】
- 物权/债权边界：所有权、用益物权、担保物权
- 占有返还/不当得利：利益转移与法律依据
- 执行与保全：诉前/诉中保全、执行异议
- 证据清单：权属证明、交易凭证、履约记录`;
      case 'contract':
        return `
【类型侧重点—合同纠纷】
- 合同效力：主体/意思表示/条款效力/格式条款
- 违约责任：继续履行、解除、损害赔偿、违约金调整
- 举证重点：签订/履行/通知催告/损失证据
- 算赔口径：直接损失/可得利益/可预见规则`;
      case 'intellectual':
        return `
【类型侧重点—知识产权】
- 权利基础：专利/商标/著作权/反不正当竞争
- 侵权判断：比对方法、近似混淆、合理使用抗辩
- 损害计算：法定赔偿/利润推定/惩罚性赔偿
- 证据保全：公证取证、源代码/样品留存`;
      case 'corporate':
        return `
【类型侧重点—公司纠纷】
- 股权/出资：瑕疵出资、股权转让/回购
- 决议效力：程序与实体缺陷、代表人之争
- 董监高责任：忠实/勤勉义务与侵权连带
- 清算与担保：对外担保效力、清算责任`;
      case 'lease':
        return `
【类型侧重点—房屋租赁】
- 合同效力与备案、转租与解除
- 押金与租金：违约金调整、损失计算
- 租赁物瑕疵：维修/停用责任
- 证据：交接清单、维修票据、沟通记录`;
      case 'housing':
        return `
【类型侧重点—房产买卖】
- 网签/预售与备案、按揭与解押
- 逾期交房/办证责任与违约金
- 面积误差/质量瑕疵处理
- 税费承担与违约条款效力`;
      case 'medical':
        return `
【类型侧重点—医疗纠纷】
- 过错与因果：病历、诊疗规范、鉴定意见
- 损害项目：医疗费、误工费、残疾赔偿、精神损害
- 医疗机构责任分配与举证
- 调解/诉讼路径与鉴定时点`;
      case 'consumer':
        return `
【类型侧重点—消费者维权】
- 质量/虚假宣传/格式条款
- 三包规定、价款退一赔三/退一赔十（视品类）
- 平台与商家连带、证据留存
- 主管部门投诉与诉讼`;
      case 'it':
        return `
【类型侧重点—网络信息】
- 账号/数据/隐私侵权
- 平台责任豁免与注意义务
- 证据保全：取证时间戳、公证/链上存证
- 管辖与跨域取证`;
      case 'env':
        return `
【类型侧重点—环保纠纷】
- 污染因果关系与鉴定
- 行政/民事/公益诉讼路径
- 环评/监测/排污证据链
- 生态修复与损害赔偿`;
      case 'edu':
        return `
【类型侧重点—教育培训】
- 合同退费/不公平条款
- 师资虚假宣传证据
- 未成年人保护与监护责任
- 监管投诉与群体性维权`;
      case 'tort':
      default:
        return `
【类型侧重点—侵权/通用】
- 构成要件：过错、损害、因果
- 责任方式：停止侵害、赔偿损失、消除影响
- 证据：损害评估、证明链完整性`;
    }
  };




  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleAnalysis = async () => {
    if (!caseDetails.trim()) return;

    setIsAnalyzing(true);

    try {
      // 构建专业的律师角色提示词
      const lawyerRole = perspective === 'plaintiff'
        ? '你是一名经验丰富的原告方代理律师，专门为当事人争取最大利益。你需要站在原告的立场，深入分析案件的每一个细节，找出所有有利因素，同时识别潜在风险并提供切实可行的应对策略。'
        : '你是一名资深的辩护律师，专门为被告提供最强有力的法律辩护。你需要站在被告的立场，全面分析案件，找出所有可能的抗辩理由和减轻责任的途径，制定最佳的辩护策略。';

      const detailedPrompt = `
【律师角色】
${lawyerRole}

【案件基本信息】
- 案件类型：${caseTypes.find(t => t.id === caseType)?.name || caseType}
- 分析视角：${perspective === 'plaintiff' ? '原告方（起诉方）' : '被告方（应诉方）'}
- 紧急程度：需要专业律师的深度分析

【类型侧重点（根据案件类型自动加强）】
${getTypeFocus(caseType)}

【案件详情】
${caseDetails}

【分析要求】
请作为专业律师，从以下维度进行深入分析：

1. **核心优势分析**：找出所有对当事人有利的法律事实、证据和法理依据
2. **风险漏洞识别**：识别案件中的薄弱环节和潜在风险点
3. **实战建议制定**：提供具体可操作的法律策略和行动方案
4. **证据评估**：分析现有证据的强弱，指出需要补强的证据
5. **时间节点把控**：识别关键时间节点和紧急行动事项
6. **财务成本分析**：评估诉讼成本和预期收益
7. **判例法理支撑**：寻找有利的法律条文和相关判例
8. **风险防控策略**：制定全面的风险应对预案

请严格按照以下JSON格式返回分析结果（不要包含任何其他文本）：`;

      const jsonStructure = {
        plaintiff: {
          winningPoints: [
            "详细分析第一个胜诉优势点，包括法理依据和事实支撑",
            "详细分析第二个胜诉优势点，说明如何在法庭上有效运用",
            "详细分析第三个胜诉优势点，提供具体的论证策略"
          ],
          vulnerabilities: [
            "识别第一个风险点，并提供具体的应对措施",
            "识别第二个风险点，说明如何规避或减轻影响"
          ],
          recommendations: [
            "第一条实战建议：具体的行动方案和执行步骤",
            "第二条实战建议：包含时间安排和责任分工",
            "第三条实战建议：提供备选方案和应急预案"
          ],
          timelineAnalysis: {
            criticalDates: ["关键时间节点1：具体日期和重要性说明", "关键时间节点2：法律后果分析"],
            statuteOfLimitations: "诉讼时效详细分析，包括起算时间和剩余期限",
            urgentActions: ["紧急行动1：具体措施和完成时限", "紧急行动2：责任人和执行要求"]
          },
          evidenceAnalysis: {
            strongEvidence: ["强势证据1：证明力分析和使用策略", "强势证据2：在法庭上的展示方法"],
            weakEvidence: ["薄弱证据1：存在的问题和补强方案", "薄弱证据2：风险评估和应对策略"],
            missingEvidence: ["缺失证据1：获取途径和替代方案", "缺失证据2：对案件的影响评估"],
            evidenceScore: 85
          },
          financialAnalysis: {
            claimAmount: "详细的赔偿金额计算和法律依据",
            recoverabilityScore: "回收可能性评估（百分比）和影响因素分析",
            costBenefit: "诉讼成本效益分析，包括律师费、诉讼费等",
            alternativeResolution: ["和解方案1：具体条件和优劣分析", "仲裁方案：程序和预期结果"]
          },
          legalPrecedents: {
            favorableCases: ["有利判例1：案例要点和适用性分析", "有利判例2：裁判理由和借鉴价值"],
            unfavorableCases: ["不利判例1：败诉原因分析和规避策略", "不��判例2：风险提示和应对方案"],
            keyPrinciples: ["核心法理1：适用条件和论证要点", "核心法理2：在本案中的具体运用"]
          },
          riskAssessment: {
            overallRisk: "整体风险等级和主要风险因素",
            reputationalRisk: "声誉风险评估和保护措施",
            financialRisk: "财务风险分析和控制方案",
            timeRisk: "时间风险评估和进度管控"
          },
          counterSuitRisk: "对方反诉的可能性和应对准备",
          successProbability: "胜诉概率评估（百分比）"
        },
        defendant: {
          defensePoints: [
            "第一个抗辩要点：法理依据和事实支撑",
            "第二个抗辩要点：具体的辩护策略和论证方法",
            "第三个抗辩要点：减轻责任的法律途径"
          ],
          vulnerabilities: [
            "辩护中的薄弱环节和应对策略",
            "可能面临的不利因素和化解方案"
          ],
          recommendations: [
            "核心辩护建议：具体的法律策略和实施方案",
            "证据收集建议：需要补强的证据和获取途径",
            "程序性建议：利用程序规则的策略安排"
          ],
          timelineAnalysis: {
            criticalDates: ["关键时间节点和应对措施"],
            statuteOfLimitations: "时效抗辩的可能性和运用策略",
            urgentActions: ["紧急辩护行动和完成时限"]
          },
          evidenceAnalysis: {
            strongEvidence: ["有利证据的收集和使用策略"],
            weakEvidence: ["不利证据的质疑和反驳方案"],
            missingEvidence: ["需要收集的关键证据"],
            evidenceScore: 70
          },
          financialAnalysis: {
            claimAmount: "争议金额分析和减损策略",
            recoverabilityScore: "败诉后的财务影响评估",
            costBenefit: "辩护成本和预期效果分析",
            alternativeResolution: ["和解谈判策略", "替代解决方案"]
          },
          legalPrecedents: {
            favorableCases: ["支持辩护观点的判例"],
            unfavorableCases: ["不利判例的区别和应对"],
            keyPrinciples: ["辩护的核心法理依据"]
          },
          riskAssessment: {
            overallRisk: "败诉风险和影响评估",
            reputationalRisk: "声誉损害的控制措施",
            financialRisk: "财务损失的预估和准备",
            timeRisk: "诉讼拖延的利弊分析"
          },
          counterSuitOpportunity: "反诉的可行性和策略分析",
          defenseStrength: "整体辩护实力评估"
        }
      };

      const systemPrompt = `${lawyerRole}

请严格按照以下JSON格式返回专业的法律分析（只返回JSON，不要任何其他文本）：

${JSON.stringify(jsonStructure, null, 2)}`;

      const content = await chatOnce([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: detailedPrompt }
      ], {
        temperature: 0.2, // 降低随机性，确保专业性
        model: 'THUDM/GLM-4-9B-0414'
      });

      const parsed: AnalysisResult = JSON.parse(content);
      setAnalysis(parsed);
    } catch (e) {
      console.error(e);
      alert('AI 分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentAnalysis = analysis?.[perspective];

  return (
    <div className="space-y-4 sm:space-y-5 px-1">
      {/* 简洁化：移除页面头部大标题，专注核心功能 */}

      {/* 案件类型与视角选择合并 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {/* 案件类型 */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            案件类型
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(showAllTypes ? caseTypes : caseTypes.slice(0, 6)).map((type) => (
              <button
                key={type.id}
                onClick={() => setCaseType(type.id)}
                className={`group p-2.5 rounded-xl border transition-all duration-200 ${caseType === type.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.03]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="text-base mb-1 group-hover:scale-110 transition-transform">{type.icon}</div>
                <div className="text-xs font-medium text-gray-700 leading-tight">{type.name}</div>
              </button>
            ))}
          </div>

            {/* 展开更多类型按钮 */}
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAllTypes(v => !v)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllTypes ? '收起类型' : '展开更多类型'}
              </button>
            </div>

        </div>

        {/* 分析视角 */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            分析视角
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPerspective('plaintiff')}
              className={`p-3 rounded-xl border transition-all duration-200 ${perspective === 'plaintiff'
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <TrendingUp className={`w-5 h-5 mx-auto mb-1.5 ${perspective === 'plaintiff' ? 'text-green-600' : 'text-gray-500'
                }`} />
              <div className={`text-sm font-medium ${perspective === 'plaintiff' ? 'text-green-700' : 'text-gray-600'
                }`}>原告方</div>
            </button>
            <button
              onClick={() => setPerspective('defendant')}
              className={`p-3 rounded-xl border transition-all duration-200 ${perspective === 'defendant'
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <Shield className={`w-5 h-5 mx-auto mb-1.5 ${perspective === 'defendant' ? 'text-blue-600' : 'text-gray-500'
                }`} />
              <div className={`text-sm font-medium ${perspective === 'defendant' ? 'text-blue-700' : 'text-gray-600'
                }`}>被告方</div>
            </button>
          </div>
        </div>
      </div>

      {/* 案件详情输入 - 优化设计 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
          案件详情
        </h3>
        <div className="relative">
          <textarea
            value={caseDetails}
            onChange={(e) => setCaseDetails(e.target.value)}
            placeholder={`请详细描述案件情况，以便律师AI为您提供专业分析：

📋 基本事实：发生了什么事情？涉及哪些当事人？
⏰ 时间线：关键事件的发生时间和顺序
📄 证据材料：您掌握了哪些证据？对方可能有什么证据？
💰 争议焦点：主要争议是什么？涉及多少金额？
🎯 您的诉求：希望达到什么目标？

信息越详细，律师AI的分析越精准！`}
            className="w-full h-28 p-4 border border-gray-200 rounded-xl resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {caseDetails.length}/1000
          </div>
        </div>
        <button
          onClick={handleAnalysis}
          disabled={!caseDetails.trim() || isAnalyzing}
          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:hover:shadow-lg"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">AI分析中...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              <span className="text-sm">开始AI分析</span>
            </>
          )}
        </button>
      </div>

      {/* 分析结果 - 优化的卡片式布局 */}
      {currentAnalysis && (
        <div className="space-y-3">
          {/* 专业律师分析报告 */}
          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm">
                  {perspective === 'plaintiff' ? '原告方律师分析报告' : '辩护律师分析报告'}
                </h3>
              </div>
              <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs">专业律师AI</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold mb-1">
                  {perspective === 'plaintiff'
                    ? (currentAnalysis as PlaintiffAnalysisData).successProbability
                    : (currentAnalysis as DefendantAnalysisData).defenseStrength}
                </div>
                <div className="text-xs text-white/80">
                  {perspective === 'plaintiff' ? '胜诉概率' : '抗辩强度'}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold mb-1">
                  {currentAnalysis.evidenceAnalysis.evidenceScore}/100
                </div>
                <div className="text-xs text-white/80">证据强度</div>
              </div>
            </div>
          </div>

          {/* 分析模块 - 现代化卡片设计 */}
          {analysisTypes.map((type) => (
            <div key={type.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleSection(type.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color === 'blue' ? 'bg-blue-100' :
                      type.color === 'green' ? 'bg-green-100' :
                        type.color === 'orange' ? 'bg-orange-100' :
                          type.color === 'emerald' ? 'bg-emerald-100' :
                            type.color === 'purple' ? 'bg-purple-100' :
                              'bg-red-100'
                    }`}>
                    <type.icon className={`w-5 h-5 ${type.color === 'blue' ? 'text-blue-600' :
                        type.color === 'green' ? 'text-green-600' :
                          type.color === 'orange' ? 'text-orange-600' :
                            type.color === 'emerald' ? 'text-emerald-600' :
                              type.color === 'purple' ? 'text-purple-600' :
                                'text-red-600'
                      }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-800 text-sm">{type.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {type.id === 'overview' ? '核心要点分析' :
                        type.id === 'evidence' ? '证据材料评估' :
                          type.id === 'timeline' ? '时效与进度' :
                            type.id === 'financial' ? '经济损益分析' :
                              type.id === 'precedents' ? '相关判例研究' :
                                '风险因素评估'}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedSections.includes(type.id) ? 'rotate-90' : ''}`}
                />
              </button>

              {expandedSections.includes(type.id) && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  <div className="p-4">
                    {renderMobileAnalysisContent(type.id, currentAnalysis)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function renderMobileAnalysisContent(tabId: string, analysisData: PlaintiffAnalysisData | DefendantAnalysisData) {
    switch (tabId) {
      case 'overview':
        return (
          <div className="space-y-4">
            {/* 优势点/抗辩点 */}
          {/* 建议补充信息 chips（类型驱动） */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">建议补充信息（可点击快速追加到上方描述）</span>
              <button
                type="button"
                onClick={() => setShowAllSuggestions(v => !v)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllSuggestions ? '收起' : '展开更多'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(showAllSuggestions ? (suggestionMap[caseType] || suggestionMap.default) : (suggestionMap[caseType] || suggestionMap.default).slice(0, 6)).map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const lines = new Set(caseDetails.split('\n').map(l => l.trim()).filter(Boolean));
                    if (!lines.has(sug)) lines.add(sug);
                    setCaseDetails(Array.from(lines).join('\n'));
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                {perspective === 'plaintiff' ? '胜诉优势点' : '抗辩要点'}
              </h4>
              <div className="space-y-2">
                {(perspective === 'plaintiff'
                  ? (analysisData as PlaintiffAnalysisData).winningPoints
                  : (analysisData as DefendantAnalysisData).defensePoints
                ).slice(0, 3).map((point: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-green-800 text-sm leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 风险点 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                风险漏洞
              </h4>
              <div className="space-y-2">
                {analysisData.vulnerabilities.slice(0, 2).map((vulnerability: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                    <p className="text-amber-800 text-sm leading-relaxed">{vulnerability}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 核心建议 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                AI核心建议
              </h4>
              <div className="space-y-2">
                {analysisData.recommendations.slice(0, 3).map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-blue-800 text-sm leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'evidence':
        return (
          <div className="space-y-4">
            {/* 证据强度评分 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">证据强度评分</span>
                <span className="text-xl font-bold text-blue-600">{analysisData.evidenceAnalysis.evidenceScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${analysisData.evidenceAnalysis.evidenceScore}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {analysisData.evidenceAnalysis.evidenceScore >= 80 ? '证据充分' :
                  analysisData.evidenceAnalysis.evidenceScore >= 60 ? '证据较好' :
                    analysisData.evidenceAnalysis.evidenceScore >= 40 ? '证据一般' : '证据不足'}
              </div>
            </div>

            {/* 强势证据 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                强势证据
              </h4>
              <div className="space-y-2">
                {analysisData.evidenceAnalysis.strongEvidence.map((evidence: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-green-800 text-sm leading-relaxed">{evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 薄弱证据 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                薄弱证据
              </h4>
              <div className="space-y-2">
                {analysisData.evidenceAnalysis.weakEvidence.map((evidence: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-amber-800 text-sm leading-relaxed">{evidence}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 缺失证据 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                缺失证据
              </h4>
              <div className="space-y-2">
                {analysisData.evidenceAnalysis.missingEvidence.map((evidence: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-red-800 text-sm leading-relaxed">{evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-4">
            {/* 关键时间节点 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                关键时间节点
              </h4>
              <div className="space-y-3">
                {analysisData.timelineAnalysis.criticalDates.map((date: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-blue-800 text-sm font-medium">{date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 诉讼时效 */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-medium text-green-800 text-sm">诉讼时效分析</h4>
              </div>
              <p className="text-green-700 text-sm leading-relaxed">{analysisData.timelineAnalysis.statuteOfLimitations}</p>
            </div>

            {/* 紧急行动 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                紧急行动清单
              </h4>
              <div className="space-y-2">
                {analysisData.timelineAnalysis.urgentActions.map((action: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      !
                    </div>
                    <p className="text-red-800 text-sm leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-4">
            {/* 争议金额 */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-medium text-gray-800 text-sm">争议金额</h4>
              </div>
              <p className="text-gray-700 text-sm font-medium">{analysisData.financialAnalysis.claimAmount}</p>
            </div>

            {/* 回收可能性 */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-medium text-blue-800 text-sm">回收可能性</h4>
              </div>
              <p className="text-blue-700 text-sm">{analysisData.financialAnalysis.recoverabilityScore}</p>
            </div>

            {/* 成本效益 */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-medium text-green-800 text-sm">成本效益分析</h4>
              </div>
              <p className="text-green-700 text-sm">{analysisData.financialAnalysis.costBenefit}</p>
            </div>

            {/* 替代方案 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                替代解决方案
              </h4>
              <div className="space-y-2">
                {analysisData.financialAnalysis.alternativeResolution.map((solution: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-purple-800 text-sm leading-relaxed">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'precedents':
        return (
          <div className="space-y-4">
            {/* 有利判例 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                有利判例
              </h4>
              <div className="space-y-2">
                {analysisData.legalPrecedents.favorableCases.map((case_: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-green-800 text-sm leading-relaxed">{case_}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 不利判例 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                不利判例
              </h4>
              <div className="space-y-2">
                {analysisData.legalPrecedents.unfavorableCases.map((case_: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingDown className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-red-800 text-sm leading-relaxed">{case_}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 核心法理 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                核心法理原则
              </h4>
              <div className="space-y-2">
                {analysisData.legalPrecedents.keyPrinciples.map((principle: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Scale className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-blue-800 text-sm font-medium leading-relaxed">{principle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-4">
            {/* 风险评估矩阵 */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800 text-sm flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                风险评估矩阵
              </h4>

              {[
                { label: '整体风险', value: analysisData.riskAssessment.overallRisk, icon: AlertTriangle },
                { label: '声誉风险', value: analysisData.riskAssessment.reputationalRisk, icon: Users },
                { label: '财务风险', value: analysisData.riskAssessment.financialRisk, icon: DollarSign },
                { label: '时间风险', value: analysisData.riskAssessment.timeRisk, icon: Clock }
              ].map((risk, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                      <risk.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">{risk.label}</span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${risk.value.includes('低') ? 'bg-green-100 text-green-800' :
                      risk.value.includes('中') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {risk.value.split(' - ')[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* 风险缓解策略 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3 text-sm flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                风险缓解策略
              </h4>
              <div className="space-y-3">
                {[
                  { title: '证据风险缓解', desc: '加强证据收集，委托专业机构鉴定', color: 'blue', icon: FileText },
                  { title: '财务风险控制', desc: '申请财产保全，评估执行可能性', color: 'green', icon: Shield },
                  { title: '时间风险管理', desc: '制定详细时间表，避免程序延误', color: 'purple', icon: Clock },
                  { title: '声誉风险防护', desc: '准备公关预案，控制负面影响', color: 'orange', icon: Users }
                ].map((strategy, index) => (
                  <div key={index} className={`flex items-start space-x-3 p-4 rounded-xl border ${strategy.color === 'blue' ? 'bg-blue-50 border-blue-100' :
                      strategy.color === 'green' ? 'bg-green-50 border-green-100' :
                        strategy.color === 'purple' ? 'bg-purple-50 border-purple-100' :
                          'bg-orange-50 border-orange-100'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${strategy.color === 'blue' ? 'bg-blue-500' :
                        strategy.color === 'green' ? 'bg-green-500' :
                          strategy.color === 'purple' ? 'bg-purple-500' :
                            'bg-orange-500'
                      }`}>
                      <strategy.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className={`font-medium mb-1 text-sm ${strategy.color === 'blue' ? 'text-blue-800' :
                          strategy.color === 'green' ? 'text-green-800' :
                            strategy.color === 'purple' ? 'text-purple-800' :
                              'text-orange-800'
                        }`}>{strategy.title}</h5>
                      <p className={`text-sm leading-relaxed ${strategy.color === 'blue' ? 'text-blue-700' :
                          strategy.color === 'green' ? 'text-green-700' :
                            strategy.color === 'purple' ? 'text-purple-700' :
                              'text-orange-700'
                        }`}>{strategy.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
};

export default CaseAnalysis;