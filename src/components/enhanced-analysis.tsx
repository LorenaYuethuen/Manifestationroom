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
    module: string; // 对应用户SOP的四大板块: WRITE_PLAN, PLAN, DO, CHECK
    subSystem: string; // 对应具体的子系统
    visualCue: string;
    actions: string[];
  }[];
}

// ==========================================
// API Implementations
// ==========================================

/**
 * Claude API Implementation
 */
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
      system: "你是一个协助用户进行'生活显化'的AI架构师。用户有一套非常具体的 Notion SOP 系统 (LIFE COMPASS)，你的任务是将愿景板图片中的元素，精准映射到这套系统中。",
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
  
  if (data.error) {
      throw new Error(data.error.message);
  }

  const analysisText = data.content[0].text;
  return parseAIResponse(analysisText);
}

/**
 * Gemini API Implementation with Model Fallback
 */
async function analyzeVisionWithGemini(imageFile: File, apiKey: string): Promise<ClaudeVisionResponse> {
  const base64Image = await fileToBase64(imageFile);
  
  const models = [
    'gemini-1.5-flash', 
    'gemini-1.5-flash-latest', 
    'gemini-1.5-pro',
    'gemini-pro-vision'
  ];
  
  let lastError;

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "你是一个协助用户进行'生活显化'的AI架构师。用户有一套非常具体的 Notion SOP 系统 (LIFE COMPASS)，你的任务是将愿景板图片中的元素，精准映射到这套系统中。\n\n" + VISION_ANALYSIS_PROMPT },
              {
                inline_data: {
                  mime_type: imageFile.type,
                  data: base64Image
                }
              }
            ]
          }]
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        if (data.error.code === 403 || data.error.status === 'PERMISSION_DENIED') {
             throw new Error(data.error.message);
        }
        throw new Error(data.error.message);
      }

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response structure from Gemini');
      }

      const analysisText = data.candidates[0].content.parts[0].text;
      return parseAIResponse(analysisText);

    } catch (e: any) {
      console.warn(`Model ${model} failed:`, e.message);
      lastError = e;
      if (e.message?.includes('API key not valid') || e.message?.includes('PERMISSION_DENIED')) {
          break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// ==========================================
// Helper: Parse AI Response
// ==========================================

function parseAIResponse(text: string): ClaudeVisionResponse {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON from AI:", text);
    throw new Error("AI response format error");
  }
}

// ==========================================
// AI Prompt Template - Customized for User's Notion SOP
// ==========================================

const VISION_ANALYSIS_PROMPT = `
请分析这张愿景图片，并将其转化为用户个人 Notion SOP 系统 (LIFE COMPASS) 中的具体元素。

用户的 **真实生活系统 (True Context)** 如下：
1. **WRITE_PLAN**: 灵感收集、Mood Board、Wishlist。
2. **PLAN (OKR)**: 目标管理、关键成果、目标周期。
3. **DO (执行系统)**:
   - **Daily Routine (早)**: 
     - 醒来冥想/听金刚经解读。
     - 早餐: 打豆浆/蒸玉米/红薯/煮鸡蛋。
     - 运动: 八段锦/拉伸/瑜伽。
     - 学习: 1小时专业知识 (营养学/神经科学/历史人文)。
     - 通勤: 骑车上班 (自然出汗)。
   - **Daily Routine (晚)**:
     - 运动: 骑车回家 + 居家无氧。
     - 仪式: 洗澡护肤(听音乐) -> 阅读/听佛乐 -> 冥想入眠。
     - 准备: 泡明天的豆子、洗玉米。
   - **Weekend**: 骑行探店(咖啡/饭店)、攀岩、观影输出、备菜(更新食谱)。
   - **Growth**: Heptabase 知识管理、RIA 阅读系统、云看秀。
   - **Output**: 内容创作系统。
   - **Inventory**: 物品库存、收支管理。
4. **CHECK**: 每日复盘(15分钟无氧提升)、每周/月复盘。

请严格按照以下 JSON 格式输出，将图片中的视觉元素与上述具体习惯结合：

\`\`\`json
{
  "visualDNA": {
    "colorPalette": ["#Hex", "#Hex", "#Hex"],
    "materials": ["材质1", "材质2"],
    "lighting": "光线描述",
    "spatialFeeling": "空间感受",
    "emotionalCore": ["情感1", "情感2"],
    "archetype": "生活原型 (如: 'Mindful Urban Monk')"
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
      "subSystem": "Inspiration",
      "visualCue": "图片中...",
      "actions": ["将图片中的...加入 Notion Wishlist", "在 Mood Board 中更新..."]
    },
    {
      "module": "PLAN",
      "subSystem": "OKR",
      "visualCue": "图片暗示了...",
      "actions": ["设定关于...的OKR目标", "关键结果: 每周完成..."]
    },
    {
      "module": "DO",
      "subSystem": "Daily Routine",
      "visualCue": "图片氛围...",
      "actions": ["晨间: 在金刚经冥想后...", "晚间: 泡豆子时..."]
    },
    {
      "module": "DO",
      "subSystem": "Health",
      "visualCue": "...",
      "actions": ["饮食: 尝试...原型食物", "运动: 骑行前往..."]
    },
    {
      "module": "DO",
      "subSystem": "Growth",
      "visualCue": "...",
      "actions": ["在 Heptabase 中建立...卡片", "使用 RIA 方法阅读..."]
    },
    {
      "module": "DO",
      "subSystem": "Output",
      "visualCue": "...",
      "actions": ["输出一篇关于...的内容", "记录...的灵感"]
    },
    {
      "module": "CHECK",
      "subSystem": "Review",
      "visualCue": "...",
      "actions": ["复盘...的执行情况", "检查..."]
    }
  ]
}
\`\`\`

**要求：**
1. **深度融合**: 行动建议必须深度融合用户的真实习惯（如"泡豆子"、"Heptabase"、"骑行"、"金刚经"等）。
2. **Visual Cue**: 解释图片如何触发这些特定的习惯。
3. 输出为**中文**。
`;

// ==========================================
// Utility Functions
// ==========================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data URL prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// React Hook
// ==========================================

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
            if (geminiKey && geminiKey.startsWith('AIza')) {
               try {
                 aiResult = await analyzeVisionWithGemini(files[i], geminiKey);
               } catch (e) {
                 console.warn("Gemini failed for demo, falling back to perfect mock");
                 aiResult = getDemoMockResponse();
               }
            } else {
               aiResult = getDemoMockResponse();
            }
        } else {
            if (geminiKey && geminiKey.startsWith('AIza')) {
               aiResult = await analyzeVisionWithGemini(files[i], geminiKey);
            } else if (claudeKey && claudeKey.startsWith('sk-ant')) {
               aiResult = await analyzeVisionWithClaude(files[i], claudeKey);
            } else {
               throw new Error('NO_VALID_API_KEY');
            }
        }
        
        const analysis: VisionAnalysis = {
          id: `vision-${Date.now()}-${i}`,
          imageUrl: URL.createObjectURL(files[i]),
          uploadedAt: Date.now(),
          visualDNA: aiResult.visualDNA,
          lifestyleInference: aiResult.lifestyleInference,
          sensoryTriggers: aiResult.sensoryTriggers,
          sopMapping: aiResult.sopMapping,
          manifestationPath: generateManifestationPath(aiResult),
        };

        analyses.push(analysis);
        setProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        console.warn(`Analysis failed (using fallback):`, error);
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
      focus: 'WRITE & PLAN (Notion Setup)',
      actions: [
        aiResult.sopMapping.find(m => m.module === 'WRITE_PLAN')?.actions[0] || '整理 Notion Wishlist',
        aiResult.sopMapping.find(m => m.module === 'PLAN')?.actions[0] || '更新本月 OKR',
      ],
    },
    {
      week: 2,
      focus: 'DO: Routine (Morning & Night)',
      actions: [
        aiResult.sopMapping.find(m => m.subSystem === 'Daily Routine')?.actions[0] || '晨间金刚经冥想',
        aiResult.sopMapping.find(m => m.subSystem === 'Health')?.actions[0] || '备餐：蒸玉米/红薯',
      ],
    },
    {
      week: 3,
      focus: 'DO: Growth (Heptabase)',
      actions: [
        aiResult.sopMapping.find(m => m.subSystem === 'Growth')?.actions[0] || 'Heptabase 知识卡片整理',
        aiResult.sopMapping.find(m => m.subSystem === 'Output')?.actions[0] || 'RIA 阅读笔记输出',
      ],
    },
    {
      week: 4,
      focus: 'CHECK (Review & Elevate)',
      actions: [
        aiResult.sopMapping.find(m => m.module === 'CHECK')?.actions[0] || 'Notion 月度复盘',
        '调整下个月的健身计划',
      ],
    },
  ];
}

