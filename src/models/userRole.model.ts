import mongoose, { Model, Schema } from "mongoose";
import { Document } from "mongoose";
import { userRefs } from "../constants/modelRefs.js";

export interface userRoleDocument extends Document {
    userMongoId: mongoose.Schema.Types.ObjectId;
    userRef: string;
    role: {
        admin: boolean;
        user: boolean;
        organizer: boolean;
        subAdmin: {
            type: boolean;
            permissions: [string];
        };
        staff: {
            type: boolean;
            permissions: [string];
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

const userRolesSchema = new Schema<userRoleDocument>({
    userMongoId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "userRef",
        required: true
    },
    userRef: {
        type: String,
        enum:userRefs,
        required: true,
    },
    role: {
        admin: { type: Boolean, default: false },
        user: { type: Boolean, default: false },
        organizer: { type: Boolean, default: false },
        subAdmin: {
            type: { type: Boolean, default: false },
            permissions: [String]
        },
        staff: {
            type: { type: Boolean, default: false },
            permissions: [String],
        }
    }
}, { timestamps: true });


const userRoleModel: Model<userRoleDocument> = mongoose.model<userRoleDocument>("user_role", userRolesSchema);

export default userRoleModel;