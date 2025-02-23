import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

async function initializeDatabase() {
  try {
    const db = await open({
      filename: "./friends.db",
      driver: sqlite3.Database,
    });

    // Create the users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        short_name TEXT NOT NULL
      )
    `);

    // Create the locations table
    await db.run(`
      CREATE TABLE IF NOT EXISTS locations (
        user_id TEXT PRIMARY KEY,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create the verification codes table
    await db.run(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert sample data
    await db.run("BEGIN TRANSACTION");
    try {
      // Sample users
      await db.run(
        `INSERT OR REPLACE INTO users (id, short_name) VALUES 
         ('006-B4314-00', 'LA')`
      );

      await db.run("COMMIT");
      console.log("Sample data inserted successfully");
    } catch (error) {
      await db.run("ROLLBACK");
      throw error;
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();
