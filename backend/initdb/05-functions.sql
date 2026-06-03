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

CREATE OR REPLACE FUNCTION ensure_round(p_party_id INT, p_round_number INT)
RETURNS INT AS $$
DECLARE
    v_modality_id INT;
    v_random_content TEXT;
    v_round_count INT;
    v_round_id INT;
BEGIN
    PERFORM pg_advisory_xact_lock(p_party_id);

    SELECT COUNT(*) INTO v_round_count FROM rounds WHERE party_id = p_party_id;

    IF p_round_number <= 0 THEN
        RAISE EXCEPTION 'Round number must be positive';
    END IF;

    IF p_round_number <= v_round_count THEN
        SELECT id INTO v_round_id
        FROM rounds
        WHERE party_id = p_party_id
        ORDER BY id ASC
        OFFSET p_round_number - 1 LIMIT 1;
        RETURN v_round_id;
    ELSIF p_round_number = v_round_count + 1 THEN
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
        RETURNING id INTO v_round_id;

        RETURN v_round_id;
    ELSE
        RAISE EXCEPTION 'Cannot create round % when only % rounds exist', p_round_number, v_round_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ensure_round(INT, INT) TO anon;

