/**
 * Deposit charged at public checkout, in euro cents.
 * A missing or zero deposit percent charges the whole stay.
 * Rounding is half-up (positive amounts).
 */
export function depositCents(totalEuros: number, depositPercent: number | null | undefined) {
  const percent = depositPercent && depositPercent > 0 ? depositPercent : 100;
  return Math.round((totalEuros * (percent / 100)) * 100);
}

export function depositEuros(totalEuros: number, depositPercent: number | null | undefined) {
  return depositCents(totalEuros, depositPercent) / 100;
}

/** Percent actually charged. Zero or missing means the full stay. */
export function chargedDepositPercent(depositPercent: number | null | undefined) {
  return depositPercent && depositPercent > 0 ? depositPercent : 100;
}
