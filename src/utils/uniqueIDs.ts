

export function generateOTP(): number {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

export function generateUniqueReferenceID(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referenceID = '';
    for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referenceID += characters[randomIndex];
    }
    return referenceID;
}

export async function generateCustomID(){
    return "ORG"+Date.now();
}

export default { generateOTP, generateUniqueReferenceID };