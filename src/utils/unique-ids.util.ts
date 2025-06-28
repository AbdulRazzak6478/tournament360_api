

function generateOTP(): number {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
}

function generateUniqueReferenceID(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referenceID = '';
    for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referenceID += characters[randomIndex];
    }
    return referenceID;
}

async function generateCustomID() {
    return "ORG" + Date.now();
}

const generateTournamentID = (): string => {

    // Generate random number upto 6
    const randomValue = generateOTP()?.toString();

    // Date timestamp last 6 digits
    const dateNumber = Date.now().toString().slice(-6);

    return `TMT${randomValue}${dateNumber}`;
}



export { generateOTP, generateUniqueReferenceID, generateCustomID, generateTournamentID };