import type { GithubProfile, User, UserRepository } from "@devlytics/core";
import { schema, type Database } from "@devlytics/db";
import { eq } from "drizzle-orm";

const { users } = schema;

export class D1UserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    return (await this.db.select().from(users).where(eq(users.id, id)).get()) ?? null;
  }

  async saveFromGithub(profile: GithubProfile, candidate: { id: string; createdAt: Date }): Promise<User> {
    const details = {
      login: profile.login,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    };

    const [user] = await this.db
      .insert(users)
      .values({ id: candidate.id, githubId: profile.githubId, createdAt: candidate.createdAt, ...details })
      .onConflictDoUpdate({ target: users.githubId, set: details })
      .returning();
    if (user === undefined) throw new Error(`Could not save GitHub user ${profile.githubId}`);

    return user;
  }
}
