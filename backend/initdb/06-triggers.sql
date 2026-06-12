DROP TRIGGER IF EXISTS tr_prevent_self_vote ON votes;
CREATE TRIGGER tr_prevent_self_vote
BEFORE INSERT ON votes
FOR EACH ROW EXECUTE FUNCTION check_prevent_self_vote();

DROP TRIGGER IF EXISTS tr_refresh_on_answer ON answers;
CREATE TRIGGER tr_refresh_on_answer 
AFTER INSERT ON answers
FOR EACH ROW EXECUTE FUNCTION refresh_user_activity();

DROP TRIGGER IF EXISTS tr_refresh_on_vote ON votes;
CREATE TRIGGER tr_refresh_on_vote 
AFTER INSERT ON votes
FOR EACH ROW EXECUTE FUNCTION refresh_user_activity();

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