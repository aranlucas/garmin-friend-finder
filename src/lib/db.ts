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

  return db;
}

// Initialize the database
const database = await initializeDb();

if (!database) {
  throw new Error("Failed to initialize database");
}

export default database;
