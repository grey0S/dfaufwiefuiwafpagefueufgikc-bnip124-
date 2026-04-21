"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sha256 } from "@/lib/crypto";
import { Hexagon, Disc3, ShieldAlert } from "lucide-react";
import styles from "./LoginModal.module.css";

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
          const securityCodeHash = await sha256(rawSecurityCode);

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
    <div className={styles.overlay}>
      <div className={styles.container}>
        
        {/* Left Column: Copy & Form */}
        <div className={styles.leftColumn}>
          <div className={styles.brand}>
            <Hexagon className={styles.brandIcon} size={28} strokeWidth={2.5} />
            <span>SEC-ONDARY</span>
          </div>

          <h1 className={styles.headline}>
            Generate your reality. <br/>
            Complete a <span className={styles.headlineAccent}>mission</span>
          </h1>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>Active Agents</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statNumber}>50K+</div>
              <div className={styles.statLabel}>Quests Solved</div>
            </div>
          </div>

          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.inputGroup}>
              {errorMsg && (
                <div className={styles.error}>
                  <ShieldAlert size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/>
                  {errorMsg}
                </div>
              )}

              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                className={styles.input}
                required
              />

              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className={styles.input}
                required
              />

              {!isLogin && (
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Agent Codename (Username)" 
                  className={styles.input}
                  required
                />
              )}

              <button 
                type="submit"
                disabled={submitting}
                className={styles.button}
              >
                {submitting ? "Processing..." : isLogin ? "Access Dashboard" : "Initialize Profile"}
              </button>
            </form>

            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
              className={styles.toggleText}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Mockup */}
        <div className={styles.rightColumn}>
          <div className={styles.phoneMockup}>
            <div className={styles.phoneNotch}></div>
            <div className={styles.phoneScreen}>
              <Disc3 size={120} color="#4a90e2" opacity={0.8} style={{ animation: "spin 10s linear infinite" }}/>
              <div className={styles.scannerBeam}></div>
              <h3 style={{ marginTop: '2rem', fontSize: '1.2rem', fontWeight: 600, color: '#fff', textAlign: 'center' }}>
                Analyzing<br/>Environment...
              </h3>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
