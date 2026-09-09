/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-09
 *
 * Express 4 does not catch rejected promises from async handlers. Wrap every
 * async controller in this so a rejection reaches the JSON error handler in
 * src/index.ts instead of hanging the request.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler<P> = (req: Request<P>, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler<P>(fn: AsyncRequestHandler<P>): RequestHandler<P> {
  return (req, res, next): void => {
    fn(req, res, next).catch(next);
  };
}
