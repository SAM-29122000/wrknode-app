// Discovery and reply-check are triggered by an external scheduler (e.g.
// cron-job.org) hitting these routes on a timer, not by a logged-in user —
// so they're gated by a shared secret header instead of a session.
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.JOB_AGENT_CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}
