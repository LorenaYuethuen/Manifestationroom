import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { VisionAnalysis } from '../App';
import { Sparkles, Eye, ArrowLeft, Plus, Trash2, Link2 } from 'lucide-react';

interface ManifestationSpaceProps {
  analyses: VisionAnalysis[];
  onEnterVision: (analysis: VisionAnalysis) => void;
  onRestart: () => void;
  onClearAll: () => void;
}

export function ManifestationSpace({ analyses, onEnterVision, onRestart, onClearAll }: ManifestationSpaceProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInstructions, setIsInstructions] = useState(true);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="size-full relative overflow-hidden">
      {/* 3D Space */}
      <div 
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          perspective: '1200px',
          perspectiveOrigin: 'center center',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black">
          {/* Ambient particles */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Vision Orbs Container */}
        <div 
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {analyses.map((analysis, i) => {
            // 网格布局代替圆形，确保不重叠
            const gridSize = Math.ceil(Math.sqrt(analyses.length));
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const spacing = 300; // 球体之间的间距
            
            // 计算偏移量让网格居中
            const offsetX = -(gridSize - 1) * spacing / 2;
            const offsetY = -(gridSize - 1) * spacing / 2;
            
            const x = col * spacing + offsetX;
            const y = row * spacing + offsetY;

            return (
              <div
                key={analysis.id}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0px)`,
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterVision(analysis);
                }}
              >
                <motion.div
                  className="relative w-48 h-48 rounded-full overflow-hidden cursor-pointer"
                  style={{
                    backgroundColor: analysis.visualDNA.colorPalette[0] || '#ffffff',
                    boxShadow: hoveredIndex === i 
                      ? `0 0 60px 20px ${analysis.visualDNA.colorPalette[0]}40`
                      : `0 0 30px 10px ${analysis.visualDNA.colorPalette[0]}20`,
                  }}
                  animate={{
                    scale: hoveredIndex === i ? 1.2 : 1,
                    y: [0, -20, 0],
                  }}
                  transition={{
                    scale: { duration: 0.3 },
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }
                  }}
                >
                  {/* Image */}
                  <img
                    src={analysis.imageUrl}
                    alt={analysis.visualDNA.archetype}
                    className="w-full h-full object-cover opacity-80"
                  />
                  
                  {/* Overlay */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"
                    style={{
                      background: `radial-gradient(circle, transparent 30%, ${analysis.visualDNA.colorPalette[0]}40 100%)`,
                    }}
                  />

                  {/* Glow ring */}
                  {hoveredIndex === i && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: `3px solid ${analysis.visualDNA.colorPalette[0]}`,
                        boxShadow: `0 0 30px ${analysis.visualDNA.colorPalette[0]}`,
                      }}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    />
                  )}

                  {/* Pulsing effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: analysis.visualDNA.colorPalette[0],
                      opacity: 0.1,
                    }}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h1 className="text-3xl text-white font-light tracking-wide">
                MANIFESTATION ROOM
              </h1>
            </div>
            <p className="text-neutral-400">
              {analyses.length} 个愿景空间已显化
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/20 
                       text-amber-300 hover:bg-amber-600/30 transition-colors backdrop-blur-sm
                       border border-amber-500/30"
            >
              <Plus className="w-4 h-4" />
              添加愿景
            </button>
            
            <button
              onClick={onClearAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 
                       text-neutral-400 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30
                       transition-colors backdrop-blur-sm border border-neutral-700"
            >
              <Trash2 className="w-4 h-4" />
              清空全部
            </button>
          </div>
        </div>

        {/* Hovered Info */}
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
              <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-neutral-800 max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl text-white font-light">
                    {analyses[hoveredIndex].visualDNA.archetype}
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-neutral-500 mb-1">情感核心</p>
                    <div className="flex flex-wrap gap-2">
                      {analyses[hoveredIndex].visualDNA.emotionalCore.map((emotion, i) => (
                        <span key={i} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-xs">
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-neutral-500 mb-1">生活节奏</p>
                    <p className="text-neutral-300">{analyses[hoveredIndex].lifestyleInference.pace}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800">
                    <p className="text-amber-400 text-xs">点击进入显化空间</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <AnimatePresence>
          {isInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
              onClick={() => setIsInstructions(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-neutral-900/95 rounded-3xl p-12 max-w-2xl border border-neutral-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-8">
                  <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-3xl text-white font-light mb-4">
                    欢迎来到显化空间
                  </h2>
                  <p className="text-neutral-400 leading-relaxed">
                    你的愿景已被转化为能量球体，漂浮在这个沉浸式空间中。
                    每个球体都包含了从图片中提取的视觉DNA、情感能量与生活方式。
                  </p>
                </div>

                <div className="space-y-4 mb-8 text-neutral-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400">1</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">拖拽旋转</p>
                      <p className="text-sm text-neutral-500">使用鼠标拖拽查看不同角度的愿景球体</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400">2</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">凝视感知</p>
                      <p className="text-sm text-neutral-500">将鼠标悬停在球体上，感受其中的情感与能量</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400">3</span>
                    </div>
                    <div>
                      <p className="font-medium mb-1">点击进入</p>
                      <p className="text-sm text-neutral-500">点击球体进入五感触发器与现实行动计划</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsInstructions(false)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600
                           text-white font-light hover:from-amber-500 hover:to-orange-500
                           transition-all duration-300"
                >
                  开始探索
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}