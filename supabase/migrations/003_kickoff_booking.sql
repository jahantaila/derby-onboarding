-- Add kickoff booking tracking to submissions
-- Ref: IMP-28

ALTER TABLE submissions
  ADD COLUMN kickoff_booked_at TIMESTAMPTZ;
