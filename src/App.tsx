import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  LayoutGrid, 
  Settings, 
  Zap, 
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  User,
  LogOut,
  Moon,
  Sun,
  Loader2,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { useVisionAnalysis } from './components/enhanced-analysis';
import { ActionPlanEnhanced } from './components/ActionPlanEnhanced';
import { saveVision, getVisions, uploadImage, deleteVision } from './components/api';
import type { VisionAnalysis } from './App';

// ==========================================
// Types
// ==========================================

export interface VisionAnalysis {
  id: string;
  imageUrl: string;
  uploadedAt: number;
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
    subSystem: string;
    visualCue: string;
    actions: string[];
  }[];
  manifestationPath: {
    week: number;
    focus: string;
    actions: string[];
  }[];
}

type ViewMode = 'dashboard' | 'create' | 'detail' | 'settings';

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedVision, setSelectedVision] = useState<VisionAnalysis | null>(null);
  const [visions, setVisions] = useState<VisionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { analyzeImages, isAnalyzing } = useVisionAnalysis();

  // Responsive Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AUTO-CONFIG: Bootstrap API Keys provided by user
  // (Deprecated: Moving to Server-Side Keys)
  useEffect(() => {
     // Optional: Clear old keys to avoid confusion
     localStorage.removeItem('gemini_api_key');
     localStorage.removeItem('anthropic_api_key'); 
  }, []);

  // Fetch Data on Load
  useEffect(() => {
    loadVisions();
  }, []);

  const loadVisions = async () => {
    try {
      const data = await getVisions();
      setVisions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this vision?")) return;
    try {
      await deleteVision(id);
      setVisions(prev => prev.filter(v => v.id !== id));
      if (selectedVision?.id === id) {
        setSelectedVision(null);
        setView('dashboard');
      }
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const handleCreate = async (file: File) => {
    try {
      setLoading(true);
      // 1. Upload Image First
      const publicUrl = await uploadImage(file);
      
      // 2. Analyze (Mocking file object for analysis since we just uploaded it)
      const results = await analyzeImages([file]);
      const result = results[0];
      
      // 3. Update result with permanent URL
      const finalResult = { ...result, imageUrl: publicUrl };
      
      // 4. Save to DB
      await saveVision(finalResult);
      
      setVisions(prev => [finalResult, ...prev]);
      setSelectedVision(finalResult);
      setView('detail');
    } catch (e) {
      alert("Error creating vision: " + e.message);
    }
  };
  
  // For Demo Button
  const handleDemoCreate = async () => {
    // Creating a dummy file for the mock analyzer
    const dummyFile = new File([""], "My_Vision_Board_Demo.png", { type: "image/png" });
    const results = await analyzeImages([dummyFile]);
    const result = results[0];
    
    // Use a placeholder image for demo since we don't upload the dummy file
    result.imageUrl = "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
    
    await saveVision(result);
    setVisions(prev => [result, ...prev]);
    setSelectedVision(result);
    setView('detail');
  };

  // Layout Render
  const Content = () => (
    <div className="h-full w-full bg-neutral-950 text-white overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <DashboardView 
            visions={visions} 
            loading={loading}
            onSelect={(v) => { setSelectedVision(v); setView('detail'); }}
            onCreate={() => setView('create')}
            onDelete={handleDelete}
            isMobile={isMobile}
          />
        )}
        {view === 'create' && (
          <CreateView 
            isAnalyzing={isAnalyzing} 
            onUpload={handleCreate} 
            onDemo={handleDemoCreate}
            onBack={() => setView('dashboard')} 
          />
        )}
        {view === 'detail' && selectedVision && (
          <ActionPlanEnhanced 
            analysis={selectedVision} 
            onBack={() => setView('dashboard')} 
            allAnalyses={visions} 
          />
        )}
        {view === 'settings' && <SettingsView onBack={() => setView('dashboard')} />}
      </AnimatePresence>
    </div>
  );

  return isMobile ? (
    <MobileLayout currentView={view} setView={setView}>
      <Content />
    </MobileLayout>
  ) : (
    <DesktopLayout currentView={view} setView={setView}>
      <Content />
    </DesktopLayout>
  );
}

// ==========================================
// Views
// ==========================================

