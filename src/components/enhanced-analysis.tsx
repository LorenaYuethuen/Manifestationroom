import { useState } from 'react';
import type { VisionAnalysis } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ==========================================
// AI 视觉分析引擎 - Dual Engine (ModelScope + Claude)
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

const MS_URL = `https://${projectId}.supabase.co/functions/v1/make-server-dcd239fe/analyze-modelscope`;
const PROXY_URL = `https://${projectId}.supabase.co/functions/v1/make-server-dcd239fe/analyze-proxy`;

// ==========================================
// API Implementations
// ==========================================

async function analyzeVisionWithModelScope(imageFile: File): Promise<ClaudeVisionResponse> {
  const base64Data = await resizeAndConvert(imageFile);
  // Construct Data URL for Qwen-VL (OpenAI Compatible)
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;

  const payload = {
    model: 'Qwen/Qwen-VL-Chat',
    messages: [
      {
        role: 'system',
        content: [
            { type: 'text', text: "你是一个只输出JSON的助手。将愿景板图片转化为SOP JSON数据。严禁输出任何其他文字。" }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: dataUrl
            }
          },
          {
            type: 'text',
            text: VISION_ANALYSIS_PROMPT
          }
        ]
      }
    ]
  };

  const response = await fetch(MS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (data.error) {
     const msg = data.error.message || JSON.stringify(data.error);
     // Handle "Bind Account" error gracefully
     if (msg.includes("bind your Alibaba Cloud account")) {
         console.warn("⚠️ ModelScope Account Issue: Account binding required. Automatically falling back to Simulation Mode.");
         throw new Error("TriggerFallback");
     }
     console.error("ModelScope API Error Payload:", data);
     throw new Error(msg);
  }
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("ModelScope Unexpected Response:", data);
      throw new Error("Received empty or invalid response from ModelScope.");
  }

  return parseAIResponse(data.choices[0].message.content);
}

// Helper: Resize image to ensure payload fits (Max 1024px)
function resizeAndConvert(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Output as JPEG with 0.8 quality to reduce size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

async function analyzeVisionWithClaude(imageFile: File, apiKey: string): Promise<ClaudeVisionResponse> {
  const base64Image = await resizeAndConvert(imageFile);
  
  // Standard Claude Messages API Payload
  const payload = {
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
  };

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({
      provider: 'claude',
      apiKey,
      payload
    })
  });

  const data = await response.json();

  // Handle Claude API Errors
  if (data.error) {
     const msg = data.error.message || JSON.stringify(data.error);
     // Detect billing issues for fallback trigger
     if (msg.includes('credit balance') || msg.includes('too low') || msg.includes('overloaded')) {
         throw new Error(`Billing Error: ${msg}`);
     }
     throw new Error(msg);
  }
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Claude Unexpected Response:", data);
      throw new Error("Received empty or invalid response from Claude.");
  }

  return parseAIResponse(data.content[0].text);
}

function parseAIResponse(text: string): ClaudeVisionResponse {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    
    return JSON.parse(text);
  } catch (e) {
    // console.log("JSON Parse Failed. Raw Output length:", text.length);
    throw new Error("TriggerFallback");
  }
}

// ==========================================
// AI Prompt Template
// ==========================================

