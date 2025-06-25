import bcrypt from 'bcryptjs';
import mongoose, { Document, Model, Schema } from "mongoose";

// Note : keep remove user instance after 15 minutes
// Note : remove tournaments after 30 days

export interface locationDocument {
    address: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
}

export interface IOrganizer extends Document {
    _id: mongoose.Schema.Types.ObjectId
    customID: string;
    FirstName: string;
    LastName: string;
    email: string;
    imageUrl: string;
    gender: string;
    dob: Date;
    password: string;
    location: locationDocument;
    mobileNumber: string;
    alternativeMobile: string;
    profession: string;
    otpReferenceID: mongoose.Schema.Types.ObjectId | null;
    totalNoOfPasswordReset: number;
    isVerified: boolean;
    isDeleted: boolean,
    steps: {
        first: boolean;
        second: boolean;
        third: boolean;
        fourth: boolean;
    };
    status: string;
    userRole: mongoose.Schema.Types.ObjectId;
    totalTournaments: number;
    perDayLimit: number;
    passwordReset: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(val: string): Promise<boolean>;
    omitPassword(): Omit<IOrganizer, "password">;
};

const organizerSchema = new Schema<IOrganizer>({
    customID: {
        type: String,
        required: true,
        unique: true
    },
    FirstName: {
        type: String,
        default: ""
    },
    LastName: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    imageUrl: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        default: ""
    },
    dob: {
        type: Date,
        default: null
    },
    password: {
        type: String,
        required: true,
        default: ""
    },
    location: {
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        pinCode: { type: Number, default: "" },
        country: { type: String, default: "" }
    },
    mobileNumber: {
        type: String,
        default: "",
        // required: true,
        // validate: {
        //     validator: function (v: string) {
        //         return /\d{10}/.test(v);
        //     },
        //     message: props => `${props.value} is not a valid mobile number!`
        // }
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    alternativeMobile: {
        type: String,
        default: "",
        // validate: {
        //     validator: function (v: string) {
        //         return /\d{10}/.test(v);
        //     },
        //     message: props => `${props.value} is not a valid alternative mobile number!`
        // }
    },
    profession: {
        type: String,
        default: ""
    },
    otpReferenceID: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    totalNoOfPasswordReset: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    steps: {
        first: { type: Boolean, default: false },
        second: { type: Boolean, default: false },
        third: { type: Boolean, default: false },
        fourth: { type: Boolean, default: false }
    },
    status: {
        type: String,
        default: "INACTIVE",
        enum: ["ACTIVE", "SUSPENDED", "INACTIVE"]
    },
    userRole: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "user_role"
    },
    totalTournaments: {
        type: Number,
        default: 0
    },
    perDayLimit: {
        type: Number,
        default: 0
    },
    passwordReset: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });


// Pre-save hook to hash password
// userSchema.pre<IUser>("save", async function (next) {
//   const user = this;
//   console.log("user modified check : ", this.isModified("password"));
//   if (!user.isModified("password")) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(user.password, salt);
//     next();
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       console.log("Error in saving user hash password : ", error?.message);
//       next(error as mongoose.CallbackError);
//     } else {
//       next(new Error("Unknown error during password hashing"));
//     }
//   }
// });
organizerSchema.pre<IOrganizer>("save", async function (next) {
    console.log("user modified check : ", this.isModified("password"));

    // No need to assign 'this' to a local variable
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt); // Directly use 'this'
        next();
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.log("Error in saving user hash password : ", error.message);
            next(error as mongoose.CallbackError);
        } else {
            next(new Error("Unknown error during password hashing"));
        }
    }
});


// Method to compare password for login purposes
organizerSchema.methods.comparePassword = async function (
    password: string
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

organizerSchema.methods.omitPassword = function () {
    const user = this.toObject();
    delete user.password;
    return user;
}

const organizerModel: Model<IOrganizer> = mongoose.model<IOrganizer>("Organizer", organizerSchema);

export default organizerModel;