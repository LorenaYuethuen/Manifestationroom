import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Palette, Heart, Sparkles, Eye, Music } from 'lucide-react';
import type { VisionAnalysis } from './enhanced-analysis';
import { useVisionAnalysis } from './enhanced-analysis';

interface AnalysisStageProps {
  images: File[];
  onAnalysisComplete: (analyses: VisionAnalysis[]) => void;
  existingAnalyses: VisionAnalysis[];
}

const analysisSteps = [
  { icon: Eye, label: 'Visual DNA Extraction', duration: 2000 },
  { icon: Palette, label: 'Color & Material Analysis', duration: 1500 },
  { icon: Heart, label: 'Emotional Energy Recognition', duration: 1800 },
  { icon: Brain, label: 'Lifestyle Inference', duration: 2200 },
  { icon: Music, label: 'Sensory Trigger Generation', duration: 1600 },
  { icon: Sparkles, label: 'Manifestation Path Construction', duration: 2000 },
];

export function AnalysisStageEnhanced({ images, onAnalysisComplete, existingAnalyses }: AnalysisStageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use the real analysis hook
  const { analyzeImages, isAnalyzing, progress } = useVisionAnalysis();

  useEffect(() => {
    // Trigger analysis immediately
    const performAnalysis = async () => {
      try {
        const results = await analyzeImages(images);
        // Add a small delay for the final step animation
        setTimeout(() => {
          onAnalysisComplete(results);
        }, 1000);
      } catch (error) {
        console.error("Analysis failed", error);
        // Fallback or error handling could go here
      }
    };

    if (images.length > 0) {
      performAnalysis();
    }
  }, [images]); // Run once when images change

  // Animate steps based on progress
  useEffect(() => {
    if (!isAnalyzing) return;
    
    // Map progress (0-100) to steps (0-5)
    const stepIndex = Math.min(Math.floor((progress / 100) * analysisSteps.length), analysisSteps.length - 1);
    setCurrentStep(stepIndex);

    // Map progress to image index roughly
    const imgIndex = Math.min(Math.floor((progress / 100) * images.length), images.length - 1);
    setCurrentImageIndex(imgIndex);

  }, [progress, isAnalyzing, images.length]);

  const currentImage = images[currentImageIndex];
  
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
            AI Deep Analysis
          </h2>
          <p className="text-neutral-400">
            Analyzing {currentImageIndex + 1} / {images.length} images...
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
            {currentImage && (
              <img
                src={URL.createObjectURL(currentImage)}
                alt="Analyzing"
                className="w-full h-full object-cover"
              />
            )}
            
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
          </motion.div>

          {/* Analysis Steps */}
          <div className="flex flex-col justify-center space-y-6">
            <AnimatePresence mode="wait">
              {analysisSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                
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
            <span>Analysis Progress</span>
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
      </div>
    </div>
  );
}
