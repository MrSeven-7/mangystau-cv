import type { Express } from "express";
import { handleVercelRequest } from "../../../../dist/src/vercel-handler";

export default function handler(
  req: Parameters<Express>[0],
  res: Parameters<Express>[1],
) {
  return handleVercelRequest(req, res);
}
