// index.d.ts (at the root of your project)
import * as express from "express";
import { GlobalUserDocument } from "./src/models/globalUsers.model.js";
import { userRoleDocument } from "./src/models/userRole.model.js";
import mongoose from "mongoose";

// declare module "express-serve-static-core" {
//   interface Request {
//     userId?: string | null,
//     role?: string;
//   }
// }
declare global {
    namespace Express {
        interface Request {
            authToken?: string | null;
            currentUser?: GlobalUserDocument;
            userRole?: userRoleDocument;
            authId?:mongoose.Schema.Types.ObjectId | null;
            subordinateID?:mongoose.Schema.Types.ObjectId | null;
        }
    }
}

