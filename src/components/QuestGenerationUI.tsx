"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Users, Bomb, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { secureSet, secureGet } from "@/lib/crypto";
import { generateLocalQuest } from "@/lib/ai-generator";

export default function QuestGenerationUI({ onQuestCreated }: { onQuestCreated: (quest: any) => void }) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState("");
  const [participantsCount, setParticipantsCount] = useState(1);
  const [isExplosive, setIsExplosive] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateQuest = async () => {
    if (!context.trim() || !profile) return;

    if (!isSupabaseConfigured) {
      alert('Supabase is not configured. Cannot create quests.');
      return;
    }

    // Rate Limiting checks (encrypted to prevent tampering)
    const lastTime = await secureGet('sec_last_quest_time');
    if (lastTime) {
      const waitTime = Date.now() - parseInt(lastTime, 10);
      if (waitTime < 30000) { // 30 seconds wait
        alert(`Anti-spam: You are doing that too fast! Wait ${Math.ceil((30000 - waitTime)/1000)} seconds.`);
        return;
      }
    }

    setLoading(true);
    try {
      const generated = generateLocalQuest({ context, participantsCount, isExplosive });
      
      const timeLimit = new Date();
      timeLimit.setDate(timeLimit.getDate() + 7);

      const { data: questD, error: questErr } = await supabase.from('quests').insert({
        title: generated.title,
        description: generated.description,
        difficulty: generated.difficulty,
        context: context,
        time_limit: timeLimit.toISOString()
      }).select().single();

      if (questErr) throw questErr;

      const { error: partErr } = await supabase.from('quest_participants').insert({
        quest_id: questD.id,
        profile_id: profile.id,
        status: 'active'
      });

      if (partErr) throw partErr;

      await secureSet('sec_last_quest_time', Date.now().toString());

      onQuestCreated(questD);
      setIsOpen(false);
      setContext("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-neon)] text-[var(--accent-neon)] py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,255,204,0.2)] transition-all font-bold tracking-wide"
        >
          <Sparkles className="w-5 h-5" />
          GENERATE NEW QUEST
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-neon)] p-5 rounded-xl shadow-[0_0_20px_rgba(0,255,204,0.1)]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[var(--accent-neon)]">Create Quest</h3>
            <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] text-sm">Cancel</button>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
              <MapPin className="w-4 h-4" /> Context / Location
            </label>
            <input 
              type="text" 
              placeholder="e.g. Walking in a park at night..."
              value={context}
              onChange={e => setContext(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--accent-neon)] transition-colors"
            />
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                <Users className="w-4 h-4" /> Players
              </label>
              <input 
                type="number" 
                min={1} max={8}
                value={participantsCount}
                onChange={e => setParticipantsCount(Number(e.target.value))}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg p-3 text-white text-center focus:outline-none focus:border-[var(--accent-neon)] transition-colors"
              />
            </div>
            {participantsCount > 1 && (
              <div className="flex-1 flex flex-col justify-end">
                <button
                  onClick={() => setIsExplosive(!isExplosive)}
                  className={`p-3 rounded-lg flex items-center justify-center gap-2 border transition-all ${isExplosive ? 'bg-[var(--accent-secondary)]/20 border-[var(--accent-secondary)] text-[var(--accent-secondary)]' : 'bg-[var(--bg-tertiary)] border-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
                >
                  <Bomb className="w-5 h-5" />
                  Explosive
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={generateQuest}
            disabled={loading || !context.trim()}
            className="w-full bg-[var(--accent-neon)] text-black font-extrabold py-3 rounded-lg hover:shadow-[0_0_15px_var(--accent-neon)] transition-all disabled:opacity-50 tracking-widest text-sm"
          >
            {loading ? "ANALYZING CONTEXT..." : "INITIATE"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
