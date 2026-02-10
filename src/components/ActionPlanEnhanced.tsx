import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Eye, 
  Palette, 
  Music, 
  Wind, 
  CheckCircle,
  Calendar,
  Target,
  Sparkles,
  Sun,
  Layers,
  Search,
  BookOpen,
  Activity,
  Box,
  PenTool,
  ExternalLink,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';
import type { VisionAnalysis } from '../App';
import { DailyManifestationDashboard } from './daily-manifestation';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ActionPlanProps {
  analysis: VisionAnalysis;
  onBack: () => void;
  allAnalyses: VisionAnalysis[];
}

type Tab = 'daily' | 'blueprint' | 'overview' | 'actions';

export function ActionPlanEnhanced({ analysis, onBack, allAnalyses }: ActionPlanProps) {
  const [activeTab, setActiveTab] = useState<Tab>('blueprint');
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNotionConfig, setShowNotionConfig] = useState(false);

  // Load completed actions from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`completed_actions_${analysis.id}`);
    if (saved) {
      setCompletedActions(new Set(JSON.parse(saved)));
    }
  }, [analysis.id]);

  // Save completed actions
  useEffect(() => {
    localStorage.setItem(`completed_actions_${analysis.id}`, JSON.stringify(Array.from(completedActions)));
  }, [completedActions, analysis.id]);

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

  const handleSyncToNotion = async () => {
    const notionKey = localStorage.getItem('notion_api_key');
    const pageId = localStorage.getItem('notion_page_id');

    if (!notionKey || !pageId) {
      setShowNotionConfig(true);
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-dcd239fe/sync-notion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-notion-key': notionKey,
          'x-notion-page-id': pageId
        },
        body: JSON.stringify({ analysis })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✨ Successfully synced to Notion! Check your page.');
      } else {
        alert(`Failed to sync: ${data.error}`);
        if (data.error?.includes('Unauthorized') || data.error?.includes('credentials')) {
            setShowNotionConfig(true);
        }
      }
    } catch (error) {
      console.error('Sync failed', error);
      alert('Network error while syncing to Notion.');
    } finally {
      setIsSyncing(false);
    }
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
            Back to Space
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
                <p className="text-neutral-400 mb-3 text-sm">Emotional Core</p>
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
                <p className="text-neutral-400 mb-3 text-sm">Visual DNA</p>
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
      <div className="flex-1 bg-neutral-950 flex flex-col relative">
        {/* Tabs */}
        <div className="border-b border-neutral-800 px-12 pt-8 flex justify-between items-end">
          <div className="flex gap-1">
            {[
              { id: 'blueprint' as Tab, label: 'SOP 拆解', icon: Layers },
              { id: 'daily' as Tab, label: '今日行动', icon: Sun },
              { id: 'overview' as Tab, label: '五感/价值', icon: Eye },
              { id: 'actions' as Tab, label: '30天路径', icon: Target },
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
          
          <div className="pb-2 flex gap-2">
             <button
               onClick={() => setShowNotionConfig(true)}
               className="p-2 text-neutral-500 hover:text-white transition-colors"
               title="Configure Notion"
             >
                <Settings className="w-5 h-5" />
             </button>
             <button
              onClick={handleSyncToNotion}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors border border-neutral-700 disabled:opacity-50"
            >
              {isSyncing ? (
                 <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                 <ExternalLink className="w-4 h-4" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync to Notion'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-12">
          <AnimatePresence mode="wait">
            {activeTab === 'blueprint' && (
               <BlueprintDeconstructionTab key="blueprint" analysis={analysis} />
            )}
            {activeTab === 'daily' && (
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <DailyManifestationDashboard 
                  analysis={analysis} 
                  completedTasks={completedActions}
                  onTaskComplete={toggleAction}
                />
              </motion.div>
            )}
            {activeTab === 'overview' && (
               <OverviewTab key="overview" analysis={analysis} />
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

        {/* Notion Config Modal */}
        {showNotionConfig && (
           <NotionConfigModal onClose={() => setShowNotionConfig(false)} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// Notion Config Modal
// ==========================================
function NotionConfigModal({ onClose }: { onClose: () => void }) {
    const [apiKey, setApiKey] = useState(localStorage.getItem('notion_api_key') || '');
    const [pageId, setPageId] = useState(localStorage.getItem('notion_page_id') || '');
    
    const handleSave = () => {
        localStorage.setItem('notion_api_key', apiKey);
        localStorage.setItem('notion_page_id', pageId);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl text-white font-light flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-400" />
                        Notion Integration
                    </h3>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-neutral-400 mb-2">Integration Token</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                            placeholder="secret_..."
                        />
                        <p className="text-xs text-neutral-600 mt-2">
                            Create an internal integration at <a href="https://www.notion.so/my-integrations" target="_blank" className="text-amber-500 hover:underline">developers.notion.com</a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-400 mb-2">Target Page ID</label>
                        <input 
                            type="text" 
                            value={pageId}
                            onChange={(e) => setPageId(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                            placeholder="e.g. 32-char UUID"
                        />
                        <p className="text-xs text-neutral-600 mt-2">
                            Copy the ID from the URL of the page where you want these tasks to appear.
                            <br/>
                            <span className="text-amber-500">Important:</span> You must "Add Connection" to this page in Notion.
                        </p>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ==========================================
// NEW: Blueprint Deconstruction Tab (User SOP Style)
// ==========================================

function BlueprintDeconstructionTab({ analysis }: { analysis: VisionAnalysis }) {
  const sopModules = analysis.sopMapping || [];

  // Categorize modules based on user's framework
  const groupedModules = {
    PLAN: sopModules.filter(m => m.module === 'WRITE_PLAN' || m.module === 'PLAN'),
    DO: sopModules.filter(m => m.module === 'DO'),
    CHECK: sopModules.filter(m => m.module === 'CHECK'),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl text-white mb-2 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            Notion SOP System Mapping
          </h3>
          <p className="text-neutral-400">
            AI has mapped your vision board to your "LIFE COMPASS" Notion system.
          </p>
        </div>
      </div>

      {/* PLAN SECTION */}
      <section>
        <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Step 1: Write & Plan (Inspiration & OKR)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedModules.PLAN.map((mod, i) => (
            <SOPCard key={i} module={mod} color="text-blue-400" bg="bg-blue-500/10" icon={PenTool} />
          ))}
        </div>
      </section>

      {/* DO SECTION */}
      <section>
        <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Step 2: Do (Execution & Routine)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedModules.DO.map((mod, i) => {
            // Determine icon based on subsystem
            let Icon = Activity;
            let color = "text-amber-400";
            if (mod.subSystem === 'Growth') { Icon = BookOpen; color = "text-pink-400"; }
            if (mod.subSystem === 'Inventory') { Icon = Box; color = "text-orange-400"; }
            
            return <SOPCard key={i} module={mod} color={color} bg="bg-neutral-900" icon={Icon} />;
          })}
        </div>
      </section>

      {/* CHECK SECTION */}
      <section>
        <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Step 3: Check (Review & Elevate)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedModules.CHECK.map((mod, i) => (
             <SOPCard key={i} module={mod} color="text-purple-400" bg="bg-purple-500/10" icon={CheckCircle} />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function SOPCard({ module, color, bg, icon: Icon }: { module: any, color: string, bg: string, icon: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${bg} border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h5 className={`font-medium ${color}`}>{module.subSystem || module.module}</h5>
        </div>
      </div>

      <div className="mb-3 bg-black/20 p-2 rounded text-xs text-neutral-400 italic">
        <span className="mr-1">🔍</span> {module.visualCue}
      </div>

      <ul className="space-y-2">
        {module.actions.map((action: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-neutral-500 flex-shrink-0" />
            {action}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}


// ==========================================
// Overview Tab (Values & Senses)
// ==========================================
function OverviewTab({ analysis }: { analysis: VisionAnalysis }) {
  const senses = [
    { 
      icon: Eye, 
      label: 'Visual', 
      value: `${analysis.visualDNA.lighting} / ${analysis.visualDNA.spatialFeeling}`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    { 
      icon: Music, 
      label: 'Auditory', 
      value: analysis.sensoryTriggers.sound,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    { 
      icon: Wind, 
      label: 'Olfactory', 
      value: analysis.sensoryTriggers.smell,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20'
    },
    { 
      icon: Palette, 
      label: 'Tactile', 
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
      className="space-y-8"
    >
      {/* Values Section */}
      <section>
        <h3 className="text-2xl text-white mb-4">Core Values</h3>
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

      {/* Senses Section */}
      <section>
        <h3 className="text-2xl text-white mb-4">Sensory Triggers</h3>
        <div className="space-y-4">
          {senses.map((sense, i) => {
            const Icon = sense.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`p-4 rounded-xl ${sense.bg} border ${sense.border} flex items-center gap-4`}
              >
                 <Icon className={`w-5 h-5 ${sense.color}`} />
                 <div>
                   <span className={`text-xs uppercase tracking-wider ${sense.color} block mb-1`}>{sense.label}</span>
                   <span className="text-neutral-300 text-sm">{sense.value}</span>
                 </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Materials */}
      <section>
        <h3 className="text-2xl text-white mb-4">Material Language</h3>
        <div className="flex flex-wrap gap-3">
          {analysis.visualDNA.materials.map((material, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
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

// ==========================================
// Actions Tab (30-Day Plan)
// ==========================================

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
        <h3 className="text-2xl text-white mb-2">30-Day Blueprint</h3>
        <p className="text-neutral-400">
          Deconstruct vision into concrete weekly action plans.
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
                <h4 className="text-lg text-white">Week {week.week}</h4>
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
                    {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
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
    </motion.div>
  );
}
