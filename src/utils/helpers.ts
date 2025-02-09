import bcrypt from 'bcryptjs';



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
        if(error instanceof Error)
        {
            console.log("Error in compare password : ",error?.message);
            throw new Error(error?.message);
        }
    }
}