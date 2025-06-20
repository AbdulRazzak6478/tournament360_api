import assert from "node:assert";
import AppError from "./appError.js";
import { httpStatusCodeType } from "../constants/statusCodes.js";


type assertType = (
    condition: any,
    httpStatusCode: httpStatusCodeType,
    message: string,
    appErrorCode?: string
) => asserts condition;


/**
 * Assert a condition and throw an error if the condition is falsy;
 */

const appErrorAssert: assertType = (
    condition,
    httpStatusCode,
    message,
    appErrorCode
) => assert(condition,new AppError(httpStatusCode,message, appErrorCode));

export default appErrorAssert;
