ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parties ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_uid() RETURNS int AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'id', '')::int;
$$ LANGUAGE sql STABLE;

DROP POLICY IF EXISTS user_ins ON users;
CREATE POLICY user_ins ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS user_sel ON users;
CREATE POLICY user_sel ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS user_upd ON users;
CREATE POLICY user_upd ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS user_del ON users;
CREATE POLICY user_del ON users FOR DELETE USING (true);

DROP POLICY IF EXISTS room_all ON rooms;
CREATE POLICY room_all ON rooms FOR ALL USING (true);

DROP POLICY IF EXISTS party_all ON parties;
CREATE POLICY party_all ON parties FOR ALL USING (true);

DROP POLICY IF EXISTS ans_ins ON answers;
CREATE POLICY ans_ins ON answers FOR INSERT WITH CHECK (user_id = auth_uid());

DROP POLICY IF EXISTS ans_sel ON answers;
CREATE POLICY ans_sel ON answers FOR SELECT USING (true);

DROP POLICY IF EXISTS mod_sel ON modalities;
CREATE POLICY mod_sel ON modalities FOR SELECT USING (true);

DROP POLICY IF EXISTS tem_sel ON templates;
CREATE POLICY tem_sel ON templates FOR SELECT USING (true);

DROP POLICY IF EXISTS vote_ins ON votes;
CREATE POLICY vote_ins ON votes FOR INSERT WITH CHECK (user_id = auth_uid());

DROP POLICY IF EXISTS vote_sel ON votes;
CREATE POLICY vote_sel ON votes FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION notify_game_changes() RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', row_to_json(OLD)
    );
  ELSE
    payload = json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', row_to_json(NEW)
    );
  END IF;

  PERFORM pg_notify('messages_changes', payload::text);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_users_changed ON users;
CREATE TRIGGER tr_users_changed
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION notify_game_changes();

DROP TRIGGER IF EXISTS tr_answers_changed ON answers;
CREATE TRIGGER tr_answers_changed
AFTER INSERT OR UPDATE OR DELETE ON answers
FOR EACH ROW EXECUTE FUNCTION notify_game_changes();

DROP TRIGGER IF EXISTS tr_votes_changed ON votes;
CREATE TRIGGER tr_votes_changed
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION notify_game_changes();

DROP TRIGGER IF EXISTS tr_rooms_changed ON rooms;
CREATE TRIGGER tr_rooms_changed
AFTER INSERT OR UPDATE OR DELETE ON rooms
FOR EACH ROW EXECUTE FUNCTION notify_game_changes();