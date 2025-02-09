import bcrypt from 'bcryptjs';
import catchErrorMsgAndStatusCode from './catchError.js';
import AppError from './appError.js';



/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hash - The hashed password.
 * @returns A promise that resolves to true if the passwords match, otherwise false.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean | void> {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch (error) {
        if (error instanceof Error) {
            console.log("Error in compare password : ", error?.message);
            throw new Error(error?.message);
        }
    }
}

export async function hashPassword(password:string) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt); // Directly use 'this'
        return hashPassword;
    } catch (error: unknown) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode,message);
    }
}