import mongoose, { Document, model, Schema } from "mongoose";


export interface IPlayer extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    teamID: mongoose.Schema.Types.ObjectId;
    sportID: mongoose.Schema.Types.ObjectId;
    name: string;
    participantNumber: number;
    sportName: string;
    email: string;
    mobileNumber: string;
    captain: boolean;
    roleOrPosition: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const playerSchema = new Schema<IPlayer>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Tournament',
    },
    sportID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Sport',
    },
    teamID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        default: null
    },
    name: {
        type: String,
        required: true,
    },
    roleOrPosition: { type: String, enum: ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD", "BOWLER", 'BATSMAN', "WICKETKEEPER", "ALLROUNDER", "BENCH", "MEMBER", "PLAYER"], default: "PLAYER" },
    sportName: {
        type: String,
        // required: true,
        default:""
    },
    participantNumber: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        default: ""
    },
    mobileNumber: {
        type: String,
        default: "",
    },
    captain: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const playerModel = model<IPlayer>('player', playerSchema);

export default playerModel;

