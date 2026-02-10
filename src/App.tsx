import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { UploadStage } from './components/UploadStage';
import { AnalysisStageEnhanced } from './components/AnalysisStageEnhanced';
import { ManifestationSpace } from './components/ManifestationSpace';
import { ActionPlanEnhanced } from './components/ActionPlanEnhanced';
import { motion, AnimatePresence } from 'motion/react';
import type { VisionAnalysis } from './components/enhanced-analysis';

// Re-export type for other components if needed
export type { VisionAnalysis };

export type AppStage = 'upload' | 'analysis' | 'manifestation' | 'action';

const STORAGE_KEY = 'manifestation_room_visions';

export default function App() {
  const [stage, setStage] = useState<AppStage>('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<VisionAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VisionAnalysis | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-inject the provided API key if not present
  useEffect(() => {
    const existingKey = localStorage.getItem('gemini_api_key');
    if (!existingKey) {
      // Injecting the key provided by the user
      localStorage.setItem('gemini_api_key', 'AIzaSyCgZDFvhto6tXNlMjKupebjipgwbE-oAPE');
    }
  }, []);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAnalyses(parsed);
        if (parsed.length > 0) {
          setStage('manifestation');
        }
      } catch (e) {
        console.error('Failed to load stored visions:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (analyses.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    }
  }, [analyses]);

  const handleImagesUploaded = (files: File[]) => {
    setUploadedImages(files);
    setStage('analysis');
  };

  const handleAnalysisComplete = (analysisResults: VisionAnalysis[]) => {
    setAnalyses(prev => {
      const combined = [...prev, ...analysisResults];
      return detectRelations(combined);
    });
    setStage('manifestation');
  };

  const handleEnterVision = (analysis: VisionAnalysis) => {
    setSelectedAnalysis(analysis);
    setStage('action');
  };

  const handleBackToSpace = () => {
    setSelectedAnalysis(null);
    setStage('manifestation');
  };

  const handleRestart = () => {
    setUploadedImages([]);
    setSelectedAnalysis(null);
    setStage('upload');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all manifestation records? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      setAnalyses([]);
      setUploadedImages([]);
      setSelectedAnalysis(null);
      setStage('upload');
    }
  };

  return (
    <div className="size-full relative overflow-hidden bg-[#050505]">
      {/* Settings Button */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {stage === 'upload' && (
        <UploadStage 
          onImagesUploaded={handleImagesUploaded}
          existingCount={analyses.length}
        />
      )}
      
      {stage === 'analysis' && (
        <AnalysisStageEnhanced 
          images={uploadedImages}
          onAnalysisComplete={handleAnalysisComplete}
          existingAnalyses={analyses}
        />
      )}
      
      {stage === 'manifestation' && (
        <ManifestationSpace 
          analyses={analyses}
          onEnterVision={handleEnterVision}
          onRestart={handleRestart}
          onClearAll={handleClearAll}
        />
      )}
      
      {stage === 'action' && selectedAnalysis && (
        <ActionPlanEnhanced 
          analysis={selectedAnalysis}
          onBack={handleBackToSpace}
          allAnalyses={analyses}
        />
      )}
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    const cKey = localStorage.getItem('anthropic_api_key');
    const gKey = localStorage.getItem('gemini_api_key');
    if (cKey) setClaudeKey(cKey);
    if (gKey) setGeminiKey(gKey);
  }, []);

  const handleSave = () => {
    // Trim keys to remove accidental whitespace/semicolons
    const cleanClaude = claudeKey.trim().replace(/；/g, '').replace(/;/g, '');
    const cleanGemini = geminiKey.trim().replace(/；/g, '').replace(/;/g, '');

    localStorage.setItem('anthropic_api_key', cleanClaude);
    localStorage.setItem('gemini_api_key', cleanGemini);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-neutral-900 rounded-2xl p-6 border border-neutral-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl text-white">AI Engine Settings</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Gemini Settings */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Google Gemini API Key (Priority)
            </label>
            <input 
              type="password" 
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-xs text-neutral-500 mt-2">
              Faster and often free for personal use. Starts with "AIza".
            </p>
          </div>

          {/* Claude Settings */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Anthropic API Key (Claude)
            </label>
            <input 
              type="password" 
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-xs text-neutral-500 mt-2">
              High quality reasoning. Starts with "sk-ant".
            </p>
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full bg-amber-500 text-black font-medium py-3 rounded-lg hover:bg-amber-400 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function detectRelations(analyses: VisionAnalysis[]): VisionAnalysis[] {
  return analyses.map((analysis, index) => {
    const related: string[] = [];
    
    analyses.forEach((other, otherIndex) => {
      if (index === otherIndex) return;
      
      let similarity = 0;
      
      const sharedColors = analysis.visualDNA.colorPalette.filter(color =>
        other.visualDNA.colorPalette.includes(color)
      );
      similarity += sharedColors.length * 0.2;
      
      const sharedEmotions = analysis.visualDNA.emotionalCore.filter(emotion =>
        other.visualDNA.emotionalCore.includes(emotion)
      );
      similarity += sharedEmotions.length * 0.3;
      
      const sharedValues = analysis.lifestyleInference.values.filter(value =>
        other.lifestyleInference.values.includes(value)
      );
      similarity += sharedValues.length * 0.3;
      
      if (similarity >= 0.5) {
        related.push(other.id);
      }
    });
    
    return {
      ...analysis,
      relatedVisions: related,
    };
  });
}
