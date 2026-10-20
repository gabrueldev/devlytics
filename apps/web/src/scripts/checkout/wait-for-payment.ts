const pollEveryMs = 3000;

export function waitForPayment(
  isPaid: () => Promise<boolean>,
  until: Date | null,
  onPaid: () => void,
  onExpired: () => void,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const check = async () => {
    if (stopped) return;
    if (await isPaid()) return onPaid();
    if (until !== null && Date.now() > until.getTime()) return onExpired();
    timer = setTimeout(check, pollEveryMs);
  };
  timer = setTimeout(check, pollEveryMs);

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
