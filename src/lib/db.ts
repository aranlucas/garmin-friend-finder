class DB {
  private store: Map<string, any> = new Map();

  get<T>(key: string): T | null {
    return this.store.get(key) || null;
  }

  set(key: string, value: any): void {
    this.store.set(key, value);
  }
}

const db = new DB();
export default db;
