import { useState, useEffect } from 'react';
import { UploadStage } from './components/UploadStage';
import { AnalysisStage } from './components/AnalysisStage';
import { ManifestationSpace } from './components/ManifestationSpace';
import { ActionPlan } from './components/ActionPlan';

export type VisionAnalysis = {
  id: string;
  imageUrl: string;
  uploadedAt: number; // 添加时间戳
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
    taste?: string;
  };
  sopMapping: {
    module: string;
    actions: string[];
  }[];
  manifestationPath: {
    week: number;
    focus: string;
    actions: string[];
  }[];
  relatedVisions?: string[]; // 关联的其他愿景ID
};

export type AppStage = 'upload' | 'analysis' | 'manifestation' | 'action';

const STORAGE_KEY = 'manifestation_room_visions';

export default function App() {
  const [stage, setStage] = useState<AppStage>('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<VisionAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VisionAnalysis | null>(null);

  // 从 localStorage 加载历史数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAnalyses(parsed);
        // 如果有历史数据，直接进入显化空间
        if (parsed.length > 0) {
          setStage('manifestation');
        }
      } catch (e) {
        console.error('Failed to load stored visions:', e);
      }
    }
  }, []);

  // 保存到 localStorage
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
    // 合并新分析结果到现有数据，而不是替换
    setAnalyses(prev => {
      const combined = [...prev, ...analysisResults];
      // 自动检测关联关系
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
    // 改为"继续添加"而不是清空所有数据
    setUploadedImages([]);
    setSelectedAnalysis(null);
    setStage('upload');
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有显化记录吗？此操作无法撤销。')) {
      localStorage.removeItem(STORAGE_KEY);
      setAnalyses([]);
      setUploadedImages([]);
      setSelectedAnalysis(null);
      setStage('upload');
    }
  };

  return (
    <div className="size-full relative overflow-hidden bg-[#050505]">
      {stage === 'upload' && (
        <UploadStage 
          onImagesUploaded={handleImagesUploaded}
          existingCount={analyses.length}
        />
      )}
      
      {stage === 'analysis' && (
        <AnalysisStage 
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
        <ActionPlan 
          analysis={selectedAnalysis}
          onBack={handleBackToSpace}
          allAnalyses={analyses}
        />
      )}
    </div>
  );
}

// 自动检测愿景之间的关联关系
function detectRelations(analyses: VisionAnalysis[]): VisionAnalysis[] {
  return analyses.map((analysis, index) => {
    const related: string[] = [];
    
    analyses.forEach((other, otherIndex) => {
      if (index === otherIndex) return;
      
      let similarity = 0;
      
      // 检查颜色相似度
      const sharedColors = analysis.visualDNA.colorPalette.filter(color =>
        other.visualDNA.colorPalette.includes(color)
      );
      similarity += sharedColors.length * 0.2;
      
      // 检查情感核心相似度
      const sharedEmotions = analysis.visualDNA.emotionalCore.filter(emotion =>
        other.visualDNA.emotionalCore.includes(emotion)
      );
      similarity += sharedEmotions.length * 0.3;
      
      // 检查价值观相似度
      const sharedValues = analysis.lifestyleInference.values.filter(value =>
        other.lifestyleInference.values.includes(value)
      );
      similarity += sharedValues.length * 0.3;
      
      // 如果相似度超过阈值，认为相关
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