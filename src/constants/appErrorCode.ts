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
    notAbleToCreateField : (field:string)=>(`Not Able to Create ${field}.`),
    fieldNotFound : (field:string)=>(`${field} Not Found.`),
    fieldNotExist:(field:string)=>(`${field} Not Exist.`),
    validFieldObjectIdIsRequired:(field:string)=>(`Valid ${field} ObjectId is required.`)
}

export default AppErrorCode;