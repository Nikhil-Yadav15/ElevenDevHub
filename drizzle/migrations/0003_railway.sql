-- Add project type column (defaulting to frontend for existing projects)
ALTER TABLE projects ADD COLUMN `type` text DEFAULT 'frontend' NOT NULL;

-- Add Railway specific columns (nullable)
ALTER TABLE projects ADD COLUMN `railway_service_id` text;
ALTER TABLE projects ADD COLUMN `railway_env_id` text;

-- Add generic production URL column
ALTER TABLE projects ADD COLUMN `production_url` text;

-- Note: We are keeping cf_project_name/cf_subdomain as NOT NULL to avoid 
-- complex table recreation. For backend projects, we will store "N/A" 
-- in these fields.