function DashboardView({ visions, loading, onSelect, onCreate, onDelete, isMobile }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-6 overflow-y-auto"
    >
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Manifestation Room</h1>
          <p className="text-neutral-500 mt-1">Your vision, structurally aligned.</p>
        </div>
        {!isMobile && (
          <button 
            onClick={onCreate}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl transition-all shadow-lg shadow-amber-900/20 font-medium"
          >
            <Plus className="w-5 h-5" />
            New Vision
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
        </div>
      ) : visions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500 space-y-4">
          <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-neutral-700" />
          </div>
          <p className="text-lg">No visions manifested yet.</p>
          <button onClick={onCreate} className="text-amber-500 hover:underline">Start your first creation</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visions.map((v: VisionAnalysis) => (
            <motion.div
              key={v.id}
              layoutId={v.id}
              onClick={() => onSelect(v)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all"
              whileHover={{ y: -5 }}
            >
              <img src={v.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => onDelete(e, v.id)}
                  className="p-2 bg-black/50 backdrop-blur rounded-full hover:bg-red-500/50 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-xs text-amber-500 font-medium tracking-wider uppercase mb-2 block">
                  {v.visualDNA.archetype}
                </span>
                <div className="flex flex-wrap gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  {v.visualDNA.emotionalCore.slice(0, 2).map((e, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-white/10 backdrop-blur rounded-full text-white/80">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CreateView({ isAnalyzing, onUpload, onDemo, onBack }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center relative"
    >
      <button onClick={onBack} className="absolute top-8 left-8 p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-4xl font-light mb-4">New Manifestation</h2>
          <p className="text-neutral-400">Upload your vision board to extract its DNA and generate your life compass.</p>
        </div>

        {isAnalyzing ? (
          <div className="py-12 flex flex-col items-center space-y-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-t-2 border-amber-500/50 rounded-full animate-spin-reverse"></div>
            </div>
            <p className="text-amber-500 animate-pulse">Deconstructing Reality...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block w-full aspect-video rounded-3xl border-2 border-dashed border-neutral-700 hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
              />
              <div className="p-4 bg-neutral-800 rounded-full group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-neutral-400 group-hover:text-amber-500" />
              </div>
              <span className="text-neutral-500 group-hover:text-amber-400">Click to upload Image</span>
            </label>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800"></div></div>
              <div className="relative flex justify-center"><span className="bg-neutral-950 px-4 text-sm text-neutral-600">OR</span></div>
            </div>

            <button 
              onClick={onDemo}
              className="w-full py-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Use Demo Vision
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SettingsView({ onBack }: any) {
  const [keys, setKeys] = useState({
    notion: localStorage.getItem('notion_api_key') || '',
    page: localStorage.getItem('notion_page_id') || '',
    anthropic: localStorage.getItem('anthropic_api_key') || ''
  });

  const save = () => {
    localStorage.setItem('notion_api_key', keys.notion);
    localStorage.setItem('notion_page_id', keys.page);
    localStorage.setItem('anthropic_api_key', keys.anthropic);
    alert("Settings Saved");
    onBack();
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack}><X className="w-6 h-6 text-neutral-500" /></button>
        <h2 className="text-2xl">Settings</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-neutral-500">Notion Integration Token</label>
          <input type="password" value={keys.notion} onChange={e => setKeys({...keys, notion: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-neutral-500">Notion Page ID</label>
          <input type="text" value={keys.page} onChange={e => setKeys({...keys, page: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl" />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-neutral-500">Anthropic API Key (Optional)</label>
          <input 
            type="password" 
            placeholder="sk-..."
            value={keys.anthropic} 
            onChange={e => setKeys({...keys, anthropic: e.target.value})} 
            className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl" 
          />
          <p className="text-xs text-neutral-500">If provided, system will prioritize Claude. If failed/missing, falls back to server-side Qwen.</p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-sm">
           <p className="font-medium">⚡ Dual-Engine AI System</p>
           <ul className="list-disc pl-4 mt-1 opacity-80 space-y-1">
             <li>Primary: Claude 3.5 Sonnet (User Key)</li>
             <li>Secondary: ModelScope Qwen (Server Key)</li>
             <li>Fallback: Simulation Mode</li>
           </ul>
        </div>

        <button onClick={save} className="w-full py-3 bg-white text-black rounded-xl font-medium mt-8 hover:bg-neutral-200">Save Changes</button>
      </div>
    </div>
  );
}


// ==========================================
// Layouts
// ==========================================

function DesktopLayout({ children, currentView, setView }: any) {
  return (
    <div className="flex h-screen w-full bg-black text-white selection:bg-amber-500/30 font-sans">
      {/* Sidebar */}
      <nav className="w-20 lg:w-64 border-r border-neutral-800 flex flex-col bg-neutral-950 p-4">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="hidden lg:block font-bold tracking-tight text-lg">MANIFITION</span>
        </div>

        <div className="flex-1 space-y-1">
          <NavItem active={currentView === 'dashboard'} icon={LayoutGrid} label="Dashboard" onClick={() => setView('dashboard')} />
          <NavItem active={currentView === 'create'} icon={Plus} label="New Vision" onClick={() => setView('create')} />
          <NavItem active={currentView === 'settings'} icon={Settings} label="Settings" onClick={() => setView('settings')} />
        </div>

        <div className="mt-auto pt-4 border-t border-neutral-800">
           <div className="flex items-center gap-3 px-3 py-2 text-neutral-500 hover:text-white cursor-pointer transition-colors">
              <User className="w-5 h-5" />
              <span className="hidden lg:block text-sm">User</span>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function MobileLayout({ children, currentView, setView }: any) {
  return (
    <div className="flex flex-col h-screen w-full bg-black text-white">
      {/* Content */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="h-16 border-t border-neutral-800 bg-neutral-950 flex items-center justify-around px-2 z-50 shrink-0 safe-area-bottom">
        <MobileNavItem active={currentView === 'dashboard'} icon={LayoutGrid} label="Home" onClick={() => setView('dashboard')} />
        <div className="relative -top-5">
           <button 
             onClick={() => setView('create')}
             className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/40 text-white"
           >
             <Plus className="w-7 h-7" />
           </button>
        </div>
        <MobileNavItem active={currentView === 'settings'} icon={Settings} label="Config" onClick={() => setView('settings')} />
      </nav>
    </div>
  );
}

function NavItem({ active, icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
        ${active ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'}
      `}
    >
      <Icon className={`w-5 h-5 transition-colors ${active ? 'text-amber-500' : 'group-hover:text-amber-500/50'}`} />
      <span className="hidden lg:block font-medium text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 hidden lg:block" />}
    </button>
  );
}

function MobileNavItem({ active, icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 p-2 rounded-xl transition-colors
        ${active ? 'text-white' : 'text-neutral-600'}
      `}
    >
      <Icon className={`w-6 h-6 ${active ? 'text-amber-500' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
