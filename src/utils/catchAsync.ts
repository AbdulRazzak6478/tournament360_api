import { NextFunction, Request, Response } from "express";

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<Response | void>;

const catchAsync =
    (controller: AsyncController): (req: Request, res: Response, next: NextFunction) => Promise<void> =>
        async (req, res, next) => {
            try {
                await controller(req, res, next);
            } catch (error) {
                next(error);
            }
        };
export default catchAsync;
