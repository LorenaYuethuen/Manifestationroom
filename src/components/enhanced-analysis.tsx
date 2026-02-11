import { useState } from 'react';
import type { VisionAnalysis } from '../App';

// ==========================================
// AI 视觉分析引擎 - 支持 Claude & Gemini
// ==========================================

interface ClaudeVisionResponse {
  visualDNA: {
    colorPalette: string[];
    materials: string[];
    lighting: string;
    spatialFeeling: string;
    emotionalCore: string[];
    archetype: string;
  };
  lifestyleInference: {
    pace: string;
    values: string[];
    dailyRituals: string[];
  };
  sensoryTriggers: {
    smell: string;
    sound: string;
    touch: string;
  };
  sopMapping: {
    module: string; // WRITE_PLAN, PLAN, DO, CHECK
    subSystem: string; // 对应具体的数据库名称
    visualCue: string;
    actions: string[];
  }[];
}

// ==========================================
// API Implementations
// ==========================================

async function analyzeVisionWithClaude(imageFile: File, apiKey: string): Promise<ClaudeVisionResponse> {
  const base64Image = await fileToBase64(imageFile);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-requests': 'true', 
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      system: "你是一个协助用户进行'生活显化'的AI架构师。用户有一套完整的 LIFE COMPASS 系统，你的任务是将愿景板(Mood Board)中的元素，严格按照用户的 SOP 框架拆解并分发到具体的 DATABASE 中。",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageFile.type,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: VISION_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return parseAIResponse(data.content[0].text);
}

async function analyzeVisionWithGemini(imageFile: File, apiKey: string): Promise<ClaudeVisionResponse> {
  const base64Image = await fileToBase64(imageFile);
  // Optimized model list: prioritized stable versions first, then legacy fallbacks
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-001',
    'gemini-pro-vision' // Legacy fallback
  ];
  
  let lastError;

  for (const model of models) {
    try {
      console.log(`🤖 Trying Gemini Model: ${model}`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "你是一个协助用户进行'生活显化'的AI架构师。用户有一套完整的 LIFE COMPASS 系统，你的任务是将愿景板(Mood Board)中的元素，严格按照用户的 SOP 框架拆解并分发到具体的 DATABASE 中。\n\n" + VISION_ANALYSIS_PROMPT },
              { inline_data: { mime_type: imageFile.type, data: base64Image } }
            ]
          }]
        }),
      });

      const data = await response.json();
      
      // Explicitly handle 404 (Not Found) or 400 (Bad Request) which often means model not found
      if (data.error) {
        console.warn(`❌ Gemini Error (${model}):`, data.error);
        // If specific model not found, continue to next
        if (data.error.message?.includes('not found') || data.error.message?.includes('not supported')) {
           console.log(`Model ${model} not available, trying next...`);
           lastError = new Error(data.error.message);
           continue; 
        }
        throw new Error(data.error.message);
      }
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error('Invalid response');
      return parseAIResponse(data.candidates[0].content.parts[0].text);
    } catch (e: any) {
      lastError = e;
      // If unauthorized, stop trying other models (key is invalid)
      if (e.message?.includes('API key') || e.message?.includes('PERMISSION')) break;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

function parseAIResponse(text: string): ClaudeVisionResponse {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("AI response format error");
  }
}

// ==========================================
// AI Prompt Template - Strictly Aligned with User's Notion Structure
// ==========================================

