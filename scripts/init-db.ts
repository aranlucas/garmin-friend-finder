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
        name TEXT NOT NULL
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

    // Insert sample data
    await db.run("BEGIN TRANSACTION");
    try {
      // Sample users
      await db.run(
        `INSERT OR REPLACE INTO users (id, name) VALUES 
         ('006-B3906-00', 'Lucas Arango'),
         ('006-B4314-00', 'Case Wright')`
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