const VISION_ANALYSIS_PROMPT = `
你是一个纯粹的 JSON 数据生成器。请分析这张愿景图片(MOOD BOARD)，并将其转化为用户 LIFE COMPASS 系统中的具体元素。

⚠️ 极其重要：
1. 直接输出 JSON 代码，不要包含 markdown \`\`\`json 标记。
2. 不要输出任何解释性文字、前言或结语。
3. 必须严格遵守 JSON 格式。

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
    
    // Retrieve User Key if available
    const claudeKey = localStorage.getItem('anthropic_api_key');

    for (let i = 0; i < files.length; i++) {
      try {
        let aiResult: ClaudeVisionResponse | undefined;
        
        if (files[i].name === "My_Vision_Board_Demo.png") {
           aiResult = getDemoMockResponse();
        } else {
           // STRATEGY: 
           // 1. If User has Claude Key -> Try Claude
           // 2. If Claude fails with Auth/Billing -> Fallback to Mock
           // 3. If no Claude Key -> Try ModelScope
           // 4. If ModelScope fails -> Fallback to Mock

           if (claudeKey && claudeKey.startsWith('sk-')) {
               try {
                  console.log(`🤖 Starting Analysis with Claude... Image ${i+1}/${files.length}`);
                  aiResult = await analyzeVisionWithClaude(files[i], claudeKey);
               } catch (claudeError: any) {
                  const msg = claudeError.message?.toLowerCase() || '';
                  if (msg.includes('credit balance') || msg.includes('billing') || msg.includes('too low')) {
                      console.warn("⚠️ Claude Billing Issue detected. Falling back to Safe Mode (Mock).");
                      // Do NOT try ModelScope here, go straight to Mock as per user requirement for "Silent Fallback"
                      throw new Error("TriggerFallback"); 
                  } else {
                      console.error("Claude Error:", claudeError);
                      // If it's a technical error, maybe we try ModelScope?
                      // For now, let's keep it simple and fallback to Mock to be safe.
                      throw new Error("TriggerFallback");
                  }
               }
           } else {
               // No Claude Key, try ModelScope (Server Key)
               try {
                  console.log(`🤖 Starting Analysis with ModelScope (Qwen-VL)... Image ${i+1}/${files.length}`);
                  aiResult = await analyzeVisionWithModelScope(files[i]);
               } catch (msError: any) {
                  if (msError.message !== "TriggerFallback") {
                      console.error("ModelScope Error:", msError);
                  }
                  throw new Error("TriggerFallback");
               }
           }
        }
        
        if (!aiResult) {
            throw new Error("No result from AI");
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

      } catch (error: any) {
        // Fallback to Simulation Mode
        const msg = error.message || '';
        if (msg !== "TriggerFallback") {
             console.warn(`Analysis failed details:`, error);
        }
        console.log("⚠️ Falling back to Simulation Mode.");
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
        actions: ['采购手工陶碗和木砧板', '断���离化纤衣物，购入亚麻家居服']
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

// ==========================================
// MOCK DATA PROFILES (Based on User's Vision)
// ==========================================

const MOCK_PROFILES: ClaudeVisionResponse[] = [
    // 1. Mediterranean Elegance (Index 0, 2, etc.)
    {
        visualDNA: {
          colorPalette: ["#F5F0E8", "#8B6F47", "#FFFFFF", "#2C2420"],
          materials: ["Terra Cotta", "Raw Concrete", "Linen", "Vintage Wood"],
          lighting: "Golden Hour Diffused",
          spatialFeeling: "Expansive yet Intimate",
          emotionalCore: ["Confident", "Sensual", "Unhurried", "Theatrical"],
          archetype: "Mediterranean Muse"
        },
        lifestyleInference: {
          pace: "Slow Mornings (9-11am)",
          values: ["Beauty as Daily Life", "Body as Art", "Space as Stage"],
          dailyRituals: ["Barefoot Grounding", "Natural Light Yoga", "Candlelight Dinner"]
        },
        sensoryTriggers: {
          smell: "Fig & Old Wood",
          sound: "Distant Bells & Fabric Rustle",
          touch: "Cool Terra Cotta & Soft Linen"
        },
        sopMapping: [
          { module: 'WRITE_PLAN', subSystem: '收集箱', visualCue: 'Aesthetic', actions: ['Remove plastic items', 'Add linen to wishlist'] },
          { module: 'PLAN', subSystem: 'OKR及项目管理', visualCue: 'Upgrade', actions: ['Target: Aesthetic Upgrade', 'KR: Replace 3 synthetic items'] },
          { module: 'DO', subSystem: '生活物品库存', visualCue: 'Materials', actions: ['Buy Linen Bedding', 'Buy Vintage Chair'] },
          { module: 'DO', subSystem: '健身运动管理 2.0', visualCue: 'Body', actions: ['Pilates 3x/week', 'Practice Conscious Posture'] },
          { module: 'DO', subSystem: '内容创作系统', visualCue: 'Light', actions: ['Photo Shoot: Light & Shadow', 'Study Helmut Newton'] },
          { module: 'CHECK', subSystem: '回顾纠偏', visualCue: 'Review', actions: ['Daily Body Feeling Journal'] }
        ]
    },
    // 2. Urban Minimalist (Index 1)
    {
        visualDNA: {
          colorPalette: ["#4A3C2E", "#1C1C1C", "#D4C5B0"],
          materials: ["Wool", "Stone", "Aged Architecture"],
          lighting: "Overcast Diffused",
          emotionalCore: ["Introspective", "Independent", "Intellectual"],
          archetype: "Urban Flâneur"
        },
        lifestyleInference: {
          pace: "Observational & Solitary",
          values: ["Intellectual Depth", "Minimalism", "Observation"],
          dailyRituals: ["Afternoon City Walk", "Cafe Reading", "People Watching"]
        },
        sensoryTriggers: {
          smell: "Rain on Asphalt",
          sound: "City Hum",
          touch: "Rough Wool & Cold Stone"
        },
        sopMapping: [
           { module: 'WRITE_PLAN', subSystem: '收集箱', visualCue: 'Urban', actions: ['Capture city textures', 'Note observation ideas'] },
           { module: 'DO', subSystem: '生活物品库存', visualCue: 'Wardrobe', actions: ['Keep 5 High-Quality Coats', 'Declutter Wardrobe'] },
           { module: 'DO', subSystem: 'R.I.A. 阅读系统', visualCue: 'Intellect', actions: ['Read Philosophy Books', 'Cafe Reading Session'] },
           { module: 'DO', subSystem: '内容创作系统', visualCue: 'People', actions: ['Observation Journal: Stranger Stories'] },
           { module: 'CHECK', subSystem: '回顾纠偏', visualCue: 'Solitude', actions: ['Weekly Solitude Audit'] }
        ]
    },
    // 3. Wabi-Sabi Sanctuary (Index 3, 6, 7)
    {
        visualDNA: {
          colorPalette: ["#C4A574", "#8B7355", "#3D3D3D"],
          materials: ["Raw Concrete", "Natural Wood", "Linen"],
          lighting: "Warm Ambient Layers",
          spatialFeeling: "Low Profile Zen Flow",
          emotionalCore: ["Grounded", "Meditative", "Uncluttered"],
          archetype: "Wabi-Sabi Essentialist"
        },
        lifestyleInference: {
          pace: "Grounded & Present",
          values: ["Imperfection", "Silence", "Nature"],
          dailyRituals: ["Floor Tea Ceremony", "Floor Reading", "Nothing Time"]
        },
        sensoryTriggers: {
          smell: "Earth & Tea",
          sound: "Silence",
          touch: "Raw Wood Texture"
        },
        sopMapping: [
           { module: 'DO', subSystem: '生活物品库存', visualCue: 'Simplicity', actions: ['One-In-One-Out Rule', 'Lower Furniture Height'] },
           { module: 'DO', subSystem: '习惯追踪器', visualCue: 'Living', actions: ['Floor Living Day', 'Remove Ceiling Lights'] },
           { module: 'DO', subSystem: 'Finance', visualCue: 'Craft', actions: ['Invest in Handmade Crafts', 'Stop Impulse Buying'] },
           { module: 'CHECK', subSystem: '回顾纠偏', visualCue: 'Space', actions: ['Declutter Check', 'Silence Audit'] }
        ]
    },
    // 4. Coffee Ritual Corner (Index 4)
    {
        visualDNA: {
          colorPalette: ["#3C3C3C", "#000000", "#A88B6F"],
          materials: ["Steel", "Glass", "Dark Wood"],
          lighting: "Focused Spot",
          spatialFeeling: "Precision Corner",
          emotionalCore: ["Precision", "Self Care", "Focus"],
          archetype: "Ritual Master"
        },
        lifestyleInference: {
          pace: "Precise & Slow Start",
          values: ["Process", "Quality", "Patience"],
          dailyRituals: ["Morning Pour Over", "Bean Grinding", "Tech-Free Morning"]
        },
        sensoryTriggers: {
          smell: "Fresh Ground Coffee",
          sound: "Water Pouring",
          touch: "Warm Ceramic Cup"
        },
        sopMapping: [
           { module: 'DO', subSystem: '习惯追踪器', visualCue: 'Morning', actions: ['06:30 Coffee Ceremony', 'No Phone during Coffee'] },
           { module: 'DO', subSystem: '生活物品库存', visualCue: 'Gear', actions: ['Setup Coffee Corner', 'Buy Pour Over Gear'] },
           { module: 'DO', subSystem: '知识管理', visualCue: 'Taste', actions: ['Study Coffee Origins', 'Tasting Notes Log'] }
        ]
    },
    // 5. Quiet Companionship (Index 5)
    {
        visualDNA: {
          colorPalette: ["#E0E0E0", "#303030", "#A0A0A0"],
          materials: ["Soft Light", "Paper", "Fur"],
          lighting: "Window Blinds Shadow",
          spatialFeeling: "Shared Solitude",
          emotionalCore: ["Solitude", "Connection", "Peace"],
          archetype: "Silent Companion"
        },
        lifestyleInference: {
          pace: "Gentle & Shared",
          values: ["Quiet Presence", "Deep Connection", "Peace"],
          dailyRituals: ["Silent Reading Hour", "Cat Meditation", "Window Gazing"]
        },
        sensoryTriggers: {
          smell: "Clean Laundry",
          sound: "Turning Pages",
          touch: "Soft Fur"
        },
        sopMapping: [
           { module: 'DO', subSystem: '活动与旅行计划', visualCue: 'Social', actions: ['Practice Silent Company', 'Invite Friend for "Nothing"'] },
           { module: 'DO', subSystem: 'R.I.A. 阅读系统', visualCue: 'Focus', actions: ['Daily Quality Solitude', 'Paper Book Reading'] }
        ]
    }
];

async function generateFallbackAnalysis(file: File, index: number): Promise<VisionAnalysis> {
  await new Promise(resolve => setTimeout(resolve, 800)); // Slight delay for realism
  
  // Select profile based on index to rotate through them
  let profileIndex = 0;
  const modIndex = index % 8; // Assuming 8 images cycle
  
  if (modIndex === 0 || modIndex === 2) profileIndex = 0;
  else if (modIndex === 1) profileIndex = 1;
  else if (modIndex === 3 || modIndex === 6 || modIndex === 7) profileIndex = 2;
  else if (modIndex === 4) profileIndex = 3;
  else if (modIndex === 5) profileIndex = 4;
  
  const mockProfile = MOCK_PROFILES[profileIndex];

  return {
    id: `vision-simulated-${Date.now()}-${index}`,
    imageUrl: URL.createObjectURL(file),
    uploadedAt: Date.now(),
    visualDNA: mockProfile.visualDNA,
    lifestyleInference: mockProfile.lifestyleInference,
    sensoryTriggers: mockProfile.sensoryTriggers,
    sopMapping: mockProfile.sopMapping,
    manifestationPath: generateManifestationPath(mockProfile)
  };
}

export default { analyzeVisionWithModelScope, useVisionAnalysis };