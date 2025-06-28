import mongoose, { model, Schema } from 'mongoose';


export interface IFootballStat extends Document {
    tournamentID: mongoose.Schema.Types.ObjectId;
    // matchID: mongoose.Schema.Types.ObjectId;
    teamID: mongoose.Schema.Types.ObjectId;
    playerID: mongoose.Schema.Types.ObjectId;
    goals: number;
    yellow: number;
    red: number;
    fouls: number;
    freeKicks: number;
    penaltyKicks: number;
    assists: number;
}

const footballStatSchema = new Schema<IFootballStat>({
    tournamentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true,
    },
    // matchID: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'match',
    //     required: true,
    // },
    teamID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team',
        required: true,
    },
    playerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        required: true,
    },
    goals: {
        type: Number,
        default: 0
    },
    yellow: {
        type: Number,
        default: 0
    },
    red: {
        type: Number,
        default: 0
    },
    fouls: {
        type: Number,
        default: 0
    },
    freeKicks: {
        type: Number,
        default: 0
    },
    penaltyKicks: {
        type: Number,
        default: 0
    },
    assists: {
        type: Number,
        default: 0
    },

}, { timestamps: true });

const footballStatsModel = model<IFootballStat>('stat', footballStatSchema);

export default footballStatsModel;