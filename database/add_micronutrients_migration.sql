-- Migration: Add calcium, iron, and vitamin_c columns to meals table
-- This script adds the new micronutrient columns to support comprehensive nutrition tracking

-- Add calcium column (in mg)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meals' AND column_name = 'calcium'
    ) THEN
        ALTER TABLE meals ADD COLUMN calcium DECIMAL(8,2) DEFAULT 0;
        COMMENT ON COLUMN meals.calcium IS 'Calcium content in milligrams';
    END IF;
END $$;

-- Add iron column (in mg)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meals' AND column_name = 'iron'
    ) THEN
        ALTER TABLE meals ADD COLUMN iron DECIMAL(8,2) DEFAULT 0;
        COMMENT ON COLUMN meals.iron IS 'Iron content in milligrams';
    END IF;
END $$;

-- Add vitamin_c column (in mg)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meals' AND column_name = 'vitamin_c'
    ) THEN
        ALTER TABLE meals ADD COLUMN vitamin_c DECIMAL(8,2) DEFAULT 0;
        COMMENT ON COLUMN meals.vitamin_c IS 'Vitamin C content in milligrams';
    END IF;
END $$;

-- Create index for better query performance on the new columns
CREATE INDEX IF NOT EXISTS idx_meals_calcium ON meals(calcium);
CREATE INDEX IF NOT EXISTS idx_meals_iron ON meals(iron);
CREATE INDEX IF NOT EXISTS idx_meals_vitamin_c ON meals(vitamin_c);

-- Update RLS (Row Level Security) policies if they exist
-- Note: This assumes RLS policies already exist for the meals table
-- If you have custom RLS policies, you may need to update them to include the new columns

COMMENT ON TABLE meals IS 'Updated to include comprehensive micronutrient tracking: calcium, iron, and vitamin C';
