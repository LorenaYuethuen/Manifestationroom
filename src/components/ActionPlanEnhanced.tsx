import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles,
  Layers,
  Settings,
  ExternalLink,
  RefreshCw,
  X,
  Database,
  CheckSquare,
  Clock,
  LayoutGrid
} from 'lucide-react';
import type { VisionAnalysis } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { BASE_URL } from './api';

interface ActionPlanProps {
  analysis: VisionAnalysis;
  onBack: () => void;
  allAnalyses: VisionAnalysis[];
}

type Tab = 'sop' | 'database' | 'routine';

export function ActionPlanEnhanced({ analysis, onBack }: ActionPlanProps) {
  const [activeTab, setActiveTab] = useState<Tab>('sop');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNotionConfig, setShowNotionConfig] = useState(false);

  const handleSyncToNotion = async () => {
    const notionKey = localStorage.getItem('notion_api_key');
    const pageId = localStorage.getItem('notion_page_id');

    if (!notionKey || !pageId) {
      setShowNotionConfig(true);
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch(`${BASE_URL}/sync-notion`, {
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
        alert('✨ Successfully synced Vision Analysis to your Notion Page!');
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
    <div className="size-full flex bg-neutral-950 text-white font-sans selection:bg-amber-500/30">
      {/* Left Panel: Vision & Meta */}
      <div className="w-[400px] border-r border-neutral-800 flex flex-col bg-neutral-900/50">
        <div className="relative h-64 shrink-0">
          <img
            src={analysis.imageUrl}
            alt="Vision"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
          <button
            onClick={onBack}
            className="absolute top-6 left-6 p-2 rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-xs tracking-widest uppercase font-medium">Life Archetype</span>
          </div>
          <h1 className="text-3xl font-light mb-6 leading-tight">{analysis.visualDNA.archetype}</h1>

          <div className="space-y-6">
            <div>
              <h3 className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Core Values</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.lifestyleInference.values.map((v, i) => (
                  <span key={i} className="px-3 py-1 bg-neutral-800 rounded-lg text-sm text-neutral-300 border border-neutral-700">
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Material Palette</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.visualDNA.materials.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-neutral-800/50 rounded-lg text-sm text-neutral-400 border border-neutral-800">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Execution System */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Tabs */}
        <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-8 bg-neutral-900/30">
          <div className="flex gap-1 h-full pt-1">
             <TabButton active={activeTab === 'sop'} onClick={() => setActiveTab('sop')} icon={Layers} label="SOP 流程" />
             <TabButton active={activeTab === 'database'} onClick={() => setActiveTab('database')} icon={Database} label="Database 分发" />
             <TabButton active={activeTab === 'routine'} onClick={() => setActiveTab('routine')} icon={Clock} label="Daily Routine" />
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setShowNotionConfig(true)} className="p-2 text-neutral-500 hover:text-white transition-colors rounded-lg hover:bg-neutral-800">
                <Settings className="w-5 h-5" />
             </button>
             <button
               onClick={handleSyncToNotion}
               disabled={isSyncing}
               className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
               {isSyncing ? 'Syncing...' : 'Sync to Notion'}
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-neutral-950">
          <AnimatePresence mode="wait">
            {activeTab === 'sop' && <SOPView key="sop" analysis={analysis} />}
            {activeTab === 'database' && <DatabaseView key="db" analysis={analysis} />}
            {activeTab === 'routine' && <RoutineView key="routine" analysis={analysis} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Config Modal */}
      {showNotionConfig && <NotionConfigModal onClose={() => setShowNotionConfig(false)} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 flex items-center gap-2 h-full text-sm font-medium transition-all
        ${active ? 'text-white' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
      {active && <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
    </button>
  );
}

// ==========================================
// VIEWS
// ==========================================

function SOPView({ analysis }: { analysis: VisionAnalysis }) {
  const sop = analysis.sopMapping;
  const stages = ['WRITE_PLAN', 'PLAN', 'DO', 'CHECK'];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
           <Layers className="w-6 h-6 text-blue-400" />
        </div>
        <div>
           <h2 className="text-xl font-light text-white">SOP Execution Framework</h2>
           <p className="text-neutral-500 text-sm">Vision → Plan → Execution → Review</p>
        </div>
      </div>

      <div className="grid gap-6">
         {stages.map((stage) => {
            const items = sop.filter(i => i.module === stage);
            if (items.length === 0) return null;

            let color = "border-neutral-800 bg-neutral-900/30";
            if (stage === 'WRITE_PLAN') color = "border-blue-900/30 bg-blue-900/10";
            if (stage === 'PLAN') color = "border-purple-900/30 bg-purple-900/10";
            if (stage === 'DO') color = "border-amber-900/30 bg-amber-900/10";
            if (stage === 'CHECK') color = "border-red-900/30 bg-red-900/10";

            return (
              <div key={stage} className={`rounded-xl border ${color} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded text-white/70">{stage}</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-amber-500">{item.subSystem}</span>
                          <span className="text-xs text-neutral-600 italic">{item.visualCue}</span>
                       </div>
                       <ul className="space-y-2">
                          {item.actions.map((action, ai) => (
                             <li key={ai} className="flex items-start gap-2 text-sm text-neutral-300">
                                <CheckSquare className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                                {action}
                             </li>
                          ))}
                       </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
         })}
      </div>
    </motion.div>
  );
}

function DatabaseView({ analysis }: { analysis: VisionAnalysis }) {
  // Group actions by target database (subSystem)
  const dbMap: Record<string, string[]> = {};
  analysis.sopMapping.forEach(item => {
     if (!dbMap[item.subSystem]) dbMap[item.subSystem] = [];
     dbMap[item.subSystem].push(...item.actions);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
           <Database className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
           <h2 className="text-xl font-light text-white">Database Distribution</h2>
           <p className="text-neutral-500 text-sm">Automatically sorting tasks into your Life Compass databases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {Object.entries(dbMap).map(([dbName, actions]) => (
            <div key={dbName} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors">
               <div className="p-4 border-b border-neutral-800 bg-neutral-800/30 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-neutral-400" />
                  <h3 className="font-medium text-white">{dbName}</h3>
               </div>
               <div className="p-4">
                  <ul className="space-y-3">
                     {actions.map((act, i) => (
                        <li key={i} className="text-sm text-neutral-400 flex items-start gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" />
                           {act}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         ))}
      </div>
    </motion.div>
  );
}

function RoutineView({ analysis }: { analysis: VisionAnalysis }) {
  const rituals = analysis.lifestyleInference.dailyRituals;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
           <Clock className="w-6 h-6 text-amber-400" />
        </div>
        <div>
           <h2 className="text-xl font-light text-white">Daily Routine Integration</h2>
           <p className="text-neutral-500 text-sm">Embedding vision habits into your daily flow</p>
        </div>
      </div>

      <div className="relative">
         <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-800" />
         
         <div className="space-y-8">
            {rituals.map((ritual, i) => {
               let time = "Anytime";
               let icon = "☀️";
               if (ritual.includes('晨') || ritual.includes('早') || ritual.includes('Morning')) { time = "Morning"; icon = "🌅"; }
               else if (ritual.includes('晚') || ritual.includes('睡') || ritual.includes('Night')) { time = "Evening"; icon = "🌙"; }
               else if (ritual.includes('午') || ritual.includes('Work')) { time = "Workday"; icon = "⚡"; }

               return (
                  <motion.div 
                     key={i}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="relative pl-16"
                  >
                     <div className="absolute left-3 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs">
                        {icon}
                     </div>
                     
                     <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 hover:border-amber-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{time}</span>
                           <span className="text-xs text-neutral-600">Daily Ritual</span>
                        </div>
                        <h4 className="text-lg text-white font-light">{ritual}</h4>
                     </div>
                  </motion.div>
               );
            })}
         </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// Config Modal
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
                        Notion Connection
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
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder="secret_..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-neutral-400 mb-2">Target Page ID</label>
                        <input 
                            type="text" 
                            value={pageId}
                            onChange={(e) => setPageId(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder="e.g. 3030dfc8..."
                        />
                        <p className="text-xs text-neutral-600 mt-2">
                           Copy the ID from your LIFE COMPASS page URL.
                        </p>
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-amber-900/20"
                    >
                        Save & Connect
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
