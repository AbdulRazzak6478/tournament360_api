import mongoose, { Schema, model, Document } from 'mongoose';

export interface ISponsor extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    name: string;
    defaultSponsor?: boolean,
    SponsorImg?: string;
    accountNumber?: string,
    accountHolderName?: string,
    bankName?: string,
    IFSC_Code?: string,
    accountType?: "saving" | "current",
    createdAt: Date;
    updatedAt: Date;
}

const sponsorSchema = new Schema<ISponsor>({
    tournamentID: {
        type: String,
        required: true,
        ref: 'Tournament',
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
    },
    defaultSponsor: {
        type: Boolean,
        default: false,
    },
    SponsorImg: {
        type: String,
        default: "",
    },
    accountNumber: {
        type: String,
        default: "",
    },
    accountHolderName: {
        type: String,
        default: "",
    },
    bankName: {
        type: String,
        default: "",
    },
    IFSC_Code: {
        type: String,
        default: "",
    },
    accountType: {
        type: String,
        default: "",
    },

});

const sponsorModel = model<ISponsor>('sponsor', sponsorSchema);

export default sponsorModel;