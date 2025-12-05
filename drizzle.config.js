// drizzle.config.js
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.js",
  out: "./drizzle/migrations",
  dialect: "sqlite",
});
