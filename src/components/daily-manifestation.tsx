import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, Sun, Moon, Sparkles, Clock, Activity, BookOpen, Coffee } from 'lucide-react';
import type { VisionAnalysis } from './enhanced-analysis';

interface DailyTask {
  id: string;
  category: 'morning' | 'workday' | 'evening';
  time: string;
  action: string;
  fromModule: string;
  completed: boolean;
}

interface DailyManifestationDashboardProps {
  analysis: VisionAnalysis;
  completedTasks: Set<string>;
  onTaskComplete: (taskId: string) => void;
}

export function DailyManifestationDashboard({ 
  analysis, 
  completedTasks, 
  onTaskComplete 
}: DailyManifestationDashboardProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  
  // Calculate days since upload
  const daysSinceUpload = Math.floor((Date.now() - analysis.uploadedAt) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.min(Math.floor(daysSinceUpload / 7) + 1, 4);

  useEffect(() => {
    // Generate tasks for the day
    const generatedTasks = generateDailyTasks(analysis, daysSinceUpload);
    setTasks(generatedTasks);
  }, [analysis, daysSinceUpload]);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-white font-light flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-400" />
            Day {daysSinceUpload + 1} LifeFlow
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Focus: {getWeekFocus(currentWeek)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl text-amber-400 font-light">
            {tasks.filter(t => completedTasks.has(t.id)).length}/{tasks.length}
          </p>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">Completed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-amber-500"
          initial={{ width: 0 }}
          animate={{ 
            width: `${(tasks.filter(t => completedTasks.has(t.id)).length / Math.max(tasks.length, 1)) * 100}%` 
          }}
        />
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-4">
        <TimelineSection 
          title="Morning Ritual (晨间仪式)" 
          icon={Sun} 
          tasks={tasks.filter(t => t.category === 'morning')}
          completedTasks={completedTasks}
          onToggle={onTaskComplete}
        />
        
        <TimelineSection 
          title="Workday Flow (生活流)" 
          icon={Activity} 
          tasks={tasks.filter(t => t.category === 'workday')}
          completedTasks={completedTasks}
          onToggle={onTaskComplete}
        />
        
        <TimelineSection 
          title="Evening Reset (晚间复盘)" 
          icon={Moon} 
          tasks={tasks.filter(t => t.category === 'evening')}
          completedTasks={completedTasks}
          onToggle={onTaskComplete}
        />
      </div>
    </div>
  );
}

function TimelineSection({ 
  title, 
  icon: Icon, 
  tasks,
  completedTasks,
  onToggle
}: { 
  title: string; 
  icon: any; 
  tasks: DailyTask[];
  completedTasks: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4 text-neutral-300">
        <Icon className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-medium uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="space-y-3 pl-2 border-l border-neutral-800">
        {tasks.map((task, index) => {
          const isCompleted = completedTasks.has(task.id);
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border
                transition-all duration-300 cursor-pointer group
                ${isCompleted 
                  ? 'bg-neutral-900/50 border-neutral-800 opacity-60' 
                  : 'bg-neutral-900 border-neutral-700 hover:border-amber-500/50'
                }
              `}
              onClick={() => onToggle(task.id)}
            >
              {/* Checkbox */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                transition-colors duration-300
                ${isCompleted 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-neutral-600 group-hover:border-amber-400'
                }
              `}>
                {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`
                    text-base transition-all duration-300
                    ${isCompleted ? 'text-neutral-500 line-through' : 'text-neutral-200'}
                  `}>
                    {task.action}
                  </p>
                  <span className="text-xs text-neutral-500 flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {task.time}
                  </span>
                </div>
                <p className="text-xs text-amber-500/70 mt-1">
                  {task.fromModule}
                </p>
              </div>

              {/* Glow Effect */}
              {!isCompleted && (
                <div className="absolute inset-0 rounded-xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function getWeekFocus(week: number): string {
  const focuses = [
    'Write & Plan (定频)',
    'Do: Routine (筑基)',
    'Do: Growth (精进)',
    'Check & Elevate (复盘)'
  ];
  return focuses[week - 1] || 'Living Flow';
}

export function generateDailyTasks(analysis: VisionAnalysis, dayIndex: number): DailyTask[] {
  const tasks: DailyTask[] = [];
  const week = Math.floor(dayIndex / 7);
  const dayOfWeek = dayIndex % 7;

  // 1. Morning Ritual (Based on user's specific routine: Meditate, Eat, Yoga/Stretch)
  const routineModule = analysis.sopMapping?.find(m => m.subSystem === 'Daily Routine');
  const morningAction = routineModule?.actions?.[0] || analysis.lifestyleInference?.dailyRituals?.[0] || "冥想/听经 + 八段锦/拉伸";

  tasks.push({
    id: `task-${analysis.id}-${dayIndex}-morning`,
    category: 'morning',
    time: '07:00 AM',
    action: morningAction,
    fromModule: 'Daily Routine',
    completed: false
  });

  // 2. Workday Flow (The core DO action for the day)
  // Varies by day: Growth, Output, or Health
  const growthModule = analysis.sopMapping?.find(m => m.subSystem === 'Growth');
  const healthModule = analysis.sopMapping?.find(m => m.subSystem === 'Health');
  const outputModule = analysis.sopMapping?.find(m => m.subSystem === 'Output');
  
  let middayTask = { action: "深度工作/学习 1小时", module: "Growth" };
  
  if (dayOfWeek % 3 === 0 && growthModule?.actions?.[0]) {
     middayTask = { action: growthModule.actions[0], module: "Growth" };
  } else if (dayOfWeek % 3 === 1 && healthModule?.actions?.[0]) {
     middayTask = { action: healthModule.actions[0], module: "Health" };
  } else if (dayOfWeek % 3 === 2 && outputModule?.actions?.[0]) {
     middayTask = { action: outputModule.actions[0], module: "Output" };
  }

  tasks.push({
    id: `task-${analysis.id}-${dayIndex}-workday`,
    category: 'workday',
    time: '02:00 PM',
    action: middayTask.action,
    fromModule: middayTask.module,
    completed: false
  });

  // 3. Evening Reset (Based on user's specific routine: Skincare, Read, Meditate)
  tasks.push({
    id: `task-${analysis.id}-${dayIndex}-evening-prep`,
    category: 'evening',
    time: '09:00 PM',
    action: '护肤/听音乐 + 准备明日衣物/食物',
    fromModule: 'Daily Routine',
    completed: false
  });

  tasks.push({
    id: `task-${analysis.id}-${dayIndex}-evening-check`,
    category: 'evening',
    time: '10:00 PM',
    action: '15分钟复盘 (CHECK) + 入睡冥想',
    fromModule: 'Review',
    completed: false
  });

  return tasks;
}

export function getSensoryReminders(analysis: VisionAnalysis) {
  return [
    { type: 'smell', instruction: analysis.sensoryTriggers?.smell, icon: Wind },
    { type: 'sound', instruction: analysis.sensoryTriggers?.sound, icon: Sparkles }, // Changed icon
    { type: 'touch', instruction: analysis.sensoryTriggers?.touch, icon: Coffee },
  ];
}
