ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_uid() RETURNS int AS $$
  SELECT current_setting('app.settings.jwt_user_id', true)::int;
$$ LANGUAGE sql STABLE;

CREATE POLICY user_ins ON users FOR INSERT WITH CHECK (true);
CREATE POLICY user_sel ON users FOR SELECT USING (true);
CREATE POLICY user_upd ON users FOR UPDATE USING (id = auth_uid());

CREATE POLICY room_all ON rooms FOR ALL USING (true);
CREATE POLICY party_all ON parties FOR ALL USING (true);

CREATE POLICY ans_ins ON answers FOR INSERT WITH CHECK (user_id = auth_uid());
CREATE POLICY ans_sel ON answers FOR SELECT USING (
    user_id = auth_uid() OR 
    EXISTS (SELECT 1 FROM rounds WHERE id = round_id AND content IS NOT NULL)
);

CREATE POLICY vote_ins ON votes FOR INSERT WITH CHECK (user_id = auth_uid());
CREATE POLICY vote_sel ON votes FOR SELECT USING (true);

ALTER TABLE modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY mod_sel ON modalities FOR SELECT USING (true);
CREATE POLICY tem_sel ON templates FOR SELECT USING (true);
