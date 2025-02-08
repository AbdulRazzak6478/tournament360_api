import statusCodes from "../constants/statusCodes.js";
import AppError from "./appError.js";




type catchObj = {
    message: string,
    statusCode: number
}

const catchErrorMsgAndStatusCode = (error: unknown, msg?: string, code?: number): catchObj => {
    let message: string = "";
    let statusCode: number = statusCodes.INTERNAL_SERVER_ERROR;
    if (error instanceof AppError) {
        message = error.message;
        statusCode = error.statusCode;
    } else if (error instanceof Error) {
        message = error?.message;
    } else if (error && typeof error === "object" && "message" in error) {
        message = String(error.message);
    }
    else if (error && typeof error === "string") {
        message = error;
    } else {
        message = msg || "Something Went Wrong";
        statusCode = code || statusCode;
    }

    return {
        message,
        statusCode
    }
}

export default catchErrorMsgAndStatusCode;