const VISION_ANALYSIS_PROMPT = `
请分析这张愿景图片(MOOD BOARD)，并将其转化为用户 LIFE COMPASS 系统中的具体元素。

用户的 **SOP 系统架构** 如下：

1. **WRITE_PLAN (收集与灵感)**
   - 对应模块: **收集箱**
   - 动作: 提取愿景中的核心价值、材质、色彩，放入收集箱。

2. **PLAN (目标与拆解)**
   - 对应模块: **OKR及项目管理**
   - 数据库: 目标管理(Goals), 关键成果(Key Results), 目标周期.
   - 动作: 将愿景转化为具体的OKR。

3. **DO (执行与落地 - DATABASE 分发)**
   请将识别出的元素分发到以下具体数据库：
   - **物品库存**: 生活物品库存, 收支管理, Finance (如: 购买特定材质的家具).
   - **生活习惯**: Health, 健身运动管理 2.0, 习惯追踪器.
   - **运动饮食**: 营养与健康, 饮食计划器, Workout (如: 原型食物, 骑行).
   - **活动计划**: 活动与旅行计划, 行前准备清单 (如: 探店, 旅行).
   - **输出创造**: 云看秀, R.I.A. 阅读系统, 内容创作系统.
   - **学习进度**: 知识管理, Heptabase, Learn.
   - **GTD管理**: 项目管理, 任务管理, Projects.

4. **CHECK (复盘与纠偏)**
   - 对应模块: **回顾纠偏**
   - 动作: 设定复盘周期(每日/周/月)对照 MOOD BOARD。

5. **LIFESTYLE (生活方式 - DAILY_ROUTINE)**
   用户固定的 Routine 结构，请将愿景元素融入其中：
   - **晚上睡前**: 冥想, 阅读(听佛乐), 准备明日装备/食物(泡豆子/洗玉米).
   - **早上自然醒**: 冥想(金刚经), 早餐(打豆浆/蒸红薯/煮鸡蛋), 八段锦/瑜伽, 学习1小时(专业知识).
   - **工作日**: 骑车通勤(自然出汗), 下班无氧, 复盘15分钟.
   - **周末**: 骑行+咖啡馆阅读, 攀岩, 观影输出, 备餐(更新食谱).

请严格按照以下 JSON 格式输出：

\`\`\`json
{
  "visualDNA": {
    "colorPalette": ["#Hex", "#Hex"],
    "materials": ["材质1", "材质2"],
    "lighting": "光线描述",
    "spatialFeeling": "空间感受",
    "emotionalCore": ["情感1", "情感2"],
    "archetype": "生活原型 (如: 'Mediterranean Slow Life')"
  },
  "lifestyleInference": {
    "pace": "生活节奏",
    "values": ["核心价值1", "核心价值2"],
    "dailyRituals": ["仪式感行为1", "仪式感行为2"]
  },
  "sensoryTriggers": {
    "smell": "嗅觉",
    "sound": "听觉",
    "touch": "触觉"
  },
  "sopMapping": [
    {
      "module": "WRITE_PLAN",
      "subSystem": "收集箱",
      "visualCue": "图片中的...",
      "actions": ["将...灵感加入收集箱", "定义愿景关键词..."]
    },
    {
      "module": "PLAN",
      "subSystem": "OKR及项目管理",
      "visualCue": "...",
      "actions": ["设定目标: ...", "KR: 每周完成..."]
    },
    {
      "module": "DO",
      "subSystem": "生活物品库存", 
      "visualCue": "...",
      "actions": ["采购...材质的物品", "整理...区域"]
    },
    {
      "module": "DO",
      "subSystem": "营养与健康",
      "visualCue": "...",
      "actions": ["尝试...食谱", "准备...食材"]
    },
    {
      "module": "DO",
      "subSystem": "R.I.A. 阅读系统",
      "visualCue": "...",
      "actions": ["阅读...主题书籍", "输出笔记"]
    },
    {
      "module": "DO",
      "subSystem": "活动与旅行计划",
      "visualCue": "...",
      "actions": ["计划去...探店", "安排...旅行"]
    },
    {
      "module": "CHECK",
      "subSystem": "回顾纠偏",
      "visualCue": "...",
      "actions": ["每周对比愿景图...", "检查习惯执行率"]
    }
  ]
}
\`\`\`
`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useVisionAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<VisionAnalysis[]>([]);

  const analyzeImages = async (files: File[]) => {
    setIsAnalyzing(true);
    setProgress(0);
    const analyses: VisionAnalysis[] = [];
    const claudeKey = localStorage.getItem('anthropic_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');

    for (let i = 0; i < files.length; i++) {
      try {
        let aiResult: ClaudeVisionResponse;
        if (files[i].name === "My_Vision_Board_Demo.png") {
          aiResult = getDemoMockResponse();
        } else {
          if (geminiKey?.startsWith('AIza')) aiResult = await analyzeVisionWithGemini(files[i], geminiKey);
          else if (claudeKey?.startsWith('sk-ant')) aiResult = await analyzeVisionWithClaude(files[i], claudeKey);
          else throw new Error('NO_VALID_API_KEY');
        }
        
        analyses.push({
          id: `vision-${Date.now()}-${i}`,
          imageUrl: URL.createObjectURL(files[i]),
          uploadedAt: Date.now(),
          visualDNA: aiResult.visualDNA,
          lifestyleInference: aiResult.lifestyleInference,
          sensoryTriggers: aiResult.sensoryTriggers,
          sopMapping: aiResult.sopMapping,
          manifestationPath: generateManifestationPath(aiResult),
        });
        setProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        console.warn(`Analysis failed:`, error);
        analyses.push(await generateFallbackAnalysis(files[i], i));
      }
    }
    setResults(analyses);
    setIsAnalyzing(false);
    return analyses;
  };

  return { analyzeImages, isAnalyzing, progress, results };
}

