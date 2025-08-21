-- Create database manually if needed:
-- CREATE DATABASE recipes_db;

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  cuisine VARCHAR(100),
  title VARCHAR(255),
  rating REAL,
  prep_time INTEGER,
  cook_time INTEGER,
  total_time INTEGER,
  description TEXT,
  nutrients JSONB,
  serves VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes (rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes (cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes (title);
CREATE INDEX IF NOT EXISTS idx_recipes_nutrients ON recipes USING GIN (nutrients);
