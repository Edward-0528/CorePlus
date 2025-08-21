-- Add new nutrition columns to meals table
ALTER TABLE meals ADD COLUMN fiber DECIMAL(5,2) DEFAULT 0;
ALTER TABLE meals ADD COLUMN sugar DECIMAL(5,2) DEFAULT 0; 
ALTER TABLE meals ADD COLUMN sodium DECIMAL(7,2) DEFAULT 0;

-- Update any existing meals to have default values for new columns
UPDATE meals SET 
  fiber = 0,
  sugar = 0, 
  sodium = 0
WHERE fiber IS NULL OR sugar IS NULL OR sodium IS NULL;
