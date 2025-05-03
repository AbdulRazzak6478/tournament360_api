const  AppErrorCode = {
    // Auth App Errors Codes
    InvalidAccessToken : "InvalidAccessToken",
    UserNotExist : "User Not Exist!",
    SessionExpired : "Session Expired! Please Login.",
    MissingAuthToken : "Missing Auth Token.",
    EmailNotRegistered : "Email Not Registered.",
    InvalidPassword: "Invalid Password.",
    EmailAlreadyRegistered : "Email Already Registered.",
    UserAlreadyExist : "User Already Exist.",
    InvalidEmail : "Invalid Email.",
    userRoleNotFound : "User Role Not Found.",
    YouAreNotAuthorized : "You Are Not Authorized.",
    participantsRange : "Participants range: 5 to 50.",
    sportNotFound : "Sport Not Found",
    unableToCreateTournament : "Unable to Create Tournament.",
    matchResultAlreadySet : "Match Result Already Set — Cannot Declare Again",
    invalidWinnerSelection : "Invalid Winner Selection",
    notAbleToCreateField : (field:string)=>(`Not Able to Create ${field}.`),
    fieldNotFound : (field:string)=>(`${field} Not Found.`),
    fieldNotExist:(field:string)=>(`${field} Not Exist.`),
    fieldIsRequired:(field:string)=>(`${field} is required.`),
    validFieldObjectIdIsRequired:(field:string)=>(`Valid ${field} as ObjectId is required.`),
    winnerNotDeclaredForField: (field:string)=>(`Winner Not Declared for ${field}.`),
    fieldMustBeaValidObjectId : (field:string)=>(`${field} Must Be A Valid ObjectId`)
}

export default AppErrorCode;