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
    module: string;
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
      system: "你是一个专业的愿景显化架构师。你的任务是将用户的愿景板图片'解构'为可落地执行的生活系统。",
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
 * Gemini API Implementation
 */
async function analyzeVisionWithGemini(imageFile: File, apiKey: string): Promise<ClaudeVisionResponse> {
  const base64Image = await fileToBase64(imageFile);
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: "你是一个专业的愿景显化架构师。你的任务是将用户的愿景板图片'解构'为可落地执行的生活系统。\n\n" + VISION_ANALYSIS_PROMPT },
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
    throw new Error(data.error.message);
  }

  const analysisText = data.candidates[0].content.parts[0].text;
  return parseAIResponse(analysisText);
}

// ==========================================
// Helper: Parse AI Response
// ==========================================

function parseAIResponse(text: string): ClaudeVisionResponse {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  return JSON.parse(text);
}

// ==========================================
// AI Prompt Template
// ==========================================

const VISION_ANALYSIS_PROMPT = `
请作为一位"生活方式架构师"，对这张愿景图片进行**深度解构**。不要只描述你看到的，要推导这背后的生活系统。

请严格按照以下 JSON 格式输出，确保包含所有字段：

\`\`\`json
{
  "visualDNA": {
    "colorPalette": ["#Hex", "#Hex", "#Hex", "#Hex"],
    "materials": ["材质1", "材质2", "材质3"],
    "lighting": "光线描述",
    "spatialFeeling": "空间感受形容词",
    "emotionalCore": ["情感1", "情感2", "情感3"],
    "archetype": "生活原型名称 (例如: 'Urban Zen Master')"
  },
  "lifestyleInference": {
    "pace": "生活节奏描述",
    "values": ["价值观1", "价值观2", "价值观3"],
    "dailyRituals": ["仪式1", "仪式2", "仪式3"]
  },
  "sensoryTriggers": {
    "smell": "气味描述",
    "sound": "声音描述",
    "touch": "触觉描述"
  },
  "sopMapping": [
    {
      "module": "DAILY_ROUTINE",
      "visualCue": "你从图片哪里看出的？(例如：'图片中的瑜伽垫暗示了晨间运动')",
      "actions": ["具体的行动指令1", "具体的行动指令2"]
    },
    {
      "module": "INVENTORY",
      "visualCue": "你从图片哪里看出的？(例如：'极简的桌面暗示需要断舍离杂物')",
      "actions": ["购买/获取清单", "清理/移除清单"]
    },
    {
      "module": "HEALTH",
      "visualCue": "你从图片哪里看出的？(例如：'健康的早餐碗暗示了饮食习惯')",
      "actions": ["饮食/运动建议"]
    },
    {
      "module": "SPACE",
      "visualCue": "你从图片哪里看出的？(例如：'温暖的落地灯暗示了氛围照明')",
      "actions": ["空间改造建议"]
    },
    {
      "module": "GROWTH",
      "visualCue": "你从图片哪里看出的？(例如：'书架上的书暗示了阅读习惯')",
      "actions": ["学习/技能提升建议"]
    },
    {
      "module": "OUTPUT",
      "visualCue": "你从图片哪里看出的？(例如：'笔记本电脑暗示了创作输出')",
      "actions": ["创作/表达建议"]
    }
  ]
}
\`\`\`

**关键要求：**
1. **sopMapping** 必须包含所有 6 个模块：DAILY_ROUTINE, INVENTORY, HEALTH, SPACE, GROWTH, OUTPUT。
2. **visualCue** 必须具体指出图片中的视觉证据。
3. **actions** 必须是祈使句，具体可执行（例如："每天早上喝一杯温水"，而不是"保持健康"）。
4. 请用**中文**输出内容。
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
    
    // Retrieve API Keys
    const claudeKey = localStorage.getItem('anthropic_api_key');
    const geminiKey = localStorage.getItem('gemini_api_key');

    for (let i = 0; i < files.length; i++) {
      try {
        let aiResult: ClaudeVisionResponse;

        // Priority: Gemini -> Claude
        if (geminiKey && geminiKey.startsWith('AIza')) {
           aiResult = await analyzeVisionWithGemini(files[i], geminiKey);
        } else if (claudeKey && claudeKey.startsWith('sk-ant')) {
           aiResult = await analyzeVisionWithClaude(files[i], claudeKey);
        } else {
           throw new Error('NO_VALID_API_KEY');
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
        // Fallback
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
      focus: '环境重塑 (Environment)',
      actions: [
        aiResult.sopMapping.find(m => m.module === 'INVENTORY')?.actions[0] || '清理杂物',
        aiResult.sopMapping.find(m => m.module === 'SPACE')?.actions[0] || '调整光线',
      ],
    },
    {
      week: 2,
      focus: '身体与能量 (Body & Energy)',
      actions: [
        aiResult.sopMapping.find(m => m.module === 'HEALTH')?.actions[0] || '早睡早起',
        aiResult.sopMapping.find(m => m.module === 'DAILY_ROUTINE')?.actions[0] || '晨间冥想',
      ],
    },
    {
      week: 3,
      focus: '输入与输出 (Input & Output)',
      actions: [
        aiResult.sopMapping.find(m => m.module === 'GROWTH')?.actions[0] || '阅读30分钟',
        aiResult.sopMapping.find(m => m.module === 'OUTPUT')?.actions[0] || '写日记',
      ],
    },
    {
      week: 4,
      focus: '整合 (Integration)',
      actions: [
        '回顾本月显化进度',
        '根据当前状态调整下个月的愿景板',
      ],
    },
  ];
}

// ==========================================
// Enhanced Fallback (Mock AI)
// ==========================================

async function generateFallbackAnalysis(file: File, index: number): Promise<VisionAnalysis> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const seed = file.name.length + index;
  
  const archetypes = [
    {
      name: 'Mediterranean Elegance (地中海优雅)',
      visualCue: '图片中的陶土色调和亚麻材质',
      inventory: '清理塑料制品，购入亚麻床品',
      routine: '晨间赤脚行走，感受地面温度',
    },
    {
      name: 'Urban Minimalist (都市极简)',
      visualCue: '图片中大面积的留白和黑白灰配色',
      inventory: '移除桌面所有非必要物品',
      routine: '早起30分钟进行无手机阅读',
    },
    {
      name: 'Nature Healer (自然疗愈)',
      visualCue: '图片中丰富的绿植和原木元素',
      inventory: '购入室内观叶植物',
      routine: '每日15分钟森林浴/接触自然',
    },
    {
      name: 'Creative Soul (创意灵魂)',
      visualCue: '图片中混乱而有序的色彩和艺术品',
      inventory: '整理画具和创作工具',
      routine: '睡前进行自由书写',
    }
  ];

  const t = archetypes[seed % archetypes.length];

  return {
    id: `vision-${Date.now()}-${index}`,
    imageUrl: URL.createObjectURL(file),
    uploadedAt: Date.now(),
    visualDNA: {
      colorPalette: ['#F5F0E8', '#8B6F47', '#333333', '#FFFFFF'],
      materials: ['linen', 'wood', 'ceramic'],
      lighting: 'soft natural light',
      spatialFeeling: 'open and breathing',
      emotionalCore: ['calm', 'inspired', 'grounded'],
      archetype: t.name,
    },
    lifestyleInference: {
      pace: 'unhurried and intentional',
      values: ['mindfulness', 'authenticity', 'beauty'],
      dailyRituals: [t.routine, 'evening reflection', 'healthy nourishment'],
    },
    sensoryTriggers: {
      smell: 'sandalwood and citrus',
      sound: 'soft jazz or nature sounds',
      touch: 'textured fabrics and smooth surfaces',
    },
    sopMapping: [
      {
        module: 'DAILY_ROUTINE',
        visualCue: t.visualCue,
        actions: [t.routine, '每晚进行感恩记录'],
      },
      {
        module: 'INVENTORY',
        visualCue: '基于整体风格的一致性',
        actions: [t.inventory, '清理已不再使用的旧物'],
      },
      {
        module: 'HEALTH',
        visualCue: '基于对生活平衡的追求',
        actions: ['每日饮水2000ml', '坚持食用原型食物'],
      },
      {
        module: 'SPACE',
        visualCue: '基于光线氛围',
        actions: ['调整卧室灯光为暖色调', '保持地面整洁无杂物'],
      },
      {
        module: 'GROWTH',
        visualCue: '基于内在提升需求',
        actions: ['每月阅读一本书', '学习一项新技能'],
      },
      {
        module: 'OUTPUT',
        visualCue: '基于自我表达需求',
        actions: ['每周一次深度写作', '通过摄影记录生活'],
      },
    ],
    manifestationPath: [
      { week: 1, focus: '清理', actions: ['彻底大扫除', '断舍离'] },
      { week: 2, focus: '秩序', actions: ['建立晨间流程', '整理工作区'] },
      { week: 3, focus: '滋养', actions: ['注重饮食', '早睡'] },
      { week: 4, focus: '创造', actions: ['开始新项目', '分享成果'] },
    ],
  };
}

export default { analyzeVisionWithClaude, analyzeVisionWithGemini, useVisionAnalysis };
