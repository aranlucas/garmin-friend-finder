-- Adopt databases created by the former initializer without replacing their data.
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    short_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
    user_id TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS verification_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
