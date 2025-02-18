import mongoose,{ Document, Model, Schema } from "mongoose";


export interface GlobalUserDocument extends Document {
    userMongoId:mongoose.Schema.Types.ObjectId;
    userRole:mongoose.Schema.Types.ObjectId;
    name:string;
    email:string;
    isSignedUp : boolean;
    designationRef:string;
    createdAt:Date;
    updatedAt:Date;
}

const globalUserSchema = new Schema<GlobalUserDocument>({
    userMongoId : {
        type: mongoose.Schema.Types.ObjectId,
        refPath : "designationRef",
        required:true,
        index:true
    },
    userRole : {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref : "user_role",
        default : null
    },
    name : {
        type: String,
        default : "",
    },
    email:{
        type:String,
        required:true,
        unique : true,
        index:true,
    },
    isSignedUp:{
        type: Boolean,
        default : false
    },
    designationRef: {
        type : String,
        enum : ['Organizer','SubOrdinate','Admin','SubAdmin'],
        required:true
    }
},{timestamps : true});


const GlobalUserModel : Model<GlobalUserDocument> = mongoose.model<GlobalUserDocument>("global_user",globalUserSchema);

export default GlobalUserModel;