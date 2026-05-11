CREATE OR REPLACE FUNCTION cleanup_afk_players() 
RETURNS void AS $$
BEGIN
    DELETE FROM users 
    WHERE last_activity < NOW() - INTERVAL '5 minutes'
    AND is_host = FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION start_next_round(p_party_id INT) 
RETURNS INT AS $$
DECLARE
    v_modality_id INT;
    v_random_content TEXT;
    v_new_round_id INT;
BEGIN
    PERFORM cleanup_afk_players();

    SELECT modality_id INTO v_modality_id FROM parties WHERE id = p_party_id;

    SELECT content INTO v_random_content FROM templates
    WHERE modality_id = v_modality_id 
    ORDER BY RANDOM() 
    LIMIT 1;

    IF v_random_content IS NULL THEN
        RAISE EXCEPTION 'No hi ha templates disponibles per a aquesta modalitat.';
    END IF;

    INSERT INTO rounds (content, party_id)
    VALUES (v_random_content, p_party_id)
    RETURNING id INTO v_new_round_id;

    RETURN v_new_round_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_prevent_self_vote() RETURNS trigger AS $$
DECLARE
    v_author_id INT;
BEGIN
    SELECT user_id INTO v_author_id FROM answers WHERE id = NEW.answer_id;
    IF v_author_id = NEW.user_id THEN
        RAISE EXCEPTION 'No et pots votar a tu mateix!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_user_activity() 
RETURNS trigger AS $$
BEGIN
    UPDATE users SET last_activity = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ranking(p_room_id INT) 
RETURNS TABLE(username VARCHAR, points INT) AS $$
BEGIN
    RETURN QUERY 
    SELECT u.username, u.points 
    FROM users u
    WHERE u.room_id = p_room_id
    ORDER BY u.points DESC;
END;
$$ LANGUAGE plpgsql;