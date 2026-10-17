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

BEGIN TRANSACTION;
INSERT OR REPLACE INTO users (id, short_name) VALUES ('006-B4314-00', 'LA');
COMMIT;

SELECT 'Sample data inserted successfully';
SELECT 'Database initialized successfully';
