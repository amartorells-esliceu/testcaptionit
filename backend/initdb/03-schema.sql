CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    code CHAR(8) NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    is_host BOOLEAN DEFAULT FALSE,
    room_id INT REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 0,
    UNIQUE(user_id, room_id)
);

CREATE TABLE modalities (
    id SERIAL PRIMARY KEY,
    category VARCHAR(20) NOT NULL CHECK (category IN ('Image', 'Phrase'))
);

CREATE TABLE parties (
    id SERIAL PRIMARY KEY,
    num_rounds TINYINT NOT NULL DEFAULT 3,
    max_players TINYINT NOT NULL DEFAULT 8,
    round_time SMALLINT NOT NULL DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    modality_id INT REFERENCES modalities(id) ON DELETE RESTRICT
);

CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    modality_id INT REFERENCES modalities(id) ON DELETE CASCADE
);

CREATE TABLE rounds (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    party_id INT REFERENCES parties(id) ON DELETE CASCADE
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    round_id INT REFERENCES rounds(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    answer_id INT REFERENCES answers(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (answer_id, user_id) 
);

INSERT INTO modalities (category) VALUES ('Image'), ('Phrase');
