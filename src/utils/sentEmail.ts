import nodemailer from 'nodemailer';
import env from '../constants/env.js';
import AppError from './appError.js';
import statusCodes from '../constants/statusCodes.js';
import Brevo, { TransactionalEmailsApi } from "@getbrevo/brevo";
import { sentOtpEmailVerifyTemplate } from './emailTemplates.js';

// nodemailer setup
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS
    },
})

// brevo setup

// Create an instance of the transactional email API
const emailApi = new TransactionalEmailsApi();
emailApi.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);

// const emailApi = new Brevo.TransactionalEmailsApi(brevoClient);

export const sentOtpEmail = async (email: string, otp: string) => {
    try {
        const response = await transporter.sendMail({
            from: env.EMAIL_USER,
            // to: 'abdulrazzak4186@gmail.com',
            // to: 'abbaskhan3977@gmail.com',
            // to: "abdulrazzak@skygoalnext.com",
            to: email,
            subject: 'Tournament360 - Email Verification',
            html: `
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
                     <p>Hello ${"Mohammed"},</p>
                     <p>We received a request to verify your email for the <b>Tournament360 </b> Platform. Your One-Time Password (OTP) is:</p>
                     <p class="otp"><b>${otp}</b></p>
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
        });
        console.log("Email sent : ", response);
    } catch (error) {
        console.log("error :", error);
        if (error instanceof Error) {
            throw new AppError(statusCodes.BAD_REQUEST, error?.message);
        } else {
            throw error;
        }
    }

}

export const sendEmail = async (toEmail: string, toName: string, subject: string, htmlContent: string) => {
    try {
        let emailData = new Brevo.SendSmtpEmail();
        emailData = {
            sender: { name: "Tournament360", email: "abdulrazzak4186@gmail.com" },
            to: [{ email: toEmail, name: toName }],
            subject: subject,
            htmlContent: htmlContent,
            // template : 1
            // params: {
            //     otp: "789012",
            // },
        };

        const response = await emailApi.sendTransacEmail(emailData);
        console.log("Email sent successfully:", response);
        return response;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

export const sendOtpVerifyEmail = async (otp:number,email:string) => {
    const sender = {
        email: "abdulrazzak4186@gmail.com",
        name: "Tournament360",
    };

    // const receiver = [{ email: 'armanshoaib391@gmail.com' }];
    // const receiver = [{ email: email,name:name }];
    const receiver = [{ email: email }];

    try {
        const response = await emailApi.sendTransacEmail({
            sender,
            to: receiver,
            subject: "Welcome! Email Verification OTP for Tournament360",
            params:{
                otp : 435678,
            },
            htmlContent : sentOtpEmailVerifyTemplate(otp,email)
        });
        console.log('Email sent:', response);
        return response;
    } catch (error) {
        console.log('Error:', error);
        if (error instanceof Error) {
            throw new AppError(statusCodes.BAD_REQUEST, error?.message);
        } else {
            throw error;
        }
    }
}
export const sentWelcomeEmail = async (email:string) => {
    const sender = {
        email: "abdulrazzak4186@gmail.com",
        name: "Tournament360",
    };

    // const receiver = [{ email: 'armanshoaib391@gmail.com' }];
    // const receiver = [{ email: email,name:name }];
    const receiver = [{ email: email }];

    try {
        const response = await emailApi.sendTransacEmail({
            sender,
            to: receiver,
            subject: "Welcome! Account creation in Tournament360",
            htmlContent : `<p> Dear ${email}, </br> Welcome to our platform, your account has been created in <b>Tournament360</b> platform . </b> 
            <p>Completed your profile and proceed to create tournaments in our platform</p> </p>
            `
        });
        console.log('Email sent:', response);
        return response;
    } catch (error) {
        console.log('Error:', error);
        if (error instanceof Error) {
            throw new AppError(statusCodes.BAD_REQUEST, error?.message);
        } else {
            throw error;
        }
    }
}
