import { timingSafeEqual } from "node:crypto";

export function isAuthorizedCron(request: Request) {
  const configured = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !supplied) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function unauthorizedCron() {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
