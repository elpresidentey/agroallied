# Database Setup Instructions

To populate the animals data and make the category links work, you need to set up the database tables and seed data.

## Step 1: Set up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the contents of `database-setup.sql` to create the tables

## Step 2: Add Seed Data

1. In the same SQL Editor
2. Run the contents of `COMPREHENSIVE_SEED_DATA.sql` to populate the database with sample animals

This will create:
- **28 animals** across all categories (cows, goats, poultry, fish, dogs, others)
- **5 farms** with Nigerian locations
- **5 test users** (sellers, buyers, admin)
- **Sample orders** for testing

## Categories and Animal Counts:

- **Cows**: 5 animals (Holstein, Jersey, Sahiwal, Red Sindhi, Angus)
- **Goats**: 5 animals (Boer, Nubian, Kiko, Saanen, WAD Goat)
- **Poultry**: 5 animals (Broiler, Layer Hens, Turkey, Guinea Fowl, Ducks)
- **Fish**: 4 animals (Catfish, Tilapia, Carp fingerlings and mature fish)
- **Dogs**: 4 animals (German Shepherd, Rottweiler, Local Guard Dog, Boerboel)
- **Others**: 5 animals (Sheep, Pigs, Rabbits, Ostrich, Grasscutter)

## After Setup:

1. The category links in the homepage will work
2. Clicking "Cows" will show 5 cow listings
3. Clicking "Goats" will show 5 goat listings
4. And so on for all categories

## Test the Setup:

1. Visit http://localhost:3000
2. Click on any category (Cows, Goats, etc.)
3. You should see animals listed for that category
4. Click on any animal to view details

## Note:

The application is currently configured to work with your Supabase database at:
- URL: `https://fglckzdralgacmyubwai.supabase.co`
- The environment variables are already set in `.env.local`

Just run the SQL scripts in your Supabase dashboard to populate the data!