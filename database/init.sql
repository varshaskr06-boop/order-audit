-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Database Initialization Script
-- ============================================================================

-- If you are running PostgreSQL locally via psql or pgAdmin:
-- 1. Connect to PostgreSQL server (default database 'postgres'):
--    psql -U postgres

-- 2. Create the application database:
CREATE DATABASE food_mfg_db
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    CONNECTION LIMIT = -1;

-- 3. Connect to the new database:
\c food_mfg_db;

-- 4. Next, execute schema.sql and seed.sql:
--    \i schema.sql
--    \i seed.sql
