import sqlite3 from "sqlite3";
import { Database } from "sqlite3";

class SQLiteDB {
  private db: Database;

  constructor() {
    this.db = new sqlite3.Database("./friends.db");
    this.initialize();
  }

  private initialize() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        latitude REAL,
        longitude REAL
      )
    `);
  }

  async get<T>(query: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        resolve(row as T);
      });
    });
  }

  async all<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows as T[]);
      });
    });
  }

  async run(query: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

const db = new SQLiteDB();
export default db;
