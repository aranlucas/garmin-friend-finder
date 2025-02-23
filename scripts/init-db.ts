import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

async function initializeDatabase() {
  try {
    const db = await open({
      filename: "./friends.db",
      driver: sqlite3.Database,
    });

    // Create the friends table
    await db.run(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        latitude REAL,
        longitude REAL
      )
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();
