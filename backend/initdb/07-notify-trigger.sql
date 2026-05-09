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