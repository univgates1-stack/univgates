-- Make application_id nullable in documents table for profile documents
ALTER TABLE documents ALTER COLUMN application_id DROP NOT NULL;