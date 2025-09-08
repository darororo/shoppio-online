\c online_assistant;

-- 2. Create any additional extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Verify the database connection
SELECT current_database() as "Connected Database", 
       current_user as "Current User",
       version() as "PostgreSQL Version";

-- 4. Show success message
SELECT 'Database facebook_login_db is ready for use!' AS status;