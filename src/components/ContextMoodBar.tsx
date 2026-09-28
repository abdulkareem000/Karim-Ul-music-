import React from 'react';
import { Sun, Moon, Sunset, Compass, Dumbbell, Coffee, Car, Flame } from 'lucide-react';

interface ContextMoodBarProps {
  selectedMood: string;
  onSelectMood: (mood: string) => void;
}

export const ContextMoodBar: React.FC<ContextMoodBarProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  // Determine time-of-day contextual greeting
  const getContextualGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { label: 'Morning Glow', icon: Sun, color: 'text-amber-400' };
    } else if (hour >= 12 && hour < 17) {
      return { label: 'Afternoon Energy', icon: Compass, color: 'text-emerald-400' };
    } else if (hour >= 17 && hour < 22) {
      return { label: 'Sunset Acoustic Chill', icon: Sunset, color: 'text-rose-400' };
    } else {
      return { label: 'Late Night Vibe', icon: Moon, color: 'text-indigo-400' };
    }
  };

  const contextTime = getContextualGreeting();
  const TimeIcon = contextTime.icon;

  const moods = [
    { id: 'all', label: 'All Beats', icon: Compass },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'drive', label: 'Night Drive', icon: Car },
    { id: 'chill', label: 'Focus & Lo-Fi', icon: Coffee },
    { id: 'energy', label: 'High Energy Trap', icon: Flame },
    { id: 'romantic', label: 'Romantic Indie', icon: Sunset },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 select-none">
      {/* Time-of-day Context Pill */}
      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
        <TimeIcon className={`w-3.5 h-3.5 ${contextTime.color}`} />
        <span>Context: <strong className="text-white">{contextTime.label}</strong></span>
      </div>

      {/* Mood Filter Tabs (Functional Button Controls) */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
        {moods.map((m) => {
          const Icon = m.icon;
          const isActive = selectedMood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMood(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
