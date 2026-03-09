-- サ活調整くん Supabase テーブル作成SQL
-- Supabaseダッシュボード > SQL Editor で実行してください

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_label TEXT
);

CREATE TABLE event_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  url TEXT
);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE date_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  event_date_id UUID REFERENCES event_dates(id) ON DELETE CASCADE,
  response TEXT CHECK (response IN ('○', '△', '×')) NOT NULL
);

CREATE TABLE facility_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  event_facility_id UUID REFERENCES event_facilities(id) ON DELETE CASCADE,
  UNIQUE(participant_id, event_facility_id)
);

-- RLS (Row Level Security) を有効化し、全員に読み書き許可（匿名利用のため）
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON event_dates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON event_facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON date_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON facility_votes FOR ALL USING (true) WITH CHECK (true);
