"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import LoginModal from "@/components/LoginModal";
import QuestGenerationUI from "@/components/QuestGenerationUI";
import SocialShare from "@/components/SocialShare";
import { Flame, Shield, Zap, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { profile: user, updateProfile: updateUser } = useAuth();
  const [quests, setQuests] = useState<any[]>([]);
  const [lastCompletedQuest, setLastCompletedQuest] = useState<any | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('quest_participants')
        .select('*, quests(*)')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .then(({ data, error }) => {
          if (data && !error) {
            // Map the joined data back to a flat quest array structure our UI expects
            setQuests(data.map(q => q.quests));
          }
        });
    }
  }, [user]);

  const handleQuestCreated = (newQuest: any) => {
    setQuests(prev => [newQuest, ...prev]);
    setLastCompletedQuest(null);
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case "Very Easy": return "text-[var(--diff-very-easy)]";
      case "Easy": return "text-[var(--diff-easy)]";
      case "Medium": return "text-[var(--diff-medium)]";
      case "Hard": return "text-[var(--diff-hard)]";
      case "Explosive": return "text-[var(--diff-explosive)] font-bold";
      default: return "text-white";
    }
  };

  const handleComplete = async (questId: string) => {
    if (!user) return;
    try {
      const completed = quests.find(q => q.id === questId);
      if (!completed) return;

      // 1. Mark participant as completed
      await supabase.from('quest_participants')
        .update({ status: 'completed' })
        .eq('quest_id', questId)
        .eq('profile_id', user.id);

      // 2. Calculate XP
      let xpGained = 0;
      switch(completed.difficulty) {
        case "Very Easy": xpGained = 10; break;
        case "Easy": xpGained = 25; break;
        case "Medium": xpGained = 50; break;
        case "Hard": xpGained = 100; break;
        case "Explosive": xpGained = 300; break;
      }

      const totalXp = user.xp + xpGained;
      let newRank = user.rank;
      if (totalXp >= 5000) newRank = "Legend";
      else if (totalXp >= 2500) newRank = "Hero";
      else if (totalXp >= 1000) newRank = "Adventurer";

      // 3. Update profile
      const newProfile = { ...user, xp: totalXp, rank: newRank, solo_streak: user.solo_streak + 1 };
      
      const { error } = await supabase.from('profiles')
        .update({ xp: totalXp, rank: newRank, solo_streak: newProfile.solo_streak })
        .eq('id', user.id);
      
      if (!error) {
        setQuests(prev => prev.filter(q => q.id !== questId));
        setLastCompletedQuest(completed);
        updateUser(newProfile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-8">
      <LoginModal />
      
      {/* Header / Profile Summary */}
      <header className="flex flex-col gap-2 mt-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user.username}</h1>
            <p className="text-[var(--accent-neon)] font-bold text-sm tracking-widest uppercase">{user.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{user.xp} <span className="text-xs text-[var(--text-secondary)] font-normal">XP</span></p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-2">
          <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_10px_rgba(255,100,0,0.1)]">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-[var(--text-secondary)]">Solo: <span className="text-white">{user.solo_streak}</span></span>
          </div>
          <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_10px_rgba(0,150,255,0.1)]">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-[var(--text-secondary)]">Group: <span className="text-white">{user.group_streak}</span></span>
          </div>
        </div>
      </header>

      {/* Main Actions */}
      <section>
        <QuestGenerationUI onQuestCreated={handleQuestCreated} />
      </section>

      {/* Show Social Share if a quest was just completed */}
      {lastCompletedQuest && (
        <SocialShare quest={lastCompletedQuest} user={user} />
      )}

      {/* Active Quests */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--accent-neon)]" />
          Active Quests
        </h2>
        
        <div className="flex flex-col gap-4">
          {quests.length === 0 ? (
            <div className="text-center p-8 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              No active quests. Time to generate one!
            </div>
          ) : (
            quests.map(quest => (
              <div 
                key={quest.id}
                className="bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] p-5 rounded-xl transition-all hover:border-[var(--border-neon)] relative overflow-hidden"
              >
                {quest.difficulty === "Explosive" && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--diff-explosive)] shadow-[0_0_10px_var(--diff-explosive)]" />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight w-3/4">{quest.title}</h3>
                  <span className={`text-xs uppercase tracking-widest px-2 py-1 bg-[var(--bg-tertiary)] rounded-md ${getDifficultyColor(quest.difficulty)}`}>
                    {quest.difficulty}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">{quest.description}</p>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Expires in {formatDistanceToNow(new Date(quest.time_limit))}</span>
                  </div>
                  <button 
                    onClick={() => handleComplete(quest.id)}
                    className="bg-[var(--bg-tertiary)] hover:bg-[var(--accent-neon)] hover:text-black text-[var(--text-primary)] px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> COMPLETE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
