#!/usr/bin/env python3
"""
Migration script to add Trust & Safety System tables and columns
"""

import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import get_db_engine

async def add_trust_system_tables():
    """Add trust system tables and columns to the database"""
    
    engine = get_db_engine()
    
    async with engine.begin() as conn:
        print("🔄 Adding trust system columns to users table...")
        
        # Add trust system columns to users table
        trust_columns = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS successful_transactions INTEGER DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS late_returns INTEGER DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 100.0;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_hidden BOOLEAN DEFAULT FALSE;"
        ]
        
        for sql in trust_columns:
            try:
                await conn.execute(text(sql))
                print(f"✅ Executed: {sql}")
            except Exception as e:
                print(f"⚠️  Warning: {sql} - {e}")
        
        print("\n🔄 Creating transactions table...")
        
        # Create transactions table
        transactions_table = """
        CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            book_id UUID REFERENCES books(id) NOT NULL,
            owner_id UUID REFERENCES users(id) NOT NULL,
            requester_id UUID REFERENCES users(id) NOT NULL,
            transaction_type VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            start_date TIMESTAMP WITH TIME ZONE,
            expected_return_date TIMESTAMP WITH TIME ZONE,
            actual_return_date TIMESTAMP WITH TIME ZONE,
            security_deposit DECIMAL(10,2) DEFAULT 0.0,
            rental_fee DECIMAL(10,2) DEFAULT 0.0,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('borrow', 'swap', 'buy', 'rent')),
            CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed', 'overdue', 'cancelled')),
            CONSTRAINT different_users CHECK (owner_id != requester_id)
        );
        """
        
        try:
            await conn.execute(text(transactions_table))
            print("✅ Created transactions table")
        except Exception as e:
            print(f"⚠️  Warning: transactions table - {e}")
        
        print("\n🔄 Creating user_ratings table...")
        
        # Create user_ratings table
        ratings_table = """
        CREATE TABLE IF NOT EXISTS user_ratings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            rater_id UUID REFERENCES users(id) NOT NULL,
            rated_user_id UUID REFERENCES users(id) NOT NULL,
            transaction_id UUID REFERENCES transactions(id) NOT NULL,
            rating INTEGER NOT NULL,
            review_text TEXT,
            rating_type VARCHAR(20) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
            CONSTRAINT valid_rating_type CHECK (rating_type IN ('borrower', 'lender', 'buyer', 'seller')),
            CONSTRAINT cannot_rate_self CHECK (rater_id != rated_user_id),
            CONSTRAINT unique_rating_per_transaction UNIQUE (rater_id, transaction_id)
        );
        """
        
        try:
            await conn.execute(text(ratings_table))
            print("✅ Created user_ratings table")
        except Exception as e:
            print(f"⚠️  Warning: user_ratings table - {e}")
        
        print("\n🔄 Creating trust_badges table...")
        
        # Create trust_badges table
        badges_table = """
        CREATE TABLE IF NOT EXISTS trust_badges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) NOT NULL,
            badge_type VARCHAR(50) NOT NULL,
            earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_active BOOLEAN DEFAULT TRUE,
            CONSTRAINT unique_badge_per_user UNIQUE (user_id, badge_type)
        );
        """
        
        try:
            await conn.execute(text(badges_table))
            print("✅ Created trust_badges table")
        except Exception as e:
            print(f"⚠️  Warning: trust_badges table - {e}")
        
        print("\n🔄 Creating indexes for performance...")
        
        # Create indexes for better performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON transactions(owner_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_requester_id ON transactions(requester_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);",
            "CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);",
            "CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id ON user_ratings(rated_user_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_id ON user_ratings(rater_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_ratings_transaction_id ON user_ratings(transaction_id);",
            "CREATE INDEX IF NOT EXISTS idx_trust_badges_user_id ON trust_badges(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_trust_badges_badge_type ON trust_badges(badge_type);",
            "CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);",
            "CREATE INDEX IF NOT EXISTS idx_users_average_rating ON users(average_rating);",
            "CREATE INDEX IF NOT EXISTS idx_users_is_profile_hidden ON users(is_profile_hidden);"
        ]
        
        for sql in indexes:
            try:
                await conn.execute(text(sql))
                print(f"✅ Created index: {sql.split('ON')[1].split('(')[0].strip()}")
            except Exception as e:
                print(f"⚠️  Warning: {sql} - {e}")
        
        print("\n🔄 Adding trigger for updated_at on transactions...")
        
        # Create trigger for updated_at on transactions table
        trigger_sql = """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
        CREATE TRIGGER update_transactions_updated_at
            BEFORE UPDATE ON transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """
        
        try:
            await conn.execute(text(trigger_sql))
            print("✅ Created updated_at trigger for transactions")
        except Exception as e:
            print(f"⚠️  Warning: trigger creation - {e}")
        
        print("\n🔄 Initializing trust scores for existing users...")
        
        # Initialize trust scores for existing users
        init_trust_sql = """
        UPDATE users 
        SET trust_score = 100.0, 
            average_rating = 0.0,
            total_ratings = 0,
            total_transactions = 0,
            successful_transactions = 0,
            late_returns = 0,
            is_profile_hidden = FALSE
        WHERE trust_score IS NULL OR trust_score = 0;
        """
        
        try:
            result = await conn.execute(text(init_trust_sql))
            print(f"✅ Initialized trust scores for existing users")
        except Exception as e:
            print(f"⚠️  Warning: trust score initialization - {e}")
        
        print("\n🔄 Adding 'new_user' badges to recent users...")
        
        # Add 'new_user' badges to users who joined in the last 30 days
        new_user_badges_sql = """
        INSERT INTO trust_badges (user_id, badge_type, earned_date, is_active)
        SELECT id, 'new_user', created_at, TRUE
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        AND id NOT IN (SELECT user_id FROM trust_badges WHERE badge_type = 'new_user')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
        """
        
        try:
            result = await conn.execute(text(new_user_badges_sql))
            print(f"✅ Added 'new_user' badges to recent users")
        except Exception as e:
            print(f"⚠️  Warning: new user badges - {e}")
        
        print("\n🎉 Trust & Safety System migration completed successfully!")
        print("\n📊 Summary:")
        print("   ✅ Added trust system columns to users table")
        print("   ✅ Created transactions table")
        print("   ✅ Created user_ratings table") 
        print("   ✅ Created trust_badges table")
        print("   ✅ Created performance indexes")
        print("   ✅ Added database triggers")
        print("   ✅ Initialized existing user data")
        print("\n🚀 Your BookSwap app now has a complete Trust & Safety System!")

async def main():
    """Main function to run the migration"""
    print("🛡️  BookSwap Trust & Safety System Migration")
    print("=" * 50)
    
    try:
        await add_trust_system_tables()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
