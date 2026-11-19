import "reflect-metadata";
import type { Express } from "express";
import { createExpressHandler } from "../dist/src/app-factory";

let handlerPromise: Promise<Express> | undefined;

export default async function handler(
  req: Parameters<Express>[0],
  res: Parameters<Express>[1],
) {
  handlerPromise ??= createExpressHandler();
  const app = await handlerPromise;
  app(req, res);
}
