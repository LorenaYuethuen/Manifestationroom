# MANIFESTATION ROOM 系统集成指南

> 如何将 AI 驱动的显化引擎整合到现有代码中

---

## 📋 概览

我们创建了 3 个核心模块来增强现有的 MANIFESTATION ROOM：

1. **`enhanced-analysis.tsx`** - AI 视觉分析引擎（真实 Claude Vision API）
2. **`daily-manifestation.tsx`** - 每日任务动态生成器
3. **本文档** - 集成步骤与最佳实践

---

## 🔧 集成步骤

### Step 1: 替换 Mock 分析为真实 AI 分析

**文件：`src/components/AnalysisStage.tsx`**

**原代码（Mock 版本）：**
```tsx
import { generateMockAnalyses } from './some-mock-file';

useEffect(() => {
  // ... 模拟分析过程
  setTimeout(() => {
    const mockAnalyses = generateMockAnalyses(images, existingAnalyses);
    onAnalysisComplete(mockAnalyses);
  }, 500);
}, []);
```

**新代码（AI 驱动版本）：**
```tsx
import { useVisionAnalysis } from '../enhanced-analysis';

export function AnalysisStage({ images, onAnalysisComplete, existingAnalyses }: AnalysisStageProps) {
  const { analyzeImages, isAnalyzing, progress } = useVisionAnalysis();
  
  useEffect(() => {
    const runAnalysis = async () => {
      try {
        // 🎯 调用真实 AI 分析
        const analyses = await analyzeImages(images);
        
        // 合并到现有数据
        const combined = [...existingAnalyses, ...analyses];
        onAnalysisComplete(combined);
      } catch (error) {
        console.error('AI 分析失败，使用备用模板', error);
        // 备用方案会自动在 useVisionAnalysis 中处理
      }
    };

    runAnalysis();
  }, [images]);

  return (
    <div className="analysis-stage">
      {/* 现有的 UI 保持不变 */}
      <ProgressBar value={progress} />
      {/* ... */}
    </div>
  );
}
```

---

### Step 2: 在 ActionPlan 中添加"今日任务"面板

**文件：`src/components/ActionPlan.tsx`**

**在现有的 Tab 系统中添加第四个 Tab：**

```tsx
import { DailyManifestationDashboard } from '../daily-manifestation';
import { useState } from 'react';

type Tab = 'overview' | 'senses' | 'actions' | 'daily'; // ✅ 新增 'daily'

export function ActionPlan({ analysis, onBack, allAnalyses }: ActionPlanProps) {
  const [activeTab, setActiveTab] = useState<Tab>('daily'); // 默认显示今日任务
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const handleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      // 💾 持久化到 localStorage
      localStorage.setItem(`tasks-${analysis.id}`, JSON.stringify([...next]));
      return next;
    });
  };

  // 📂 从 localStorage 恢复已完成任务
  useEffect(() => {
    const saved = localStorage.getItem(`tasks-${analysis.id}`);
    if (saved) {
      setCompletedTasks(new Set(JSON.parse(saved)));
    }
  }, [analysis.id]);

  return (
    <div className="action-plan">
      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'daily' as Tab, label: '今日任务', icon: Calendar }, // ✅ 新增
          { id: 'overview' as Tab, label: '核心价值', icon: Eye },
          { id: 'senses' as Tab, label: '五感触发器', icon: Music },
          { id: 'actions' as Tab, label: '显化路径', icon: Target },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'daily' && (
          <DailyManifestationDashboard
            key="daily"
            analysis={analysis}
            completedTasks={completedTasks}
            onTaskComplete={handleTaskComplete}
          />
        )}
        {/* 其他 Tab 保持不变 */}
      </AnimatePresence>
    </div>
  );
}
```

---

### Step 3: 配置 Anthropic API Key

**方式 1：环境变量（推荐）**

