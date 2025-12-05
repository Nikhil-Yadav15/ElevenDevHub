// src/lib/db/index.js
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.js";

// Export all tables from schema
export * from "./schema.js";

// Export all helper functions
export * from "./helpers.js";

/**
 * Get database instance from Cloudflare environment
 * @param {Object} env - Cloudflare environment with DB binding
 * @returns {Object} Drizzle database instance with schema
 */
export function getDB(env) {
  return drizzle(env.DB, { schema });
}
