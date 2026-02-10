import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Eye, 
  Palette, 
  Music, 
  Wind, 
  Coffee, 
  Check,
  Calendar,
  Target,
  Sparkles
} from 'lucide-react';
import type { VisionAnalysis } from '../App';

interface ActionPlanProps {
  analysis: VisionAnalysis;
  onBack: () => void;
  allAnalyses: VisionAnalysis[];
}

type Tab = 'overview' | 'senses' | 'actions';

export function ActionPlan({ analysis, onBack, allAnalyses }: ActionPlanProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const toggleAction = (actionKey: string) => {
    setCompletedActions(prev => {
      const next = new Set(prev);
      if (next.has(actionKey)) {
        next.delete(actionKey);
      } else {
        next.add(actionKey);
      }
      return next;
    });
  };

  return (
    <div className="size-full flex">
      {/* Left Panel - Image & Overview */}
      <div className="w-2/5 relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={analysis.imageUrl}
            alt="Vision"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col p-12">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-300 hover:text-white mb-8
                     transition-colors w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            返回显化空间
          </button>

          {/* Archetype */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-amber-400" />
                <span className="text-amber-400 text-sm tracking-widest uppercase">
                  Life Archetype
                </span>
              </div>
              
              <h1 className="text-5xl text-white font-light mb-6 leading-tight">
                {analysis.visualDNA.archetype}
              </h1>

              <p className="text-xl text-neutral-300 mb-8 leading-relaxed">
                {analysis.lifestyleInference.pace}
              </p>

              {/* Emotional Core */}
              <div className="mb-8">
                <p className="text-neutral-400 mb-3 text-sm">情感核心</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.visualDNA.emotionalCore.map((emotion, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm 
                               text-white border border-white/20"
                    >
                      {emotion}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <p className="text-neutral-400 mb-3 text-sm">视觉DNA</p>
                <div className="flex gap-3">
                  {analysis.visualDNA.colorPalette.slice(0, 4).map((color, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="w-14 h-14 rounded-xl border-2 border-white/30 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Panel - Tabs & Content */}
      <div className="flex-1 bg-neutral-950 flex flex-col">
        {/* Tabs */}
        <div className="border-b border-neutral-800 px-12 pt-8">
          <div className="flex gap-1">
            {[
              { id: 'overview' as Tab, label: '核心价值', icon: Eye },
              { id: 'senses' as Tab, label: '五感触发器', icon: Music },
              { id: 'actions' as Tab, label: '显化路径', icon: Target },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all
                    ${activeTab === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab key="overview" analysis={analysis} />
            )}
            {activeTab === 'senses' && (
              <SensesTab key="senses" analysis={analysis} />
            )}
            {activeTab === 'actions' && (
              <ActionsTab 
                key="actions" 
                analysis={analysis}
                completedActions={completedActions}
                onToggleAction={toggleAction}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ analysis }: { analysis: VisionAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Values */}
      <section>
        <h3 className="text-2xl text-white mb-4">核心价值观</h3>
        <div className="grid grid-cols-2 gap-4">
          {analysis.lifestyleInference.values.map((value, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-neutral-900 border border-neutral-800"
            >
              <p className="text-neutral-300">{value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Daily Rituals */}
      <section>
        <h3 className="text-2xl text-white mb-4">日常仪式</h3>
        <div className="space-y-3">
          {analysis.lifestyleInference.dailyRituals.map((ritual, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Coffee className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-neutral-300 flex-1">{ritual}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Materials */}
      <section>
        <h3 className="text-2xl text-white mb-4">材质语言</h3>
        <div className="flex flex-wrap gap-3">
          {analysis.visualDNA.materials.map((material, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-neutral-400 border border-neutral-800"
            >
              {material.replace(/_/g, ' ')}
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

// Senses Tab
function SensesTab({ analysis }: { analysis: VisionAnalysis }) {
  const senses = [
    { 
      icon: Eye, 
      label: '视觉', 
      value: `${analysis.visualDNA.lighting} / ${analysis.visualDNA.spatialFeeling}`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    { 
      icon: Music, 
      label: '听觉', 
      value: analysis.sensoryTriggers.sound,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    { 
      icon: Wind, 
      label: '嗅觉', 
      value: analysis.sensoryTriggers.smell,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20'
    },
    { 
      icon: Palette, 
      label: '触觉', 
      value: analysis.sensoryTriggers.touch,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="mb-8">
        <h3 className="text-2xl text-white mb-2">五感触发器</h3>
        <p className="text-neutral-400">
          通过多感官体验深化愿景记忆，建立虚拟与现实的连接桥梁
        </p>
      </div>

      {senses.map((sense, i) => {
        const Icon = sense.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`p-6 rounded-2xl ${sense.bg} border ${sense.border}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${sense.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${sense.color}`} />
              </div>
              
              <div className="flex-1">
                <h4 className={`text-lg mb-2 ${sense.color}`}>{sense.label}</h4>
                <p className="text-neutral-300 leading-relaxed">{sense.value}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Integration Note */}
      <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <h4 className="text-amber-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          现实整合建议
        </h4>
        <ul className="space-y-2 text-neutral-300">
          <li>• 在家中准备对应的气味元素（香薰、香料等）</li>
          <li>• 创建专属播放列表，匹配听觉触发器</li>
          <li>• 购置符合材质语言的物品，强化触觉记忆</li>
          <li>• 调整家中照明，复现理想的光线氛围</li>
        </ul>
      </div>
    </motion.div>
  );
}

// Actions Tab
function ActionsTab({ 
  analysis,
  completedActions,
  onToggleAction
}: { 
  analysis: VisionAnalysis;
  completedActions: Set<string>;
  onToggleAction: (key: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="mb-8">
        <h3 className="text-2xl text-white mb-2">30天显化路径</h3>
        <p className="text-neutral-400">
          将愿景分解为具体可执行的周行动计划
        </p>
      </div>

      {/* Weekly Plans */}
      {analysis.manifestationPath.map((week, weekIndex) => (
        <motion.div
          key={weekIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: weekIndex * 0.1 }}
          className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden"
        >
          <div className="p-6 border-b border-neutral-800 bg-gradient-to-r from-amber-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h4 className="text-lg text-white">第 {week.week} 周</h4>
                <p className="text-neutral-400 text-sm">{week.focus}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {week.actions.map((action, actionIndex) => {
              const actionKey = `week-${weekIndex}-action-${actionIndex}`;
              const isCompleted = completedActions.has(actionKey);

              return (
                <motion.button
                  key={actionIndex}
                  onClick={() => onToggleAction(actionKey)}
                  whileHover={{ x: 4 }}
                  className={`
                    w-full flex items-start gap-4 p-4 rounded-xl text-left
                    transition-all duration-200
                    ${isCompleted 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-neutral-800/50 border border-neutral-700 hover:border-neutral-600'
                    }
                  `}
                >
                  <div className={`
                    w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-neutral-600'
                    }
                  `}>
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  <p className={`
                    flex-1 transition-all
                    ${isCompleted 
                      ? 'text-neutral-400 line-through' 
                      : 'text-neutral-200'
                    }
                  `}>
                    {action}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* SOP Mapping */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6">
        <h4 className="text-lg text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          SOP 系统整合
        </h4>
        
        <div className="space-y-3">
          {analysis.sopMapping.map((sop, i) => (
            <div key={i} className="p-4 rounded-xl bg-neutral-800/50">
              <p className="text-amber-400 mb-2 text-sm font-medium">{sop.module}</p>
              <ul className="space-y-1 text-sm text-neutral-300">
                {sop.actions.map((action, j) => (
                  <li key={j}>• {action}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}