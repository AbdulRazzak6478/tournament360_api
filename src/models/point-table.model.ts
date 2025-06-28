import mongoose, { Document } from "mongoose";
import { gameTypeRefs } from "../constants/model-refs.constant.js";

export interface IPointTable extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    tournamentID: mongoose.Schema.Types.ObjectId;
    formatID: mongoose.Schema.Types.ObjectId;
    formatName?: string;
    gameType: "team" | "individual";
    participantID: mongoose.Schema.Types.ObjectId;
    plays: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    gameTypeRef: string;
}

const pointTableSchema = new mongoose.Schema<IPointTable>(
    {
        tournamentID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
        },
        formatID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RoundRobbin",
            required: true,
        },
        formatName: {
            type: String,
            default: "round_robbin",
        },
        gameType: {
            type: String,
            enum: gameTypeRefs,
            required: true,
        },
        participantID: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "gameTypeRef",
            required: true,
        },
        plays: {
            type: Number,
            default: 0,
        },
        wins: {
            type: Number,
            default: 0,
        },
        draws: {
            type: Number,
            default: 0,
        },
        losses: {
            type: Number,
            default: 0,
        },
        points: {
            type: Number,
            default: 0,
        },
        gameTypeRef: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

const pointTablesModel = mongoose.model(
    "pointTable",
    pointTableSchema
);

export default pointTablesModel;
