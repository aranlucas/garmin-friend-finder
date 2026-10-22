INSERT INTO users (id, short_name) VALUES ('006-B4314-00', 'LA')
ON CONFLICT (id) DO NOTHING;
