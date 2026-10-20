import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  githubId: text("github_id").notNull().unique(),
  login: text("login"),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  isSupporter: integer("is_supporter", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const coffees = sqliteTable("coffees", {
  orderId: text("order_id").primaryKey(),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  reversedAt: integer("reversed_at", { mode: "timestamp_ms" }),
});
