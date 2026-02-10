import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, Sun, Moon, Sparkles, Clock } from 'lucide-react';
import type { VisionAnalysis } from '../App';

interface DailyTask {
  id: string;
  category: 'morning' | 'afternoon' | 'evening';
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
  const [currentDate, setCurrentDate] = useState(new Date());

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
            Day {daysSinceUpload + 1} Manifestation
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Week {currentWeek} Focus: {getWeekFocus(currentWeek)}
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
          title="Morning Rituals" 
          icon={Sun} 
          tasks={tasks.filter(t => t.category === 'morning')}
          completedTasks={completedTasks}
          onToggle={onTaskComplete}
        />
        
        <TimelineSection 
          title="Daily Actions" 
          icon={Sparkles} 
          tasks={tasks.filter(t => t.category === 'afternoon')}
          completedTasks={completedTasks}
          onToggle={onTaskComplete}
        />
        
        <TimelineSection 
          title="Evening Reflection" 
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
                  from {task.fromModule}
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
    'Clarity & Purification',
    'Habit Architecture',
    'Sensory Immersion',
    'Integration & Flow'
  ];
  return focuses[week - 1] || 'Mastery';
}

export function generateDailyTasks(analysis: VisionAnalysis, dayIndex: number): DailyTask[] {
  const tasks: DailyTask[] = [];
  const week = Math.floor(dayIndex / 7);
  const dayOfWeek = dayIndex % 7;

  // 1. Morning Ritual (from dailyRituals or DAILY_ROUTINE SOP)
  const routineModule = analysis.sopMapping?.find(m => m.module === 'DAILY_ROUTINE');
  const morningAction = routineModule?.actions?.[0] || analysis.lifestyleInference?.dailyRituals?.[0] || "Morning meditation";

  tasks.push({
    id: `task-${analysis.id}-${dayIndex}-morning`,
    category: 'morning',
    time: '07:00 AM',
    action: morningAction,
    fromModule: 'DAILY_ROUTINE',
    completed: false
  });

  // 2. Main Action (from manifestationPath or SOP)
  // Use week specific actions if available
  const weekPlan = analysis.manifestationPath?.find(w => w.week === week + 1);
  
  if (weekPlan && weekPlan.actions.length > 0) {
    tasks.push({
      id: `task-${analysis.id}-${dayIndex}-afternoon`,
      category: 'afternoon',
      time: '02:00 PM',
      action: weekPlan.actions[dayOfWeek % weekPlan.actions.length],
      fromModule: `WEEK ${week + 1} FOCUS`,
      completed: false
    });
  } else {
    // Fallback to iterating through SOP modules for variety
    // Day 0: INVENTORY, Day 1: HEALTH, Day 2: SPACE, etc.
    const sopModules = analysis.sopMapping || [];
    if (sopModules.length > 0) {
      const sopModule = sopModules[dayOfWeek % sopModules.length];
      if (sopModule && sopModule.actions.length > 0) {
         tasks.push({
          id: `task-${analysis.id}-${dayIndex}-afternoon-sop`,
          category: 'afternoon',
          time: '03:00 PM',
          action: sopModule.actions[0],
          fromModule: sopModule.module,
          completed: false
        });
      }
    }
  }

  // 3. Sensory or Specific Module Task (Evening)
  const senses = ['smell', 'sound', 'touch', 'visual'] as const;
  const todaySense = senses[dayIndex % 4];
  let senseAction = '';
  
  switch(todaySense) {
    case 'smell': senseAction = `Experience: ${analysis.sensoryTriggers?.smell || "Deep breathing"}`; break;
    case 'sound': senseAction = `Listen to: ${analysis.sensoryTriggers?.sound || "Nature sounds"}`; break;
    case 'touch': senseAction = `Interact with: ${analysis.sensoryTriggers?.touch || "Texture awareness"}`; break;
    case 'visual': senseAction = `Observe lighting: ${analysis.visualDNA?.lighting || "Candlelight"}`; break;
  }

  tasks.push({
    id: `task-${analysis.id}-${dayIndex}-evening`,
    category: 'evening',
    time: '08:00 PM',
    action: senseAction,
    fromModule: 'SENSORY_ANCHORING',
    completed: false
  });

  return tasks;
}

export function getSensoryReminders(analysis: VisionAnalysis) {
  return [
    { type: 'smell', instruction: analysis.sensoryTriggers?.smell, icon: Wind },
    { type: 'sound', instruction: analysis.sensoryTriggers?.sound, icon: Music },
    { type: 'touch', instruction: analysis.sensoryTriggers?.touch, icon: Coffee },
  ];
}
