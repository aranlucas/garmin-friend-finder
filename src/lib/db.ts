import sqlite3 from "sqlite3";
import { type Database, open } from "sqlite";

const globalForDb = globalThis as unknown as {
  __dbPromise?: Promise<Database>;
};

function createConnection(): Promise<Database> {
  return open({
    filename: "./friends.db",
    driver: sqlite3.Database,
  });
}

export function getDb(): Promise<Database> {
  if (!globalForDb.__dbPromise) {
    globalForDb.__dbPromise = createConnection();
  }
  return globalForDb.__dbPromise;
}
