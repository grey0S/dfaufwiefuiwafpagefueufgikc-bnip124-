"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  social_code: string;
  security_code_hash: string;
  xp: number;
  rank: string;
  solo_streak: number;
  group_streak: number;
};

type AuthContextType = {
  profile: Profile | null;
  loading: boolean;
  logout: () => void;
  updateProfile: (profile: Profile) => void;
};

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  logout: () => {},
  updateProfile: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: if Supabase is not configured (build-time / missing env),
    // just stop loading immediately – don't call the SDK.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchProfile(userId: string) {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      if (data && mounted) {
        setProfile(data);
      }
      if (mounted) setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        if (mounted) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = (newProfile: Profile) => {
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
