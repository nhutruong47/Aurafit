-- V3: Auth hardening
-- token_version lets logout/password-reset invalidate every existing refresh token.
-- purpose separates registration OTPs from password-reset OTPs.

ALTER TABLE public."user"
    ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.otp_verifications
    ADD COLUMN IF NOT EXISTS purpose VARCHAR(20) NOT NULL DEFAULT 'REGISTRATION';
