import mongoose from "mongoose"
import { ISession } from "../models/session.model.js"
import env from "../constants/env.js"
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import catchErrorMsgAndStatusCode from "./catchError.js";
import AppError from "./appError.js";



export type refreshTokenPayload = {
    sessionId: ISession['_id'],
}

export type accessTokenPayload = {
    sessionId: ISession['_id'],
    userId: mongoose.Schema.Types.ObjectId,
}

type SignOptionsAndSecret = SignOptions & {
    secret: string
}

const defaultOptions: SignOptions = {
    audience: ['organizer'],
}

export const accessTokenOptions: SignOptionsAndSecret = {
    expiresIn: '3h',
    secret: env.JWT_ACCESS_SECRET
}
export const refreshTokenOptions: SignOptionsAndSecret = {
    expiresIn: '30d',
    secret: env.JWT_REFRESH_SECRET
}

export const signToken = (
    payload: refreshTokenPayload | accessTokenPayload,
    options?: SignOptionsAndSecret
) => {
    const { secret, ...signOpts } = options || accessTokenOptions;
    return jwt.sign(payload, secret, { ...defaultOptions, ...signOpts });
}

export const verifyToken = <TPayload extends object = accessTokenPayload>(
    token: string,
    options?: VerifyOptions & { secret: string }
) => {
    try {
        const { secret = env.JWT_ACCESS_SECRET, ...verifyOpts } = options || {};
        const data  = jwt.verify(token, secret, { ...defaultOptions, ...verifyOpts }) as TPayload;
        return {
            payload: data as TPayload
        };
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode,message);
    }
}