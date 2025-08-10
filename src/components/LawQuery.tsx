import React, { useState } from 'react';

import { chatOnce } from '../lib/aiClient';

const LawQuery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<Array<{
    id: number;
    title: string;
    article: string;
    content: string;
    category: string;
    effectDate: string;
    tags: string[];
    relevance: number;
    practicalNote?: string;
    relatedArticles?: string[];
    caseApplication?: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: '全部法条', count: 10000 },
    { id: 'civil', name: '民法典', count: 1260 },
    { id: 'criminal', name: '刑法', count: 452 },
    { id: 'procedure', name: '诉讼法', count: 356 },
    { id: 'commercial', name: '商业法', count: 289 },
    { id: 'labor', name: '劳动法', count: 178 },
    { id: 'administrative', name: '行政法', count: 234 }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {


      // 简化的提示词，确保JSON格式正确
      const simplePrompt = `请根据关键词"${searchQuery}"检索相关法条，返回JSON数组格式。

要求：
1. 只返回JSON数组，不要其他文字
2. 返回5-8条最相关的法条
3. 每条法条包含完整信息

JSON格式示例：
[
  {
    "id": 1,
    "title": "中华人民共和国民法典",
    "article": "第五百七十七条",
    "content": "当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。",
    "category": "合同法",
    "effectDate": "2021-01-01",
    "tags": ["违约责任", "合同履行"],
    "relevance": 95,
    "practicalNote": "适用于各类合同违约情形，是违约责任的基础条文",
    "relatedArticles": ["第五百八十四条", "第五百八十五条"],
    "caseApplication": "合同纠纷案件中确定违约责任"
  }
]

请检索关键词"${searchQuery}"相关的法条：`;

      const content = await chatOnce([
        {
          role: 'system',
          content: '你是专业的法律条文检索助手。请严格按照JSON格式返回法条检索结果，不要包含任何其他文字。'
        },
        { role: 'user', content: simplePrompt }
      ], {
        temperature: 0.2,
        model: 'THUDM/GLM-4-9B-0414'
      });

      // 清理AI返回的内容，移除可能的非JSON文本
      let cleanContent = content.trim();

      // 尝试提取JSON数组
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 验证数据结构并按相关度排序
        const validResults = parsed.filter(item =>
          item &&
          typeof item === 'object' &&
          item.title &&
          item.content
        ).map((item, index) => ({
          ...item,
          id: item.id || index + 1,
          relevance: item.relevance || 80,
          tags: Array.isArray(item.tags) ? item.tags : [],
          relatedArticles: Array.isArray(item.relatedArticles) ? item.relatedArticles : []
        }));

        const sortedResults = validResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        setSearchResults(sortedResults);
      } else {
        // 如果AI返回为空，提供降级的模拟数据
        setSearchResults(getFallbackResults(searchQuery));
      }
    } catch (e) {
      console.error('法条检索失败:', e);

      // 降级到模拟数据
      const fallbackResults = getFallbackResults(searchQuery);
      setSearchResults(fallbackResults);

      // 友好的错误提示
      console.warn('使用模拟数据作为降级方案');
    } finally {
      setIsSearching(false);
    }
  };

  // 降级的模拟数据函数
  const getFallbackResults = (query: string) => {
    const fallbackData = [
      {
        id: 1,
        title: '中华人民共和国民法典',
        article: '第五百七十七条',
        content: '当事人一方不履行合同义务或者履行合同义务不符合约定的，应当承担继续履行、采取补救措施或者赔偿损失等违约责任。',
        category: '合同法',
        effectDate: '2021-01-01',
        tags: ['违约责任', '合同履行', '损害赔偿'],
        relevance: 95,
        practicalNote: '这是合同违约责任的基础条文，适用于各类合同违约情形。实务中需要结合具体违约行为确定责任承担方式。',
        relatedArticles: ['第五百八十四条', '第五百八十五条'],
        caseApplication: '合同纠纷案件中确定违约责任的基础依据'
      },
      {
        id: 2,
        title: '中华人民共和国民法典',
        article: '第五百八十四条',
        content: '当事人一方不履行合同义务或者履行合同义务不符合约定，造成对方损失的，损失赔偿额应当相当于因违约所造成的损失，包括合同履行后可以获得的利益；但是，不得超过违约一方订立合同时预见到或者应当预见到的因违约可能造成的损失。',
        category: '合同法',
        effectDate: '2021-01-01',
        tags: ['损失赔偿', '可得利益', '可预见性'],
        relevance: 92,
        practicalNote: '损失赔偿的计算标准，包括直接损失和可得利益损失，但受可预见性规则限制。',
        relatedArticles: ['第五百七十七条', '第五百八十五条'],
        caseApplication: '计算合同违约损失赔偿金额的重要依据'
      },
      {
        id: 3,
        title: '中华人民共和国民事诉讼法',
        article: '第一百八十八条',
        content: '向人民法院请求保护民事权利的诉讼时效期间为三年。法律另有规定的，依照其规定。',
        category: '诉讼程序',
        effectDate: '2021-01-01',
        tags: ['诉讼时效', '民事权利', '三年'],
        relevance: 88,
        practicalNote: '一般诉讼时效为三年，从知道或应当知道权利受到损害时起算。特殊情况有特别规定。',
        relatedArticles: ['第一百八十九条', '第一百九十条'],
        caseApplication: '各类民事纠纷中确定诉讼时效的基础条文'
      }
    ];

    // 根据查询关键词过滤相关结果
    return fallbackData.filter(item =>
      item.content.includes(query) ||
      item.tags.some(tag => tag.includes(query)) ||
      item.title.includes(query)
    ).slice(0, 3);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* 简洁化：移除页面大标题，减少视觉干扰 */}

      {/* 搜索栏 - 移动端优化 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative mb-3">
          {/* 纯文字风格：移除放大镜图标 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            placeholder="输入法律关键词，如：违约责任、损害赔偿、诉讼时效..."
          />
        </div>

        {/* 筛选器切换按钮 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <span>筛选条件</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${showFilters ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}>{showFilters ? '收起' : '展开'}</span>
          </button>
          <span className="text-xs text-gray-500">
            {selectedCategory !== 'all' && `已选择: ${categories.find(c => c.id === selectedCategory)?.name}`}
          </span>
        </div>

        {/* 可折叠的分类筛选 */}
        {showFilters && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">法条分类</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-2 rounded-lg text-left transition-colors ${selectedCategory === category.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">{category.name}</span>
                    <span className={`text-xs ${selectedCategory === category.id ? 'text-emerald-200' : 'text-gray-400'
                      }`}>
                      {category.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim() || isSearching}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:hover:shadow-lg"
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">搜索中...</span>
            </>
          ) : (
            <>
              <span className="text-sm">搜索法条</span>
            </>
          )}
        </button>
      </div>

      {/* 搜索结果 - 移动端优化 */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          {/* 结果统计 */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                找到 {searchResults.length} 条相关法条
              </span>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>按相关度排序</span>
              </div>
            </div>
          </div>

          {/* 法条列表 */}
          {searchResults.map((law) => (
            <div key={law.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {/* 法条头部 */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{law.title}</h4>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">{law.article}</span>
                  </div>
                  <button className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 ml-2">
                    <span>原文</span>
                  </button>
                </div>

                {/* 元信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                        <span>生效日期：{law.effectDate}</span>
                      </div>
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {law.relevance}%
                    </span>
                  </div>
                  <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-600">
                    <span>收藏</span>
                  </button>
                </div>
              </div>

              {/* 法条内容 */}
              <div className="p-4">
                {/* 条文内容 */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-gray-800 text-sm leading-relaxed">{law.content}</p>
                </div>

                {/* 实务要点 */}
                {law.practicalNote && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <h5 className="text-xs font-medium text-blue-800 mb-1 flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      实务要点
                    </h5>
                    <p className="text-blue-700 text-xs leading-relaxed">{law.practicalNote}</p>
                  </div>
                )}

                {/* 适用场景 */}
                {law.caseApplication && (
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <h5 className="text-xs font-medium text-green-800 mb-1 flex items-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      适用场景
                    </h5>
                    <p className="text-green-700 text-xs leading-relaxed">{law.caseApplication}</p>
                  </div>
                )}

                {/* 相关条文 */}
                {law.relatedArticles && law.relatedArticles.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-3">
                    <h5 className="text-xs font-medium text-purple-800 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                      相关条文
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {law.relatedArticles.map((article, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-purple-200 transition-colors"
                          onClick={() => setSearchQuery(article)}
                        >
                          {article}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 标签和分类 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">标签</span>
                    <div className="flex flex-wrap gap-1">
                      {law.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:bg-blue-200 transition-colors"
                          onClick={() => setSearchQuery(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                      {law.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{law.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {law.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 无结果状态 */}
      {searchResults.length === 0 && searchQuery && !isSearching && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 text-gray-300 mx-auto mb-3 rounded-full bg-gray-100"></div>
          <h3 className="text-base font-medium text-gray-800 mb-2">未找到相关法条</h3>
          <p className="text-sm text-gray-600 mb-4">请尝试使用其他关键词或调整搜索条件</p>
          <button
            onClick={() => setShowFilters(true)}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            调整筛选条件
          </button>
        </div>
      )}

      {/* 初始状态 */}
      {searchResults.length === 0 && !searchQuery && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-600 text-lg">Law</span>
          </div>
          <h3 className="text-base font-medium text-gray-800 mb-2">AI法条研究助手</h3>
          <p className="text-sm text-gray-600 mb-4">输入法律关键词，获得专业的条文检索和实务指导</p>

          {/* 功能特色 */}
          <div className="text-left mb-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1 text-blue-600">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                <span>智能匹配相关条文</span>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                <span>提供实务应用指导</span>
              </div>
              <div className="flex items-center space-x-1 text-purple-600">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                <span>关联条文智能推荐</span>
              </div>
              <div className="flex items-center space-x-1 text-orange-600">
                <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                <span>典型适用场景分析</span>
              </div>
            </div>
          </div>

          {/* 热门搜索建议 */}
          <div className="text-left">
            <h4 className="text-sm font-medium text-gray-700 mb-2">热门搜索：</h4>
            <div className="flex flex-wrap gap-2">
              {[
                '违约责任', '损害赔偿', '合同解除', '诉讼时效',
                '财产保全', '不当得利', '侵权责任', '劳动争议'
              ].map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(keyword)}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs hover:bg-emerald-200 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawQuery;