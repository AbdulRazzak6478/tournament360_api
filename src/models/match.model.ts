import mongoose, { model, Schema } from "mongoose";
import { scoreTypeEnums } from "../constants/model-refs.constant.js";


export interface IMatch extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    tournamentID: mongoose.Schema.Types.ObjectId;
    formatID: mongoose.Schema.Types.ObjectId;
    roundID: mongoose.Schema.Types.ObjectId;
    gameType: string;
    name: string;
    bracket: string;
    // roundNumber:number;
    participantA: mongoose.Schema.Types.ObjectId;
    participantB: mongoose.Schema.Types.ObjectId;
    matchA: mongoose.Schema.Types.ObjectId;
    matchB: mongoose.Schema.Types.ObjectId;
    winner: mongoose.Schema.Types.ObjectId;
    nextMatch: mongoose.Schema.Types.ObjectId | null;
    gameTypeRef: string;
    scoreA: number[];
    scoreB: number[];
    scoreTypes: string[];
    scoreType: string;
    noOfSets: number;
    winsA: number;
    winsB: number;
    timing: Date;
    dateOfPlay: Date;
    status: string;
    isCompleted: boolean;
    refereeID: mongoose.Schema.Types.ObjectId;
    sportRef: string;
    sportRefID: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const matchSchema: Schema<IMatch> = new Schema<IMatch>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
        index: true
    },
    formatID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    roundID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "round"
    },
    participantA: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "gameTypeRef",
        default: null
    },
    participantB: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "gameTypeRef",
        default: null
    },
    gameType: {
        type: String,
        enum: ['team', 'individual'],
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    bracket: {
        type: String,
        enum: ['winners', 'losers', 'Final Bracket'],
        required: true,
    },
    gameTypeRef: {
        type: String,
        required: true,
    },
    scoreA: [
        {
            type: Number,
            default: 0
        }
    ],
    scoreB: [
        {
            type: Number,
            default: 0
        }
    ],
    scoreTypes: [
        {
            type: String,
            default: ""
        }
    ],
    scoreType: {
        type: String,
        required: true,
        enum: scoreTypeEnums,
        // default: 'Top Score',
    },
    noOfSets: {
        type: Number,
        default: 0
    },
    winsA: {
        type: Number,
        default: 0
    },
    winsB: {
        type: Number,
        default: 0
    },
    timing: {
        type: Date,
        default: null,
    },
    dateOfPlay: {
        type: Date,
        default: null,
    },
    status: { type: String, enum: ["PENDING", "SCHEDULED", "ONGOING", "COMPLETED"], default: "PENDING" },
    isCompleted: {
        type: Boolean,
        default: false
    },
    matchA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "match",
        default: null
    },
    matchB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "match",
        default: null
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'gameTypeRef',
        default: null
    },
    nextMatch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "match",
        default: null
    },
    refereeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'referee',
        default: null
    },
    sportRefID: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'sportRef',
        default: null
    },
    sportRef: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const matchModel = model<IMatch>('match', matchSchema);

export default matchModel;