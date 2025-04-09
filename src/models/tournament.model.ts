import mongoose, { Schema, model, Document } from 'mongoose';

export const formatNameEnums = ['knockout', 'double_elimination_bracket', 'round_robbin'];

export const fixingTypeEnums = ['sequential', 'random', 'manual', 'top_vs_bottom'];

export const scoreTypeEnums = ['Top Score', 'Best Of', 'Race To', 'Cricket', 'Football'];

export interface ITournament extends Document {
    tournamentID: string;
    formatID: mongoose.Schema.Types.ObjectId;
    sportID: mongoose.Schema.Types.ObjectId;
    totalParticipants:number;
    sportName: string;
    formatName: string;
    formatRef: string;
    fixingType: string;
    gameType: string;
    tournamentName: string;
    description: string;
    BannerImg: string;
    status: string;
    startDate: Date;
    endDate: Date;
    noOfMatchSets: number;
    scoreType: string;
    scoreTypes: string[];
    isDeleted: boolean;
    deleteRemark: string;
    createdAt: Date;
    updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>({
    tournamentID: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    tournamentName: {
        type: String,
        default:""
    },
    formatID: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "formatRef",
        default:null,
        index: true
    },
    sportID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sport",
        default: null,
        index: true
    },
    sportName: {
        type: String,
        required: true,
    },
    formatRef: {
        type: String,
        required: true,
    },
    formatName: {
        type: String,
        required: true,
        enum: formatNameEnums,
        default: ""
    },
    fixingType: {
        type: String,
        enum: fixingTypeEnums,
        required:true,
        // default: "sequential"
    },
    gameType: {
        type: String,
        enum: ['team', 'individual'],
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    BannerImg: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'COMPLETED'],
        default: 'PENDING'
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    noOfMatchSets: {
        type: Number,
        default: 0
    },
    totalParticipants: {
        type: Number,
        default: 0
    },
    scoreType: {
        type: String,
        enum: scoreTypeEnums,
        default: 'Top Score',
    },
    scoreTypes: [
        {
            type: String,
            enum: scoreTypeEnums,
        },
    ],
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deleteRemark: {
        type: String,
        default: "",
    },
});

const TournamentModel = model<ITournament>('Tournament', TournamentSchema);

export default TournamentModel;