-- V2: Allow guest try-on history (user_id optional)
ALTER TABLE try_on_history ALTER COLUMN user_id DROP NOT NULL;
