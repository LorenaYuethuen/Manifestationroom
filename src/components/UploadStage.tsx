import { useCallback, useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadStageProps {
  onImagesUploaded: (files: File[]) => void;
  existingCount: number;
}

export function UploadStage({ onImagesUploaded, existingCount }: UploadStageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleBegin = () => {
    if (selectedFiles.length > 0) {
      onImagesUploaded(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="size-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Sparkles className="w-8 h-8 text-amber-400" />
            <h1 className="text-6xl font-light tracking-wider text-white">
              MANIFESTATION ROOM
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed"
          >
            上传你的愿景板图片，AI将分析其中的视觉DNA、情感能量与生活方式，
            并将其转化为可触及的五感体验与现实行动计划
          </motion.p>
        </div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-3xl p-16 mb-8
            transition-all duration-500
            ${isDragging 
              ? 'border-amber-400 bg-amber-400/5 scale-[1.02]' 
              : 'border-neutral-700 bg-neutral-900/30 hover:border-neutral-600'
            }
          `}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <label 
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ 
                y: isDragging ? -10 : 0,
                scale: isDragging ? 1.1 : 1 
              }}
              transition={{ duration: 0.3 }}
            >
              <Upload className="w-20 h-20 text-neutral-500" strokeWidth={1.5} />
            </motion.div>
            
            <div className="text-center">
              <p className="text-2xl text-neutral-300 mb-2">
                拖拽图片到此处，或点击上传
              </p>
              <p className="text-neutral-500">
                支持 JPG、PNG、WEBP 格式，可上传多张图片
              </p>
            </div>
          </label>
        </motion.div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-neutral-400 mb-4">
              已选择 {selectedFiles.length} 张图片
            </p>
            
            <div className="grid grid-cols-4 gap-4 mb-8">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-800 group"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white
                             flex items-center justify-center opacity-0 group-hover:opacity-100
                             transition-opacity duration-200 hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white truncate">{file.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBegin}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600
                       text-white text-xl font-light tracking-wide
                       hover:from-amber-500 hover:to-orange-500
                       transition-all duration-300 shadow-lg shadow-amber-900/20"
            >
              开始分析与显化
            </motion.button>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-center text-neutral-600 text-sm"
        >
          {existingCount > 0 && (
            <p className="mb-2 text-amber-400">
              ✨ 已有 {existingCount} 个愿景存储在显化空间中
            </p>
          )}
          <p className="mb-2">💡 提示：上传的图片将被AI深度分析</p>
          <p>提取色彩、材质、情感、生活方式等多维度信息</p>
        </motion.div>
      </motion.div>
    </div>
  );
}