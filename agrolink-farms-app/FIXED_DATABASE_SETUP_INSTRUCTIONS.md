# Fixed Database Setup Instructions

The previous setup failed because it tried to modify Supabase's built-in `auth.users` table. Here's the corrected approach:

## Step 1: Run the Simple Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `SIMPLE_DATABASE_SETUP.sql`
4. Click **Run** to create the tables

This creates:
- `profiles` table (instead of modifying auth.users)
- `farms` table
- `animals` table  
- `orders` table
- All necessary RLS policies

## Step 2: Add the Seed Data

1. In the same SQL Editor
2. Copy and paste the contents of `SIMPLE_SEED_DATA.sql`
3. Click **Run** to populate with sample data

This adds:
- **5 test profiles** (sellers, buyers, admin)
- **5 Nigerian farms** (Kano, Ogun, Kaduna, Lagos, Plateau)
- **28 animals** across all 6 categories
- **3 sample orders**

## What You'll Get:

### **Animals by Category:**
- **Cows**: 5 animals (Holstein, Jersey, Sahiwal, Red Sindhi, Angus)
- **Goats**: 5 animals (Boer, Nubian, Kiko, Saanen, WAD Goat)  
- **Poultry**: 5 animals (Broiler, Layer Hens, Turkey, Guinea Fowl, Ducks)
- **Fish**: 4 animals (Catfish, Tilapia, Carp - fingerlings and mature)
- **Dogs**: 4 animals (German Shepherd, Rottweiler, Local Guard Dog, Boerboel)
- **Others**: 5 animals (Sheep, Pigs, Rabbits, Ostrich, Grasscutter)

### **Nigerian Farms:**
- Kano Livestock Farm (Kano State)
- Ogun Agro Ranch (Ogun State)
- Kaduna Heritage Farm (Kaduna State)
- Lagos Aquaculture Center (Lagos State)
- Plateau Poultry Farm (Plateau State)

## After Setup:

1. **Test the categories**: Visit http://localhost:3000 and click any category
2. **Browse animals**: Each category will show the relevant animals
3. **View details**: Click any animal to see full information
4. **Search functionality**: Use the search bar to find specific breeds

## Troubleshooting:

If you still get errors:
1. Make sure you're running the SQL in your Supabase project dashboard
2. Check that you have the correct project selected
3. Try running each section of the SQL separately if needed

## Note:

The application will automatically switch from mock data to real database data once the tables are created and populated. You'll see 28 animals instead of the 13 mock animals!

## Success Indicators:

After running both SQL files, you should see:
- "Database setup completed successfully!" 
- "Database populated successfully with 28 animals across 6 categories!"
- A summary showing counts of profiles, farms, animals, and orders