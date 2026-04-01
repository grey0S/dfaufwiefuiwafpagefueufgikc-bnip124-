-- Run this inside the Supabase SQL Editor to initialize your database corresponding to sec-ondary's needs.

-- Drop existing tables if re-creating
DROP TABLE IF EXISTS "public"."snapshots";
DROP TABLE IF EXISTS "public"."quest_participants";
DROP TABLE IF EXISTS "public"."friendships";
DROP TABLE IF EXISTS "public"."matches";
DROP TABLE IF EXISTS "public"."quests";
DROP TABLE IF EXISTS "public"."profiles";

-- 1. Profiles Table (Automatically synced via triggers or created manually if not)
CREATE TABLE "public"."profiles" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  "username" text UNIQUE NOT NULL,
  "social_code" text UNIQUE NOT NULL,
  "security_code_hash" text NOT NULL,
  "xp" integer DEFAULT 0,
  "rank" text DEFAULT 'Novice',
  "solo_streak" integer DEFAULT 0,
  "group_streak" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Quests Table
CREATE TABLE "public"."quests" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "difficulty" text NOT NULL,
  "context" text,
  "time_limit" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Quest Participants Table (mapping users to assigned/active quests)
CREATE TABLE "public"."quest_participants" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "quest_id" uuid REFERENCES "public"."quests"(id) ON DELETE CASCADE,
  "profile_id" uuid REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
  "status" text DEFAULT 'active', -- 'active' or 'completed'
  UNIQUE("quest_id", "profile_id")
);

-- Enable RLS (Row Level Security) - Simplified for prototype allowing public/authenticated reads
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quest_participants" ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Quests are viewable by everyone." ON "public"."quests" FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert quests." ON "public"."quests" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update quests." ON "public"."quests" FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Quest participants are viewable by everyone." ON "public"."quest_participants" FOR SELECT USING (true);
CREATE POLICY "Users can insert their participant records." ON "public"."quest_participants" FOR INSERT WITH CHECK (true); -- For simple prototype
CREATE POLICY "Users can update their participant records." ON "public"."quest_participants" FOR UPDATE USING (true); -- For simple prototype
