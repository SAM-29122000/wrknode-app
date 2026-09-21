// The discover run is meant to operate 8:00am-12:00pm IST, run as often
// as the external cron scheduler pings it (every 15-30 min is a sane
// choice — see README). Rather than trust the scheduler's own timing to
// be exact, this is enforced server-side too: a ping outside the window
// is a harmless no-op. Applying (the WhatsApp-approval send) is NOT
// gated by this — a reply to an already-queued match should still work
// at any hour.
export function isWithinDiscoveryWindow(): boolean {
  const startHour = Number(process.env.JOB_AGENT_WINDOW_START_HOUR ?? "8");
  const endHour = Number(process.env.JOB_AGENT_WINDOW_END_HOUR ?? "12");

  const istHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );

  return istHour >= startHour && istHour < endHour;
}
