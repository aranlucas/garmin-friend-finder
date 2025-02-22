import db from "../src/lib/db";

async function initializeDatabase() {
  try {
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

    // Insert some sample data
    await db.run(`
      INSERT OR REPLACE INTO friends (id, name, short_name, latitude, longitude)
      VALUES 
        ('1', 'John Doe', 'John', 40.7128, -74.0060),
        ('2', 'Jane Smith', 'Jane', 34.0522, -118.2437),
        ('3', 'Bob Johnson', 'Bob', 51.5074, -0.1278)
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();
