import sqlite3 from "sqlite3";
import { type Database, open } from "sqlite";

declare global {
  var dbPromise: Promise<Database> | undefined;
}

function createConnection(): Promise<Database> {
  return open({
    filename: "./friends.db",
    driver: sqlite3.Database,
  });
}

export function getDb(): Promise<Database> {
  globalThis.dbPromise ??= createConnection();
  return globalThis.dbPromise;
}
