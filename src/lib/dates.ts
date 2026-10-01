// All date math is done in UTC so daylight-saving changes can never shift a day.

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysInYear(year: number): number {
  return (utcDate(year + 1, 1, 1).getTime() - utcDate(year, 1, 1).getTime()) / 86_400_000;
}

/** Weekday numbers follow JavaScript: 0 = Sunday ... 6 = Saturday. */
export function countWeekdaysInYear(year: number, weekdays: readonly number[]): number {
  const wanted = new Set(weekdays);
  const total = daysInYear(year);
  const start = utcDate(year, 1, 1);
  let count = 0;
  for (let i = 0; i < total; i++) {
    if (wanted.has(addDays(start, i).getUTCDay())) count++;
  }
  return count;
}
