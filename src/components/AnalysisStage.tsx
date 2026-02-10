import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Palette, Heart, Sparkles, Eye, Music, Wind } from 'lucide-react';
import type { VisionAnalysis } from '../App';

interface AnalysisStageProps {
  images: File[];
  onAnalysisComplete: (analyses: VisionAnalysis[]) => void;
  existingAnalyses: VisionAnalysis[];
}

const analysisSteps = [
  { icon: Eye, label: '视觉DNA提取', duration: 2000 },
  { icon: Palette, label: '色彩与材质分析', duration: 1500 },
  { icon: Heart, label: '情感能量识别', duration: 1800 },
  { icon: Brain, label: '生活方式推断', duration: 2200 },
  { icon: Music, label: '五感触发器生成', duration: 1600 },
  { icon: Sparkles, label: '显化路径构建', duration: 2000 },
];

export function AnalysisStage({ images, onAnalysisComplete, existingAnalyses }: AnalysisStageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate analysis process
    const totalSteps = analysisSteps.length;
    const totalImages = images.length;
    
    let stepIndex = 0;
    let imageIndex = 0;

    const runAnalysis = () => {
      const step = analysisSteps[stepIndex];
      
      setCurrentStep(stepIndex);
      setCurrentImageIndex(imageIndex);
      
      const progressIncrement = 100 / (totalSteps * totalImages);
      
      setTimeout(() => {
        setProgress(prev => Math.min(prev + progressIncrement, 100));
        
        stepIndex++;
        if (stepIndex >= totalSteps) {
          stepIndex = 0;
          imageIndex++;
          
          if (imageIndex >= totalImages) {
            // Analysis complete - generate mock data
            setTimeout(() => {
              const mockAnalyses = generateMockAnalyses(images, existingAnalyses);
              onAnalysisComplete(mockAnalyses);
            }, 500);
            return;
          }
        }
        
        runAnalysis();
      }, step.duration);
    };

    runAnalysis();
  }, [images, onAnalysisComplete, existingAnalyses]);

  const currentImage = images[currentImageIndex];
  const currentStepData = analysisSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="size-full flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl text-white font-light mb-4">
            AI 深度分析中
          </h2>
          <p className="text-neutral-400">
            正在分析第 {currentImageIndex + 1} / {images.length} 张图片
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          {/* Image Preview */}
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-900"
          >
            <img
              src={URL.createObjectURL(currentImage)}
              alt="Analyzing"
              className="w-full h-full object-cover"
            />
            
            {/* Scanning effect */}
            <motion.div
              animate={{ y: ['0%', '100%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50"
            />

            {/* Corner brackets */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400" />
            </div>
          </motion.div>

          {/* Analysis Steps */}
          <div className="flex flex-col justify-center space-y-6">
            <AnimatePresence mode="wait">
              {analysisSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep || currentImageIndex > 0;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: isActive ? 1 : isComplete ? 0.5 : 0.3,
                      x: 0,
                      scale: isActive ? 1.05 : 1
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      flex items-center gap-4 p-4 rounded-2xl
                      ${isActive ? 'bg-amber-500/10 border-2 border-amber-500/30' : 'bg-neutral-900/30'}
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${isActive ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-500'}
                      transition-all duration-300
                    `}>
                      <StepIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <p className={`
                        ${isActive ? 'text-white' : 'text-neutral-500'}
                        transition-colors duration-300
                      `}>
                        {step.label}
                      </p>
                    </div>

                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex gap-1"
                      >
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2
                            }}
                            className="w-2 h-2 rounded-full bg-amber-400"
                          />
                        ))}
                      </motion.div>
                    )}

                    {isComplete && !isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <span className="text-white text-xs">✓</span>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-neutral-400">
            <span>整体进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Particles */}
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 10,
                opacity: 0
              }}
              animate={{
                y: -10,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'linear'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock analysis generation
function generateMockAnalyses(images: File[], existingAnalyses: VisionAnalysis[]): VisionAnalysis[] {
  const archetypes = [
    {
      archetype: 'Mediterranean Elegance',
      colors: ['#F5F0E8', '#8B6F47', '#FFFFFF', '#2C2420'],
      materials: ['terra_cotta_floor', 'raw_concrete', 'linen_fabric', 'vintage_wood'],
      lighting: 'golden_hour_diffused',
      emotions: ['confident', 'sensual', 'unhurried', 'theatrical'],
      pace: 'slow mornings, creative afternoons',
      values: ['beauty as daily practice', 'body as art', 'space as stage'],
      rituals: ['barefoot walking meditation', 'flow yoga in natural light', 'candlelit solitary dining'],
      smell: 'fig tree, aged wood, linen',
      sound: 'distant church bells, footsteps echo, fabric rustle',
      touch: 'cool terra cotta, smooth linen',
    },
    {
      archetype: 'Urban Minimalist',
      colors: ['#4A3C2E', '#1C1C1C', '#D4C5B0'],
      materials: ['wool_coat', 'stone_archway', 'aged_architecture'],
      lighting: 'overcast_diffused_natural',
      emotions: ['introspective', 'independent', 'intellectual'],
      pace: 'mindful urban wandering',
      values: ['observation', 'solitude', 'literary soul'],
      rituals: ['daily city walks without headphones', 'café reading sessions', 'observational journaling'],
      smell: 'rain on stone, wool fabric, old books',
      sound: 'city ambience, rain patter, page turning',
      touch: 'wool texture, cold stone, paper grain',
    },
    {
      archetype: 'Wabi-Sabi Sanctuary',
      colors: ['#C4A574', '#8B7355', '#3D3D3D'],
      materials: ['raw_concrete', 'natural_wood', 'linen_textiles'],
      lighting: 'warm_ambient_minimal',
      emotions: ['grounded', 'meditative', 'uncluttered'],
      pace: 'slow, intentional, present',
      values: ['imperfection', 'simplicity', 'naturalness'],
      rituals: ['floor sitting tea ceremony', 'mindful cleaning', 'candlelight evenings'],
      smell: 'hinoki wood, green tea, incense',
      sound: 'silence, ceramic sounds, soft rain',
      touch: 'rough concrete, smooth wood grain, linen',
    }
  ];

  const startingId = existingAnalyses.length;
  
  return images.map((file, index) => {
    const template = archetypes[(startingId + index) % archetypes.length];
    
    return {
      id: `vision-${Date.now()}-${index}`,
      imageUrl: URL.createObjectURL(file),
      uploadedAt: Date.now(),
      visualDNA: {
        colorPalette: template.colors,
        materials: template.materials,
        lighting: template.lighting,
        spatialFeeling: 'expansive yet intimate',
        emotionalCore: template.emotions,
        archetype: template.archetype,
      },
      lifestyleInference: {
        pace: template.pace,
        values: template.values,
        dailyRituals: template.rituals,
      },
      sensoryTriggers: {
        smell: template.smell,
        sound: template.sound,
        touch: template.touch,
      },
      sopMapping: [
        {
          module: 'DAILY_ROUTINE',
          actions: template.rituals.slice(0, 2),
        },
        {
          module: '物品库存管理',
          actions: ['清理非天然材质物品', '购置符合美学的器物'],
        },
        {
          module: '空间美学',
          actions: ['调整光源配置', '优化家具布局'],
        },
      ],
      manifestationPath: [
        {
          week: 1,
          focus: '空间清理',
          actions: ['移除不符合美学的物品', '建立晨间仪式'],
        },
        {
          week: 2,
          focus: '习惯建立',
          actions: ['每日执行核心仪式', '记录身体感受'],
        },
        {
          week: 3,
          focus: '深化体验',
          actions: ['引入五感元素', '拍摄记录进展'],
        },
        {
          week: 4,
          focus: '整合显化',
          actions: ['对比愿景与现实', '调整优化方案'],
        },
      ],
    };
  });
}