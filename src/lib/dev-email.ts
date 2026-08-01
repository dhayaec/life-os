// Dev-only email sink — logs the link instead of sending. Swap for a real provider later.
export function sendDevEmail(subject: string, url: string): void {
  // eslint-disable-next-line no-console
  console.log(`[LifeOS dev email]\n  Subject: ${subject}\n  ${url}`);
}
