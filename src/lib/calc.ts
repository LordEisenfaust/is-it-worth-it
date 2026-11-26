/** Working hours needed to earn `amount` euros at `hourlyWage` euros per hour. */
export function hoursForAmount(amount: number, hourlyWage: number): number {
  if (!(hourlyWage > 0) || !Number.isFinite(hourlyWage)) return NaN;
  return amount / hourlyWage;
}
