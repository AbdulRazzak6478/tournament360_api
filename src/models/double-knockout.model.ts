import mongoose, { Document } from "mongoose";
import { gameTypeRefs, participantRefs } from "../constants/model-refs.constant.js";

interface IDoubleKnockout extends Document {

    _id: mongoose.Schema.Types.ObjectId;
    tournamentID: mongoose.Schema.Types.ObjectId;
    formatName: string;
    fixingType: string;
    gameType: string;
    totalWinnersRounds: number;
    totalLosersRounds: number;
    winnersRoundsNames: string[];
    losersRoundsNames: string[];
    finalRoundName: string;
    winnersRoundsIds: mongoose.Schema.Types.ObjectId[];
    losersRoundsIds: mongoose.Schema.Types.ObjectId[];
    finalRoundId: mongoose.Schema.Types.ObjectId[];
    // totalTeams: number; 
    totalParticipants: number;
    // teams: mongoose.Schema.Types.ObjectId[];
    participants: mongoose.Schema.Types.ObjectId[];
    players: mongoose.Schema.Types.ObjectId[];
    participantsRef: string;
    createdAt: Date;
    updatedAt: Date;
}
const doubleKnockoutSchema = new mongoose.Schema(
    {
        tournamentID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tournament",
            required: true,
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
            enum: gameTypeRefs,
            required: true,
        },
        totalWinnersRounds: {
            type: Number,
            default: 0,
        },
        totalLosersRounds: {
            type: Number,
            default: 0,
        },
        winnersRoundsNames: [
            {
                type: String,
                default: "",
            },
        ],
        losersRoundsNames: [
            {
                type: String,
                default: "",
            },
        ],
        finalRoundName: {
            type: String,
            default: "Final",
        },
        winnersRoundsIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "round",
            },
        ],
        losersRoundsIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "round",
            },
        ],
        finalRoundId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "round",
            },
        ],
        totalParticipants: {
            type: Number,
            default: 0,
        },
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
            },
        ],
        participantsRef: {
            type: String,
            enum: participantRefs,
        }
    },
    { timestamps: true }
);

const doubleKnockoutModel = mongoose.model<IDoubleKnockout>("doubleKnockout", doubleKnockoutSchema);

export default doubleKnockoutModel;