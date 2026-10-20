const unknownCountryCodes = new Set(["XX", "T1"]);

export class Formatter {
  private readonly numbers: Intl.NumberFormat;
  private readonly days: Intl.DateTimeFormat;
  private readonly regions: Intl.DisplayNames | null;
  private readonly moments: Intl.DateTimeFormat;

  constructor(readonly locale: string) {
    this.numbers = new Intl.NumberFormat(locale);
    this.days = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
    this.moments = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    try {
      this.regions = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      this.regions = null;
    }
  }

  count(value: number): string {
    return this.numbers.format(value);
  }

  duration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
  }

  day(isoDay: string): string {
    return this.days.format(new Date(`${isoDay}T00:00:00Z`));
  }

  moment(iso: string): string {
    return this.moments.format(new Date(iso));
  }

  country(code: string): string | null {
    if (!/^[A-Z]{2}$/.test(code) || unknownCountryCodes.has(code)) return null;
    try {
      return this.regions?.of(code) ?? code;
    } catch {
      return code;
    }
  }
}
