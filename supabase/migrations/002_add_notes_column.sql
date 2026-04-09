-- Add notes column to submissions for internal admin notes
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '{}';
