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