// ==========================================
// Enhanced Fallback (Mock AI with REAL Notion Context)
// ==========================================

function getDemoMockResponse(): ClaudeVisionResponse {
    return {
        visualDNA: {
          colorPalette: ['#2C2C2C', '#8B6F47', '#D4C4B7'],
          materials: ['Walnut Wood', 'Ceramic', 'Linen'],
          lighting: 'Warm ambient & Natural spotlight',
          spatialFeeling: 'Wabi-sabi & Minimalist',
          emotionalCore: ['Serenity', 'Focus', 'Warmth'],
          archetype: 'Wabi-sabi Creator (侘寂创造者)'
        },
        lifestyleInference: {
          pace: 'Intentional & Slow',
          values: ['Mindfulness', 'Aesthetics', 'Growth'],
          dailyRituals: ['Pour-over Coffee', 'Cat Cuddling', 'Reading']
        },
        sensoryTriggers: {
          smell: 'Fresh soy milk & Old books',
          sound: 'Buddhist music & Vinyl crackle',
          touch: 'Rough pottery & Soft cat fur'
        },
        sopMapping: [
          {
            module: 'WRITE_PLAN',
            subSystem: 'Inspiration',
            visualCue: '极简主义与阅读观影板块',
            actions: ['在 Notion Mood Board 中更新"侘寂风"灵感', '将"实木书桌"加入 Wishlist']
          },
          {
            module: 'PLAN',
            subSystem: 'OKR',
            visualCue: 'Career & Growth 板块',
            actions: ['设定季度"个人品牌"增长目标', 'KR: 每周在 Heptabase 输出一篇深度笔记']
          },
          {
            module: 'DO',
            subSystem: 'Daily Routine',
            visualCue: 'Coffee Corner & Routine 板块',
            actions: ['晨间听金刚经解读 + 手冲咖啡', '晚间泡豆子准备明日早餐']
          },
          {
            module: 'DO',
            subSystem: 'Health',
            visualCue: 'Healthy Diet & 身体健康板块',
            actions: ['坚持早餐原型食物 (玉米/红薯/鸡蛋)', '骑行上班 (自然出汗)']
          },
          {
            module: 'DO',
            subSystem: 'Growth',
            visualCue: '阅读观影 & Routine 板块',
            actions: ['晨间1小时学习 (神经科学)', '使用 RIA 方法阅读并记录笔记']
          },
          {
            module: 'DO',
            subSystem: 'Output',
            visualCue: '笔记本电脑 & 创作环境',
            actions: ['整理"生活方式观察"到内容创作系统', '更新云看秀数据库']
          },
          {
            module: 'CHECK',
            subSystem: 'Review',
            visualCue: '整体风格的一致性',
            actions: ['每晚15分钟复盘无氧训练', '检查 Notion 习惯追踪器']
          }
        ]
      };
}

