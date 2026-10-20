export interface User {
  id: string;
  githubId: string;
  login: string | null;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface GithubProfile {
  githubId: string;
  login: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}