function generateManifestationPath(aiResult: ClaudeVisionResponse) {
  return [
    {
      week: 1,
      focus: 'WRITE & PLAN (收集与定源)',
      actions: [
        aiResult.sopMapping.find(m => m.module === 'WRITE_PLAN')?.actions[0] || '更新收集箱',
        aiResult.sopMapping.find(m => m.module === 'PLAN')?.actions[0] || '设定本月OKR',
      ],
    },
    {
      week: 2,
      focus: 'DO: 空间与物品 (Inventory)',
      actions: [
        aiResult.sopMapping.find(m => m.subSystem === '生活物品库存')?.actions[0] || '清理空间',
        '断舍离不符物品',
      ],
    },
    {
      week: 3,
      focus: 'DO: 习惯与健康 (Routine)',
      actions: [
        aiResult.sopMapping.find(m => m.subSystem === '营养与健康')?.actions[0] || '优化晨间仪式',
        '执行每日骑行/运动',
      ],
    },
    {
      week: 4,
      focus: 'CHECK & OUTPUT (创造与复盘)',
      actions: [
        aiResult.sopMapping.find(m => m.subSystem === 'R.I.A. 阅读系统')?.actions[0] || 'Heptabase 输出',
        aiResult.sopMapping.find(m => m.module === 'CHECK')?.actions[0] || '月度复盘',
      ],
    },
  ];
}

