import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

let db: Database | null = null;

async function initializeDb() {
  if (db) {
    return db;
  }

  db = await open({
    filename: "./friends.db",
    driver: sqlite3.Database,
  });

  // Create friends table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    )
  `);

  return db;
}

// Initialize the database
const database = await initializeDb();

if (!database) {
  throw new Error("Failed to initialize database");
}

export default database;
