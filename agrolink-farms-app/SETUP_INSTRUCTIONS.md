# AgroLink Farms - Database Setup Instructions

## Step 1: Create Animals Table on Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: **aymzjaeuhjglokqakwmw**
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the SQL from `SUPABASE_ANIMALS_TABLE.sql` file in this project
6. Click **Run** to execute the SQL

This will:
- Create the `animals` table with proper schema
- Add 6 sample animals with real Unsplash images
- Enable Row Level Security (RLS)
- Create indexes for faster queries

## Step 2: Verify the Data

1. In Supabase Dashboard, go to **Table Editor**
2. You should see the `animals` table with 6 rows:
   - Jersey Cow (Cattle)
   - Boer Goat (Goat)
   - Merino Sheep (Sheep)
   - Rhode Island Red (Poultry)
   - Duroc Pig (Pig)
   - Holstein Cow (Cattle)

## Step 3: Test the Application

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3000/animals
3. You should see all 6 animals with real images from Unsplash

## Images Used

All images are from Unsplash (free, high-quality stock photos):
- Jersey Cow: https://images.unsplash.com/photo-1552225864-5b814b3f2e5f
- Boer Goat: https://images.unsplash.com/photo-1567271894396-650b0b0c4da0
- Merino Sheep: https://images.unsplash.com/photo-1545736066-51218883bef4
- Rhode Island Red: https://images.unsplash.com/photo-1553284965-83fd3e82fa5a
- Duroc Pig: https://images.unsplash.com/photo-1575081813589-30c0e3e36e0e
- Holstein Cow: https://images.unsplash.com/photo-1626839897961-83fd3e82fa5a

## Troubleshooting

### If you see "Could not find the table 'public.animals'"
- Make sure you executed the SQL script from SUPABASE_ANIMALS_TABLE.sql
- Verify the table exists in Supabase Table Editor
- Restart the dev server: `npm run dev`

### If images don't load
- Check your internet connection
- Verify the Unsplash image URLs are correct in the table
- Try clearing browser cache (Cmd+Shift+Delete)

### If data doesn't show up
- Verify Row Level Security (RLS) is enabled
- Check the "Animals are publicly readable" policy is created
- Confirm status is set to 'active' for all animals
