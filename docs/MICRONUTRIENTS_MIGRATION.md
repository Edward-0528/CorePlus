# Database Migration: Adding Micronutrients Support

This guide explains how to add calcium, iron, and vitamin C tracking to your Core+ app's Supabase database.

## Required Database Changes

### 1. Run the Migration Script

Execute the migration script in your Supabase SQL editor:

```sql
-- File: database/add_micronutrients_migration.sql
-- This script will add three new columns to your meals table:
-- - calcium (decimal)
-- - iron (decimal) 
-- - vitamin_c (decimal)
```

### 2. Verify the Migration

After running the migration, verify the new columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'meals' 
AND column_name IN ('calcium', 'iron', 'vitamin_c');
```

### 3. Test Data Flow

To test that everything is working:

1. **Add a meal** using the app (camera scan or manual entry)
2. **Check the database** to ensure the new micronutrient values are stored
3. **Verify the UI** shows the real data in the 3x3 nutrition grid

## Database Schema

After migration, your `meals` table will include:

### Existing Columns
- `fiber` (decimal) - Fiber content in grams
- `sugar` (decimal) - Sugar content in grams  
- `sodium` (decimal) - Sodium content in milligrams

### New Columns
- `calcium` (decimal) - Calcium content in milligrams
- `iron` (decimal) - Iron content in milligrams
- `vitamin_c` (decimal) - Vitamin C content in milligrams

## Data Flow

```
Food Input → AI Analysis → App Processing → Supabase Storage
     ↓           ↓              ↓              ↓
Camera/Text → Gemini API → mealService → meals table
```

### Field Mapping

| App Field | Database Field | Unit | Daily Target |
|-----------|----------------|------|--------------|
| `vitaminC` | `vitamin_c` | mg | 90mg |
| `calcium` | `calcium` | mg | 1000mg |
| `iron` | `iron` | mg | 18mg |

## Troubleshooting

### If migration fails:
1. Check you have proper database permissions
2. Ensure the `meals` table exists
3. Verify no conflicting column names

### If data isn't saving:
1. Check browser console for mealService errors
2. Verify Supabase RLS policies allow inserts
3. Test with a simple manual meal entry

### If UI shows 0 values:
1. Ensure the context mapping is correct (`vitamin_c` → `vitaminC`)
2. Check that AI analysis is returning micronutrient data
3. Verify the calculation totals in DailyCaloriesContext

## Benefits

After this migration, users will get:
- **Real-time micronutrient tracking** from actual food data
- **AI-powered nutrition estimates** for calcium, iron, and vitamin C
- **Visual progress tracking** in the 3x3 nutrition grid
- **Historical nutrition data** stored permanently in Supabase

The system will now provide comprehensive nutrition tracking beyond just macronutrients!
