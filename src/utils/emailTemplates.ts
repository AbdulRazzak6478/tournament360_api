

const sentOtpEmailVerifyTemplate = (OTP: number, email: string) => {
    return `
         <!DOCTYPE html>
         <html lang="en">
         <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification OTP</title>
            <style>
               body {
                     font-family: Arial, sans-serif;
                     background-color: rgb(251, 97, 8);
                     margin: 0;
                     padding: 0;
                     display: flex;
                     justify-content: center;
                     align-items: center;
                     height: 100vh;
               }
               .container {
                     background-color: white;
                     padding: 20px;
                     border-radius: 5px;
                     box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                     max-width: 600px;
                     text-align: center;
                     border-top: 10px solid rgb(251, 97, 8);
               }
               .header {
                     background-color: rgb(251, 97, 8);
                     color: white;
                     padding: 10px 0;
                     border-radius: 5px 5px 0 0;
                     font-size: 24px;
               }
               .content {
                     padding: 20px;
               }
               .otp {
                     font-size: 24px;
                     font-weight: bold;
                     margin: 20px 0;
                     color: rgb(251, 97, 8);
               }
               .footer {
                     margin-top: 20px;
                     font-size: 12px;
                     color: #888888;
               }
               .btn {
                     display: inline-block;
                     padding: 10px 20px;
                     margin: 20px 0;
                     background-color: rgb(251, 97, 8);
                     color: white;
                     text-decoration: none;
                     border-radius: 5px;
               }
            </style>
         </head>
         <body>
            <div class="container">
               <div class="header">
                    Tournament360
               </div>
               <div class="content">
                     <p>Dear ${email},</p>
                     <p>We received a request to verify your email for the <b>Tournament360 </b> Platform. Your One-Time Password (OTP) is:</p>
                     <p class="otp"><b>${OTP}</b></p>
                     <p>Please enter this OTP in the platform to verify your email to create account in our platform.</p>
                    
                     <p>If you did not request this, please ignore this email or contact our support team.</p>
               </div>
               <div class="footer">
                     <p>© ${new Date().getFullYear()} Tournament360. All rights reserved.</p>
               </div>
            </div>
         </body>
         </html>
      `
};

const sentLoginVerifyOTPTemplate = (OTP:number,name:string)=>{
      return `
            <p>Dear ${name}, </p>
            <p>Your login Verify OTP is : ${OTP}


            <h1>Tournament360 </p>
      `;
}

export  {
    sentOtpEmailVerifyTemplate,
    sentLoginVerifyOTPTemplate,
}