-- Add required_documents and acceptance_criteria to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS required_documents jsonb,
ADD COLUMN IF NOT EXISTS acceptance_criteria text;

-- Add requires_documents flag to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS requires_documents boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS missing_fields jsonb,
ADD COLUMN IF NOT EXISTS document_requests jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_requires_documents ON applications(requires_documents) WHERE requires_documents = true;