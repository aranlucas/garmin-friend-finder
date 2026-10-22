-- A verification code exists before registration creates its user.
CREATE TABLE pending_verification_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pending_verification_codes (code, user_id, created_at)
SELECT code, user_id, created_at FROM verification_codes;

DROP TABLE verification_codes;
ALTER TABLE pending_verification_codes RENAME TO verification_codes;
