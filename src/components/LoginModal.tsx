"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function hashString(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginModal() {
  const { profile, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (loading || profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setSubmitting(true);
    setErrorMsg("");

    try {
      if (!isLogin) {
        if (!username.trim()) throw new Error("Username is required");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const rawSecurityCode = crypto.randomUUID().split('-')[0];
          const securityCodeHash = await hashString(rawSecurityCode);

          const { error: profileErr } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            username: username.trim(),
            social_code: code,
            security_code_hash: securityCodeHash
          });
          if (profileErr) throw profileErr;
          
          alert(`CRITICAL: Your Profile Security Code is ${rawSecurityCode}\nSave this code right now, it is encrypted in our database and cannot be recovered!`);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-[var(--bg-secondary)] border border-[var(--border-neon)] p-8 rounded-xl max-w-sm w-full text-center shadow-[0_0_30px_rgba(0,255,204,0.15)] flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2 text-[var(--accent-neon)] tracking-tight">sec-ondary</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {isLogin ? "Welcome back, adventurer." : "Register to start your quests."}
          </p>
        </div>

        {errorMsg && <p className="text-red-500 font-bold text-xs">{errorMsg}</p>}

        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address" 
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--accent-neon)] transition-colors text-center"
        />

        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" 
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--accent-neon)] transition-colors text-center"
        />

        {!isLogin && (
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Unique Username" 
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg p-3 text-white focus:outline-none focus:border-[var(--accent-neon)] transition-colors text-center"
          />
        )}

        <button 
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--accent-neon)] text-black font-extrabold py-3 rounded-lg hover:shadow-[0_0_15px_var(--accent-neon)] transition-all disabled:opacity-50 uppercase tracking-widest text-sm mt-2"
        >
          {submitting ? "Authenticating..." : isLogin ? "Enter" : "Create Profile"}
        </button>

        <button 
          type="button"
          onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
          className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </button>
      </form>
    </div>
  );
}
