-- ========================================================
-- WASTE2WORTH SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Copy and paste this script into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ========================================================

-- 1. Create Profiles Table linked to Auth Users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('citizen', 'collector', 'recycler', 'admin')) DEFAULT 'citizen',
  wallet_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, wallet_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create Pickups Table
CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_code TEXT UNIQUE NOT NULL,
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  citizen_name TEXT,
  citizen_phone TEXT,
  address TEXT NOT NULL,
  waste_type TEXT NOT NULL,
  estimated_weight NUMERIC DEFAULT 0,
  actual_weight NUMERIC,
  status TEXT CHECK (status IN ('pending', 'accepted', 'arrived', 'picked_up', 'completed')) DEFAULT 'pending',
  points_awarded NUMERIC DEFAULT 0,
  collector_id UUID REFERENCES public.profiles(id),
  recycler_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Rewards Catalog Table
CREATE TABLE IF NOT EXISTS public.rewards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cost NUMERIC NOT NULL,
  provider TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Rewards if empty
INSERT INTO public.rewards (id, title, cost, provider, type)
VALUES
  ('R-01', '10 GHS Airtime', 100, 'MTN / Telecel / AT', 'Airtime'),
  ('R-02', '20 GHS Mobile Money', 220, 'MoMo Transfer', 'Mobile Money'),
  ('R-03', '50 GHS Shopping Voucher', 500, 'Melcom Ghana', 'Voucher'),
  ('R-04', 'Eco Tote Bag', 80, 'Green Ghana Initiative', 'Physical')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('earned', 'redeemed')) NOT NULL,
  points NUMERIC NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Collector Earnings Table
CREATE TABLE IF NOT EXISTS public.collector_earnings (
  collector_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance NUMERIC DEFAULT 0.00,
  trips INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS) and Allow Authenticated / Anonymous Access for Mobile App
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_earnings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for easy mobile app interaction
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update profile" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read pickups" ON public.pickups FOR SELECT USING (true);
CREATE POLICY "Allow public insert pickups" ON public.pickups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pickups" ON public.pickups FOR UPDATE USING (true);

CREATE POLICY "Allow public read rewards" ON public.rewards FOR SELECT USING (true);

CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read earnings" ON public.collector_earnings FOR SELECT USING (true);
CREATE POLICY "Allow public upsert earnings" ON public.collector_earnings FOR ALL USING (true);
