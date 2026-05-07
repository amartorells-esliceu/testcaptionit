CREATE TABLE room (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code CHAR(8) NOT NULL UNIQUE
);

CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    points INT NOT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    id_room INT, 
    FOREIGN KEY(id_room) REFERENCES room(id) ON DELETE CASCADE
);

CREATE TABLE modality (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(20) NOT NULL CHECK ( category IN ("Image", "Phrase"))
);

CREATE TABLE party (
    id INT AUTO_INCREMENT PRIMARY KEY,
    num_rounds TINYINT NOT NULL DEFAULT 3,
    max_players TINYINT NOT NULL DEFAULT 8,
    round_time SMALLINT NOT NULL DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    id_room INT, 
    id_modality INT,
    FOREIGN KEY(id_modality) REFERENCES modality(id),
    FOREIGN KEY(id_room) REFERENCES room(id)
);

CREATE TABLE round (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    id_party INT,
    FOREIGN KEY(id_party) REFERENCES party(id) ON DELETE CASCADE
);


