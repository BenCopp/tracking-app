import React, { useState } from 'react';
import { Plus, Search, Beef, Utensils as ForkIcon, Coffee, Trash2, Edit2, X, Save, Calendar, ArrowRight, Salad, Apple, Carrot } from 'lucide-react';
import { cn } from '../lib/utils';
import { Food, LoggedFood } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { addDocument, updateDocument, deleteDocument } from '../lib/firestore';
import { auth } from '../lib/firebase';

const ICON_OPTIONS = [
  { name: 'Meat', icon: <Beef size={16} /> },
  { name: 'Veggie', icon: <Salad size={16} /> },
  { name: 'Fruit', icon: <Apple size={16} /> },
  { name: 'Carrot', icon: <Carrot size={16} /> },
  { name: 'ForkIcon', icon: <ForkIcon size={16} /> },
  { name: 'Coffee', icon: <Coffee size={16} /> },
];

const ICON_MAP: Record<string, any> = {
  'Beef': <Beef size={18} />,
  'Meat': <Beef size={18} />,
  'Veggie': <Salad size={18} />,
  'Fruit': <Apple size={18} />,
  'Carrot': <Carrot size={18} />,
  'ForkIcon': <ForkIcon size={18} />,
  'Coffee': <Coffee size={18} />,
};

interface FoodDatabaseViewProps {
  foodDatabase: Food[];
  setFoodDatabase: React.Dispatch<React.SetStateAction<Food[]>>;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}

export default function FoodDatabaseView({ foodDatabase, setFoodDatabase, isAdding, setIsAdding }: FoodDatabaseViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFood, setEditingFood] = useState<Food | null>(null);

  const filteredFoods = foodDatabase.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (auth.currentUser) {
      deleteDocument('food_database', id);
    } else {
      setFoodDatabase(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleSave = (food: Food) => {
    if (editingFood) {
      if (auth.currentUser) {
        const { id, ...data } = food;
        updateDocument('food_database', id, data);
      } else {
        setFoodDatabase(prev => prev.map(f => f.id === food.id ? food : f));
      }
      setEditingFood(null);
    } else {
      if (auth.currentUser) {
        addDocument('food_database', food);
      } else {
        setFoodDatabase(prev => [...prev, food]);
      }
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9299]" size={14} />
        <input 
          type="text"
          placeholder="FILTER INVENTORY..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#151619] border border-[#2A2A2E] rounded-lg py-3 pl-10 pr-4 text-xs font-mono text-white focus:border-[#3B82F6] outline-none transition-colors"
        />
      </div>

      <div className="grid gap-3 pb-8">
        {filteredFoods.map(food => (
          <div 
            key={food.id}
            className="bg-[#151619] p-4 rounded-lg border border-[#2A2A2E] flex items-center gap-4 group"
          >
            <div className="size-12 bg-[#0A0A0B] border border-[#2A2A2E] flex items-center justify-center text-[#3B82F6] rounded">
              {ICON_MAP[food.icon] || <ForkIcon size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-mono font-bold text-white uppercase">{food.name}</h4>
              <div className="flex gap-3 mt-1 text-[8px] font-mono uppercase text-[#8E9299]">
                <span>{food.baseKcal}kcal</span>
                <span>/</span>
                <span>{food.baseWeight}g</span>
                <div className="flex gap-1.5 ml-2 border-l border-[#2A2A2E] pl-3">
                  <span className="text-[#3B82F6]">P:{food.baseMacros.p}</span>
                  <span className="text-yellow-500">C:{food.baseMacros.c}</span>
                  <span className="text-red-400">F:{food.baseMacros.f}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingFood(food)}
                className="p-2 text-[#8E9299] hover:text-[#3B82F6] transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => handleDelete(food.id)}
                className="p-2 text-[#8E9299] hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(isAdding || editingFood) && (
          <FoodModal 
            food={editingFood || undefined} 
            onClose={() => {
              setIsAdding(false);
              setEditingFood(null);
            }} 
            onSave={handleSave} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FoodModal({ food, onClose, onSave }: { food?: Food, onClose: () => void, onSave: (f: Food) => void }) {
  const [name, setName] = useState(food?.name || '');
  const [weight, setWeight] = useState(food?.baseWeight || 100);
  const [kcal, setKcal] = useState(food?.baseKcal || 0);
  const [p, setP] = useState(food?.baseMacros.p || 0);
  const [c, setC] = useState(food?.baseMacros.c || 0);
  const [f, setF] = useState(food?.baseMacros.f || 0);
  const [icon, setIcon] = useState(food?.icon || 'ForkIcon');

  const updateCalories = (prot: number, carb: number, fat: number) => {
    setKcal(Math.round((prot * 4) + (carb * 4) + (fat * 9)));
  };

  const handleMacroChange = (field: 'p' | 'c' | 'f', value: number) => {
    if (field === 'p') {
      setP(value);
      updateCalories(value, c, f);
    } else if (field === 'c') {
      setC(value);
      updateCalories(p, value, f);
    } else if (field === 'f') {
      setF(value);
      updateCalories(p, c, value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: food?.id || Math.random().toString(),
      name,
      baseWeight: Number(weight),
      baseKcal: Number(kcal),
      baseMacros: { p: Number(p), c: Number(c), f: Number(f) },
      icon
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#151619] border border-[#2A2A2E] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#2A2A2E] flex justify-between items-center">
          <h3 className="text-sm font-mono font-bold text-white uppercase">
            {food ? 'RECONFIGURE ENTRY' : 'NEW DATA NODE'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-[#8E9299]" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">IDENTIFIER</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded p-2.5 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              placeholder="e.g. GRILLED SALMON"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">BASE MASS (G)</label>
              <input 
                type="number"
                required
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded p-2.5 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">CALORIES</label>
              <input 
                type="number"
                required
                value={kcal}
                onChange={(e) => setKcal(Number(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded p-2.5 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <label className="text-[7px] font-mono font-bold text-[#3B82F6] uppercase tracking-widest">PROT (G)</label>
              <input 
                type="number" step="0.1"
                value={p}
                onChange={(e) => handleMacroChange('p', Number(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded p-2 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[7px] font-mono font-bold text-yellow-500 uppercase tracking-widest">CARB (G)</label>
              <input 
                type="number" step="0.1"
                value={c}
                onChange={(e) => handleMacroChange('c', Number(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded p-2 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[7px] font-mono font-bold text-red-400 uppercase tracking-widest">FAT (G)</label>
              <input 
                type="number" step="0.1"
                value={f}
                onChange={(e) => handleMacroChange('f', Number(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#2A2A2E] rounded p-2 text-xs font-mono text-white focus:border-[#3B82F6] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-bold text-[#8E9299] uppercase tracking-widest">VISUAL MARKER</label>
            <div className="flex gap-2">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setIcon(opt.name)}
                  className={cn(
                    "flex-1 py-2 flex items-center justify-center rounded border transition-all",
                    icon === opt.name ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]" : "bg-[#0A0A0B] border-[#2A2A2E] text-[#8E9299]"
                  )}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#3B82F6] text-white font-mono font-bold text-[10px] uppercase tracking-[0.2em] mt-4 hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            COMMIT CHANGES
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
