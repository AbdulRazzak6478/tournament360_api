import mongoose, { model, Schema } from "mongoose";


export interface IFootball extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    matchID: mongoose.Schema.Types.ObjectId;
    teamA_ID: mongoose.Schema.Types.ObjectId;
    teamB_ID: mongoose.Schema.Types.ObjectId;
    tossWinner: mongoose.Schema.Types.ObjectId;
    tossWinChoice: string;
    tossOptions: string[];
    goalsA: number;
    goalsB: number;
    matchDuration: number;
    yellow: number;
    freeKicks: number;
    penaltyKicks: number;
    fouls: number;
    players: mongoose.Schema.Types.ObjectId[];
}

const footballSchema = new Schema<IFootball>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
    },
    matchID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
        required: true,
    },
    teamA_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        default: null,
    },
    teamB_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        default: null
    },
    tossWinner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        default: null
    },
    tossWinChoice: {
        type: String,
        default: ""
    },
    tossOptions: [
        {
            type: String
        }
    ],
    goalsA: {
        type: Number,
        default: 0
    },
    goalsB: {
        type: Number,
        default: 0
    },
    matchDuration: {
        type: Number,
        default: 0
    },
    yellow: {
        type: Number,
        default: 0
    },
    freeKicks: {
        type: Number,
        default: 0
    },
    fouls: {
        type: Number,
        default: 0
    },
    penaltyKicks: {
        type: Number,
        default: 0
    },
    players: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'stat',
            default: null
        }
    ]
}, { timestamps: true });


const footballModel = model<IFootball>('football', footballSchema);

export default footballModel;