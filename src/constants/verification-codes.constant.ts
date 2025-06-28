const enum verificationCodeType {
    EmailVerification = 'email_verification',
    PasswordReset = 'password_reset',
    RegistrationCompleted = 'registration_completed',
    LoginVerification = 'login_verification'
}
export const enums = ['email_verification','password_reset','registration_completed','login_verification'];
export default verificationCodeType;