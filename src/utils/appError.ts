import AppErrorCode from "../constants/appErrorCode.js";

class AppError extends Error {
    public statusCode: number;
    public message: string;
    public errorCode : string | undefined;

    constructor(statusCode: number, message: string,errorCode ? : AppErrorCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errorCode = errorCode;

        // Maintain proper stack trace (especially for V8 engines like Node.js)
        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;
