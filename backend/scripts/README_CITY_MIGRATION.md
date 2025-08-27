# City Normalization Migration

## Problem
Users could enter city names with different cases (e.g., "Delhi", "delhi", "DELHI"), causing issues with city-based book searches and user matching.

## Solution
1. **Fixed signup endpoint** - All new city names are now stored in lowercase
2. **Migration script** - Normalizes existing city names in the database

## Running the Migration

### Option 1: From the backend directory
```bash
cd backend
python scripts/normalize_cities.py
```

### Option 2: From the project root
```bash
cd backend && python scripts/normalize_cities.py
```

## What the Migration Does
- Finds all users with city information
- Converts city names to lowercase and trims whitespace
- Updates the database with normalized city names
- Provides detailed logging of all changes
- Safely handles errors with rollback functionality

## After Migration
- All city names will be stored in lowercase (e.g., "delhi", "mumbai", "bangalore")
- City-based searches will work correctly regardless of how users originally entered their city
- New user registrations automatically normalize city names

## Verification
After running the migration, you can verify it worked by:
1. Checking the database directly
2. Testing book searches between users in the same city
3. Verifying that users with previously different-cased city names can now find each other's books

## Safety
- The script includes error handling and rollback functionality
- It shows exactly what changes will be made before applying them
- Can be run multiple times safely (idempotent)
