import type { GithubProfile, User } from "./user";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  saveFromGithub(profile: GithubProfile, candidate: { id: string; createdAt: Date }): Promise<User>;
}

export interface GithubIdentity {
  profileFor(code: string): Promise<GithubProfile>;
}