function getDemoMockResponse(): ClaudeVisionResponse {
  return {
    visualDNA: {
      colorPalette: ['#E8DCC4', '#C9A882', '#8B7355'],
      materials: ['Terra Cotta', 'Linen', 'Wood', 'Brass'],
      lighting: 'Warm Morning Light',
      spatialFeeling: 'Mediterranean Slow Life',
      emotionalCore: ['Calm', 'Grounded', 'Intentional'],
      archetype: 'Mediterranean Creator'
    },
    lifestyleInference: {
      pace: 'Slow & Intentional',
      values: ['Quality over Quantity', 'Handmade over Industrial', 'Present moment'],
      dailyRituals: ['Morning barefoot meditation', 'Hand-pour coffee ritual', 'Candlelight reflection']
    },
    sensoryTriggers: {
      smell: 'Fresh rosemary & Coffee',
      sound: 'Breeze in linen curtains',
      touch: 'Rough terra cotta & Smooth wood'
    },
    sopMapping: [
      {
        module: 'WRITE_PLAN',
        subSystem: '收集箱',
        visualCue: '整体氛围',
        actions: ['将"地中海慢生活"愿景图存入收集箱', '提取"陶土/亚麻"关键词']
      },
      {
        module: 'PLAN',
        subSystem: 'OKR及项目管理',
        visualCue: '生活方式转变',
        actions: ['设定目标: 打造地中海风格居家空间', 'KR: 更换所有塑料容器为陶/木材质']
      },
      {
        module: 'DO',
        subSystem: '生活物品库存',
        visualCue: '材质细节',
        actions: ['采购手工陶碗和木砧板', '断舍离化纤衣物，购入亚麻家居服']
      },
      {
        module: 'DO',
        subSystem: '营养与健康',
        visualCue: '饮食暗示',
        actions: ['建立"慢食仪式": 每餐前5分钟感恩', '准备全谷物与橄榄油食谱']
      },
      {
        module: 'DO',
        subSystem: 'R.I.A. 阅读系统',
        visualCue: '知识氛围',
        actions: ['阅读《Wabi-Sabi》与材质美学书籍', '在 Heptabase 输出阅读笔记']
      },
      {
        module: 'DO',
        subSystem: '活动与旅行计划',
        visualCue: '文化暗示',
        actions: ['周末探访本地陶艺工作室', '计划一次地中海文化相关的旅行']
      },
      {
        module: 'CHECK',
        subSystem: '回顾纠偏',
        visualCue: '一致性',
        actions: ['每日对比空间照片与愿景图', '复盘 DAILY_ROUTINE 执行率']
      }
    ]
  };
}

async function generateFallbackAnalysis(file: File, index: number): Promise<VisionAnalysis> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Return a "Safe Mode" analysis instead of empty data so the UI doesn't break
  return {
    id: `vision-fallback-${index}`,
    imageUrl: URL.createObjectURL(file),
    uploadedAt: Date.now(),
    visualDNA: { 
        colorPalette: ['#A8A8A8', '#E0E0E0', '#505050'], 
        materials: ['Concrete', 'Glass', 'Steel'], 
        lighting: 'Neutral Daylight', 
        spatialFeeling: 'Minimalist Focus', 
        emotionalCore: ['Clarity', 'Structure', 'Efficiency'], 
        archetype: 'Systematic Essentialist (Safe Mode)' 
    },
    lifestyleInference: { 
        pace: 'Steady & Organized', 
        values: ['Order', 'Function', 'Simplicity'], 
        dailyRituals: ['Morning Planning', 'Deep Work Block', 'Evening Review'] 
    },
    sensoryTriggers: { 
        smell: 'Clean Air', 
        sound: 'White Noise', 
        touch: 'Smooth Surfaces' 
    },
    sopMapping: [
      {
        module: 'WRITE_PLAN',
        subSystem: '收集箱',
        visualCue: 'System Error / Offline',
        actions: ['Check API Key Configuration', 'Review System Settings']
      },
      {
        module: 'PLAN',
        subSystem: 'OKR及项目管理',
        visualCue: 'Structure',
        actions: ['Set clear goals for connectivity', 'Establish fallback protocols']
      },
      {
        module: 'DO',
        subSystem: '生活物品库存',
        visualCue: 'Organization',
        actions: ['Organize local workspace', 'Declutter digital assets']
      },
       {
        module: 'DO',
        subSystem: 'R.I.A. 阅读系统',
        visualCue: 'Knowledge',
        actions: ['Read API documentation', 'Study system architecture']
      },
      {
        module: 'CHECK',
        subSystem: '回顾纠偏',
        visualCue: 'Review',
        actions: ['Troubleshoot connection issues', 'Verify API quotas']
      }
    ],
    manifestationPath: [
        { week: 1, focus: 'System Check', actions: ['Verify Network', 'Check Keys'] },
        { week: 2, focus: 'Optimization', actions: ['Refine Inputs', 'Test Outputs'] },
        { week: 3, focus: 'Deployment', actions: ['Scale Up', 'Automate'] },
        { week: 4, focus: 'Maintenance', actions: ['Regular Audits', 'Updates'] }
    ]
  };
}

export default { analyzeVisionWithClaude, analyzeVisionWithGemini, useVisionAnalysis };
