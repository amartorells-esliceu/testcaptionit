CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code CHAR(8) NOT NULL UNIQUE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    is_host BOOLEAN DEFAULT FALSE,
    room_id INT, 
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    room_id INT,
    points INT NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE(user_id, room_id)
);

CREATE TABLE modalities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(20) NOT NULL CHECK ( category IN ("Image", "Phrase"))
);

CREATE TABLE parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    num_rounds TINYINT NOT NULL DEFAULT 3,
    max_players TINYINT NOT NULL DEFAULT 8,
    round_time SMALLINT NOT NULL DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, 
    room_id INT,
    modality_id INT,
    FOREIGN KEY(modality_id) REFERENCES modalities(id) ON DELETE RESTRICT,
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    modality_id INT,
    FOREIGN KEY (modality_id) REFERENCES modalities(id) ON DELETE CASCADE
);

CREATE TABLE rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    party_id INT,
    FOREIGN KEY(party_id) REFERENCES parties(id) ON DELETE CASCADE
);

CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    round_id INT,
    user_id INT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    answer_id INT,
    user_id INT,
    FOREIGN KEY(answer_id) REFERENCES answers(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (answer_id, user_id) 
);

INSERT INTO modalities (category) VALUES ('Image'), ('Phrase');