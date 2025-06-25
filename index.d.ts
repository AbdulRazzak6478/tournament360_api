// index.d.ts (at the root of your project)
import * as express from "express";
import { IGlobalUser } from "./src/models/globalUsers.model.js";
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
            currentUser?: IGlobalUser;
            userRole?: userRoleDocument;
            authId?: mongoose.Schema.Types.ObjectId | null;
            staffID?: mongoose.Schema.Types.ObjectId | null;
            staffId?: mongoose.Schema.Types.ObjectId | null;
        }
    }
}

