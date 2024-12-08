import type { Database } from "./db";

export type DBRow<Table> = Database["public"]["Tables"][Table]["Row"];
