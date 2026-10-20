export type SqlRow = Record<string, unknown>;

export interface SqlRunner {
  query(sql: string): Promise<SqlRow[]>;
}

export class AnalyticsEngineQueryError extends Error {
  override readonly name = "AnalyticsEngineQueryError";

  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Analytics Engine SQL API answered ${status}`);
  }
}

export class AnalyticsEngineSqlClient implements SqlRunner {
  constructor(
    private readonly accountId: string,
    private readonly apiToken: string,
  ) {}

  async query(sql: string): Promise<SqlRow[]> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/analytics_engine/sql`,
      { method: "POST", headers: { Authorization: `Bearer ${this.apiToken}` }, body: sql },
    );
    if (!response.ok) throw new AnalyticsEngineQueryError(response.status, await response.text());

    const result: { data?: SqlRow[] } = await response.json();
    return result.data ?? [];
  }
}
