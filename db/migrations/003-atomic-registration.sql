-- Consume every pending code for a newly registered user in the INSERT's own transaction.
-- This keeps request handlers from sharing a manually opened connection-wide transaction.
CREATE INDEX verification_codes_user_id ON verification_codes(user_id);

CREATE TRIGGER consume_registration_codes
AFTER INSERT ON users
BEGIN
    DELETE FROM verification_codes WHERE user_id = NEW.id;
END;
