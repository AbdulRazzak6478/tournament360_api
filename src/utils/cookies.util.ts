import { CookieOptions, Response } from "express";
import env from "../constants/env.constant.js";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date-handlers.util.js";


const secure = env.NODE_ENV !== "DEV";

const defaultOptions: CookieOptions = {
    sameSite: "strict",
    httpOnly: true,
    secure
};

const getAccessTokenCookieOptions = (): CookieOptions => ({
    ...defaultOptions,
    expires: fifteenMinutesFromNow()
});

const getRefreshTokenCookieOptions = (): CookieOptions => ({
    ...defaultOptions,
    expires: thirtyDaysFromNow(),
    path: '/auth/refresh'
});

type Params = {
    res: Response,
    accessToken: string,
    refreshToken: string
}

const setAuthCookies = ({ res, accessToken, refreshToken }: Params) => {
    return res.cookie("accessToken", accessToken, getAccessTokenCookieOptions()).cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
}

const clearAuthCookies = (res: Response) => (
    res.clearCookie("accessToken").clearCookie("refreshToken", { path: '/auth/refresh' })
)
export {
    setAuthCookies,
    clearAuthCookies
}