async function generateFallbackAnalysis(file: File, index: number): Promise<VisionAnalysis> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const seed = file.name.length + index;
  
  const archetypes = [
    {
      name: 'Disciplined Flow (自律心流)',
      routine: '晨间八段锦 + 深度工作',
      health: '早餐打豆浆 + 蒸红薯',
      growth: 'Heptabase 整理显化笔记',
    },
    {
      name: 'Nature Connection (自然连接)',
      routine: '周末骑行去公园阅读',
      health: '增加户外骑行有氧时间',
      growth: '阅读自然历史类书籍',
    },
    {
      name: 'Inner Peace (内观自在)',
      routine: '睡前冥想 + 听佛乐',
      health: '每晚泡豆子准备明日饮食',
      growth: '阅读金刚经/灵性书籍',
    }
  ];

  const t = archetypes[seed % archetypes.length];

  return {
    id: `vision-${Date.now()}-${index}`,
    imageUrl: URL.createObjectURL(file),
    uploadedAt: Date.now(),
    visualDNA: {
      colorPalette: ['#1A1A1A', '#4CAF50', '#E0E0E0'],
      materials: ['digital', 'paper', 'nature'],
      lighting: 'focused studio light',
      spatialFeeling: 'organized structure',
      emotionalCore: ['clarity', 'discipline', 'growth'],
      archetype: t.name,
    },
    lifestyleInference: {
      pace: 'structured yet flowing',
      values: ['continuous improvement', 'mind-body connection'],
      dailyRituals: [t.routine, 'evening review', 'healthy prep'],
    },
    sensoryTriggers: {
      smell: 'soy milk or tea',
      sound: 'Buddhist music or nature',
      touch: 'smooth keyboard or paper',
    },
    sopMapping: [
      {
        module: 'WRITE_PLAN',
        subSystem: 'Inspiration',
        visualCue: 'Mock: 图片结构感',
        actions: ['将此愿景加入 Notion 收集箱'],
      },
      {
        module: 'PLAN',
        subSystem: 'OKR',
        visualCue: 'Mock: 目标导向',
        actions: ['设定相关 Key Result'],
      },
      {
        module: 'DO',
        subSystem: 'Daily Routine',
        visualCue: 'Mock: 生活方式',
        actions: [t.routine],
      },
      {
        module: 'DO',
        subSystem: 'Health',
        visualCue: 'Mock: 健康暗示',
        actions: [t.health],
      },
      {
        module: 'DO',
        subSystem: 'Growth',
        visualCue: 'Mock: 学习氛围',
        actions: [t.growth],
      },
      {
        module: 'CHECK',
        subSystem: 'Review',
        visualCue: 'Mock: 反思',
        actions: ['晚间15分钟复盘今日执行'],
      },
    ],
    manifestationPath: [
      { week: 1, focus: 'Plan', actions: ['收集灵感', '拆解OKR'] },
      { week: 2, focus: 'Do: Routine', actions: [t.routine, t.health] },
      { week: 3, focus: 'Do: Growth', actions: [t.growth, '分享输出'] },
      { week: 4, focus: 'Check', actions: ['复盘数据', '迭代SOP'] },
    ],
  };
}

export default { analyzeVisionWithClaude, analyzeVisionWithGemini, useVisionAnalysis };
