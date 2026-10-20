import type { GithubIdentity, UserRepository } from "./ports";
import type { User } from "./user";

export function signInWithGithub(deps: {
  identity: GithubIdentity;
  users: UserRepository;
  newId: () => string;
  now: () => Date;
}) {
  return async (code: string): Promise<User> => {
    const profile = await deps.identity.profileFor(code);
    return deps.users.saveFromGithub(profile, { id: deps.newId(), createdAt: deps.now() });
  };
}