创建 `.env.local` 文件：
```bash
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

然后在 `enhanced-analysis.tsx` 中读取：
```tsx
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY, // ✅ 从环境变量读取
  },
  // ...
});
```

**方式 2：用户输入（更安全）**

在 UI 中让用户输入自己的 API Key：
```tsx
function SettingsPanel() {
  const [apiKey, setApiKey] = useState('');
  
  const handleSave = () => {
    localStorage.setItem('anthropic_api_key', apiKey);
  };

  return (
    <input 
      type="password" 
      placeholder="输入你的 Anthropic API Key"
      onChange={(e) => setApiKey(e.target.value)}
      onBlur={handleSave}
    />
  );
}
```

---

## 🎨 UI/UX 增强建议

### 1. 在 ManifestationSpace 中显示"今日待办"提示

```tsx
function ManifestationSpace({ analyses, onEnterVision, ... }) {
  // 计算今天所有愿景的总任务数
  const todayTotalTasks = analyses.reduce((sum, analysis) => {
    const daysSince = Math.floor((Date.now() - analysis.uploadedAt) / (1000 * 60 * 60 * 24));
    return sum + generateDailyTasks(analysis, daysSince).length;
  }, 0);

  return (
    <div className="manifestation-space">
      {/* Header 中添加提示 */}
      <div className="header">
        <h1>MANIFESTATION ROOM</h1>
        <div className="daily-reminder">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span>今日共有 {todayTotalTasks} 个显化任务待完成</span>
        </div>
      </div>
      {/* ... */}
    </div>
  );
}
```

### 2. 球体上显示完成度进度环

```tsx
function VisionOrb({ analysis }) {
  const daysSince = Math.floor((Date.now() - analysis.uploadedAt) / (1000 * 60 * 60 * 24));
  const tasks = generateDailyTasks(analysis, daysSince);
  const completed = tasks.filter(t => 
    localStorage.getItem(`task-${t.id}`) === 'done'
  ).length;
  const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

  return (
    <div className="vision-orb">
      <img src={analysis.imageUrl} />
      
      {/* 进度环 */}
      <svg className="progress-ring">
        <circle 
          cx="50%" 
          cy="50%" 
          r="45%" 
          stroke="url(#gradient)"
          strokeDasharray={`${progress * 2.8} 280`}
        />
      </svg>
      
      {/* 完成度标签 */}
      <div className="completion-badge">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
```

---

## 🔗 与现有 SOP 系统的数据流

```
用户上传图片
    ↓
[AI 分析] enhanced-analysis.tsx
    ↓
生成 VisionAnalysis 对象 {
  visualDNA: {...},
  lifestyleInference: {...},
  sopMapping: [  ← 🎯 关键：自动映射到 SOP 模块
    { module: "DAILY_ROUTINE", actions: [...] },
    { module: "物品库存管理", actions: [...] },
    { module: "Health 习惯追踪", actions: [...] }
  ]
}
    ↓
[每日任务生成] daily-manifestation.tsx
    ↓
根据 daysSinceUpload 动态生成任务
    ↓
用户在 ActionPlan 中查看并完成
    ↓
完成状态保存到 localStorage
    ↓
进度同步到 3D 空间的球体显示
```

---

## 📊 数据持久化方案

### LocalStorage 结构

```typescript
// 任务完成状态
localStorage.setItem('tasks-vision-123', JSON.stringify([
  'w1-inventory-1',
  'w1-inventory-2',
  'w2-morning-8'
]));

// 愿景分析结果（缓存）
localStorage.setItem('vision-analysis-vision-123', JSON.stringify({
  visualDNA: {...},
  sopMapping: {...}
}));

// 用户的 API Key（如果采用用户输入方式）
localStorage.setItem('anthropic_api_key', 'sk-ant-...');
```

---

## 🚀 部署检查清单

- [ ] 确认 Anthropic API Key 已配置
- [ ] 测试 AI 分析是否正常工作（上传测试图片）
- [ ] 验证每日任务生成逻辑（调整系统时间测试）
- [ ] 检查 LocalStorage 数据持久化
- [ ] 确保备用分析模板正常（当 API 失败时）
- [ ] 添加错误处理和用户提示

---

## 🎯 核心优势

| 功能 | 原版本 | 增强版本 |
|------|--------|---------|
| 图片分析 | 写死的 Mock 模板 | **真实 AI 视觉分析** |
| SOP 关联 | 手动配置 | **自动映射**到执行模块 |
| 任务系统 | 静态 30 天计划 | **动态生成**（基于天数） |
| 进度追踪 | 无 | **LocalStorage 持久化** |
| 五感触发 | 文字描述 | **可视化提醒** + 实践指导 |

---

## 🐛 常见问题

### Q1: API 调用失败怎么办？

**A:** `useVisionAnalysis` Hook 内置了备用方案：
```tsx
try {
  const aiResult = await analyzeVisionWithClaude(file);
  // ...
} catch (error) {
  // 自动使用 generateFallbackAnalysis()
  analyses.push(generateFallbackAnalysis(file, i));
}
```

### Q2: 如何自定义任务生成逻辑？

**A:** 修改 `daily-manifestation.tsx` 中的 `generateDailyTasks()` 函数：
```tsx
// 例如：调整 Week 1 的任务数量
if (daysSinceUpload <= 7) {
  // 从 1 个任务改为 2 个
  tasks.push(task1, task2);
}
```

### Q3: 可以接入其他 AI 模型吗？

**A:** 可以！修改 `analyzeVisionWithClaude()` 函数的 API endpoint：
```tsx
// 例如接入 OpenAI GPT-4 Vision
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  // ...
});
```

---

## 📞 支持

如有问题，请检查：
1. 浏览器控制台错误日志
2. Network 面板（查看 API 请求）
3. LocalStorage 数据是否正确存储

---

**🎉 集成完成后，你的 MANIFESTATION ROOM 将实现：**

✅ 从"静态愿景板"到"AI 驱动的可执行系统"  
✅ 从"手动映射 SOP"到"自动生成任务"  
✅ 从"30 天固定计划"到"动态每日指引"  
✅ 从"视觉刺激"到"五感全方位强化"  

**这不再是显化工具，而是真正的生活转化引擎。**
