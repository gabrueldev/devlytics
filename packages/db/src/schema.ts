import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const trackedLinks = sqliteTable(
  "tracked_links",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    firstOpenedAt: integer("first_opened_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("tracked_links_site_slug_unique").on(table.siteId, table.slug)],
);
