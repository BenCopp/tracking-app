import React, { useState } from 'react';
import { 
  Droplet, 
  Activity, 
  Wind, 
  Bell, 
  BellOff, 
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Habit } from '../types';
import { addDocument, updateDocument, deleteDocument } from '../lib/firestore';
import { auth } from '../lib/firebase';

const ICON_MAP: Record<string, any> = {
  'Droplet': <Droplet size={18} />,
  'Activity': <Activity size={18} />,
  'Wind': <Wind size={18} />,
};

interface HabitViewProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  setHeaderAction: (node: React.ReactNode) => void;
}

export default function HabitView({ habits, setHabits, setHeaderAction }: HabitViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('habits');
    if (saved && !auth.currentUser) {
      try {
        const parsed = JSON.parse(saved);
        setHabits(parsed);
      } catch (e) {
        console.error('Failed to load habits from localStorage');
      }
    }
  }, []);

  // Save to localStorage when habits change and not logged in
  React.useEffect(() => {
    if (!auth.currentUser && habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
  }, [habits]);

  React.useEffect(() => {
    setHeaderAction(
      <div className="flex gap-2">
        <button 
          onClick={() => {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Habit Reminder', {
                body: 'Time to check your habits!',
                icon: '/icon-192x192.png'
              });
            } else {
              alert('Notifications not permitted. Please enable in browser settings.');
            }
          }}
          className="p-2 bg-yellow-500 rounded shadow-lg text-black hover:bg-yellow-600 transition-colors"
          title="Test Notification"
        >
          <Bell size={16} />
        </button>
        <button 
          onClick={() => setShowAddModal(true)}
          className="p-2.5 bg-[#3B82F6] rounded shadow-lg shadow-blue-500/20 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    );
    return () => setHeaderAction(null);
  }, [setHeaderAction]);

  const incrementHabit = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.current >= habit.target) return;
    
    if (auth.currentUser) {
      updateDocument('habits', id, { current: habit.current + 1 });
    } else {
      setHabits(prev => prev.map(h => {
        if (h.id === id && h.current < h.target) return { ...h, current: h.current + 1 };
        return h;
      }));
    }
  };

  const deleteHabit = (id: string) => {
    if (auth.currentUser) {
      deleteDocument('habits', id);
    } else {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {habits.map((habit, idx) => (
          <HabitCard 
            key={habit.id} 
            habit={habit} 
            index={idx}
            onIncrement={() => incrementHabit(habit.id)}
            onEdit={() => setEditingHabit(habit)}
            onDelete={() => deleteHabit(habit.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {(showAddModal || editingHabit) && (
          <Modal 
            onClose={() => {
              setShowAddModal(false);
              setEditingHabit(null);
            }}
            onSave={(h) => {
              if (editingHabit) {
                if (auth.currentUser) {
                  const { id, ...data } = h;
                  updateDocument('habits', id, data);
                } else {
                  setHabits(prev => prev.map(old => old.id === h.id ? h : old));
                }
              } else {
                if (auth.currentUser) {
                  addDocument('habits', h);
                } else {
                  setHabits(prev => [...prev, h]);
                }
              }
              setShowAddModal(false);
              setEditingHabit(null);
            }}
            initialHabit={editingHabit || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ onClose, onSave, initialHabit }: { onClose: () => void, onSave: (h: Habit) => void, initialHabit?: Habit }) {
  const [name, setName] = useState(initialHabit?.name || '');
  const [target, setTarget] = useState(initialHabit?.target || 8);
  const [unit, setUnit] = useState(initialHabit?.unit || 'UNITS');
  const [interval, setInterval] = useState(initialHabit?.notifyInterval || 60);

  const handleSave = () => {
    if (!name) return;
    const newHabit: Habit = {
      id: initialHabit?.id || Math.random().toString(),
      name,
      target,
      current: initialHabit?.current || 0,
      unit,
      notifyInterval: interval,
      notificationsActive: initialHabit?.notificationsActive ?? true,
      color: initialHabit?.color || 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30',
      icon: initialHabit?.icon || 'Droplet'
    };
    onSave(newHabit);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#151619] border border-[#2A2A2E] rounded-lg w-full max-w-xs overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#2A2A2E]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-mono font-bold text-white uppercase">
              {initialHabit ? 'RECONFIG HABIT' : 'NEW ROUTINE'}
            </h4>
            <button onClick={onClose}><X size={16} className="text-[#8E9299]" /></button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">IDENTIFIER</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ENTER NAME..."
                className="w-full bg-[#1C1D21] border border-[#2A2A2E] rounded p-2.5 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">TARGET</label>
                <input 
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full bg-[#1C1D21] border border-[#2A2A2E] rounded p-2.5 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">UNIT</label>
                <input 
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-[#1C1D21] border border-[#2A2A2E] rounded p-2.5 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-wide flex justify-between">
                <span>NOTIF INTERVAL</span>
                <span className="text-[#3B82F6]">{interval}m</span>
              </label>
              <input 
                type="range"
                min="1"
                max="240"
                step="5"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full h-1 bg-[#1C1D21] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
              />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          className="w-full py-4 bg-[#3B82F6] text-white font-mono font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors"
        >
          COMMIT RESOURCES
        </button>
      </motion.div>
    </motion.div>
  );
}

function HabitCard({ habit, index, onIncrement, onEdit, onDelete }: { habit: Habit, index: number, onIncrement: () => void, onEdit: () => void, onDelete: () => void, key?: string }) {
  const isComplete = habit.current >= habit.target;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "bg-[#151619] p-5 rounded-lg border border-[#2A2A2E] border-l-2 border-l-[#3B82F6] flex items-center gap-5 transition-all relative",
        isComplete ? "opacity-60" : ""
      )}
    >
      <div className={cn("size-10 rounded border flex items-center justify-center relative", habit.color)}>
        {ICON_MAP[habit.icon] || <CheckCircle2 size={18} />}
        {isComplete && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-[#151619]">
            <CheckCircle2 size={8} />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-mono font-bold text-[#E0E0E0] uppercase text-xs tracking-tight">{habit.name}</h4>
          <div className="flex items-center gap-1.5 bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-[#2A2A2E]">
            <Clock size={8} className="text-[#3B82F6]" />
            <span className="text-[7px] font-mono text-[#8E9299]">{habit.notifyInterval}M</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="h-1 flex-1 bg-[#0A0A0B] rounded-full overflow-hidden border border-[#2A2A2E]">
            <div 
              className={cn("h-full transition-all duration-1000", habit.color.split(' ')[0].replace('text-', 'bg-'))}
              style={{ width: `${(habit.current / habit.target) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-[#3B82F6]">
            {habit.current}/{habit.target}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onEdit}
          className="size-9 rounded bg-[#1C1D21] border border-[#2A2A2E] text-[#8E9299] flex items-center justify-center hover:text-[#3B82F6] transition-colors"
        >
          <Bell size={14} />
        </button>
        <button 
          onClick={onIncrement}
          disabled={isComplete}
          className={cn(
            "size-9 rounded border flex items-center justify-center transition-all active:scale-90",
            isComplete ? "bg-[#0A0A0B] text-[#2A2A2E] border-[#2A2A2E]" : "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30 shadow-lg shadow-blue-500/10"
          )}
        >
          <Plus size={16} />
        </button>
        <button 
          onClick={onDelete}
          className="size-9 rounded bg-[#1C1D21] border border-[#2A2A2E] text-[#8E9299] flex items-center justify-center hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
