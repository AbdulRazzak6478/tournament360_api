import mongoose, { Document } from "mongoose";


export interface IRoundRobbinFormat extends Document {
    _id: mongoose.Schema.Types.ObjectId;
    tournamentID: mongoose.Schema.Types.ObjectId;
    formatName: string;
    fixingType: string;
    gameType: "team" | "individual";
    totalRounds: number;
    rounds: mongoose.Schema.Types.ObjectId[];
    // totalTeams: number;
    totalParticipants: number;
    pointTable: mongoose.Schema.Types.ObjectId[];
    // teams: mongoose.Schema.Types.ObjectId[];
    participants: mongoose.Schema.Types.ObjectId[];
    players: mongoose.Schema.Types.ObjectId[];
    participantsRef: string;
    createdAt: Date;
    updatedAt: Date;
}

const RRFormatSchema = new mongoose.Schema<IRoundRobbinFormat>(
    {
        tournamentID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
        },
        formatName: {
            type: String,
            required: true,
        },
        fixingType: {
            type: String,
            required: true,
        },
        gameType: {
            type: String,
            enum: ["team", "individual"],
            required: true,
        },
        totalRounds: {
            type: Number,
            default: 0,
        },
        rounds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "round",
                default: null,
            },
        ],
        totalParticipants: {
            type: Number,
            default: 0,
        },
        pointTable: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "pointTable",
            }
        ],
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                refPath: "participantsRef",
            },
        ],
        players: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "player",
                default: null
            },
        ],
        participantsRef: {
            type: String,
            default: "",
        }
    },
    { timestamps: true }
);

const roundRobbinFormatModel = mongoose.model("RoundRobbin", RRFormatSchema);

export default roundRobbinFormatModel;
