import mongoose from "mongoose";
import AppErrorCode from "../constants/appErrorCode.js";
import statusCodes from "../constants/statusCodes.js";
import AppError from "../utils/appError.js";
import catchErrorMsgAndStatusCode from "../utils/catchError.js";
import _ from "lodash";
import roundModel from "../models/round.model.js";
type dataType = {
    tournamentId: string,
    bracket: string
}

type populateType = {
    _id: string,
    name: string
}

const getKnockoutFixturesService = async (data: dataType) => {
    try {
        console.log("getGameFixturesService", data);
        // 1. Get the tournamentID and bracket from the data and validate it
        const { tournamentId, bracket } = data;
        if (_.isEmpty(tournamentId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("tournamentId"));
        }
        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldMustBeaValidObjectId("tournamentId"));
        }
        if (_.isEmpty(bracket)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired("bracket"));
        }

        // 2. Fetch All rounds With Matches Data

        let roundsData = await roundModel.find({ tournamentID: tournamentId, bracket: bracket })
            .select("tournamentID roundName roundNumber fixingType gameType bracket matches isCompleted winners")
            .populate<{
                matches: {
                    _id: string,
                    name: string,
                    participantA: populateType | null,
                    participantB: populateType | null,
                    matchA: populateType | null,
                    matchB: populateType | null,
                    winner: string | null,
                    timing: Date | null,
                    dateOfPlay: Date | null,
                    status: string,
                    isCompleted: boolean,
                    gameTypeRef: string
                }[]
            }>([
                {
                    path: "matches",
                    select: "_id name participantA participantB matchA matchB winner timing dateOfPlay status isCompleted gameTypeRef",
                    populate: [
                        { path: "participantA", select: "_id name" },
                        { path: "participantB", select: "_id name" },
                        { path: "matchA", select: "_id name" },
                        { path: "matchB", select: "_id name" },
                    ]
                },
            ])
            .sort({ roundNumber: 1 })
            .lean();
        if (_.isEmpty(roundsData)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("rounds"));
        }
        console.log("roundsData : ", roundsData?.[0]?.matches?.[0], roundsData?.[0]);
        let payload = roundsData.map((round) => {
            const matches = round.matches.map((match) => {
                let participantA = match?.participantA ? match.participantA?.name : match?.matchA?.name ? "Winner From " + match?.matchA?.name : null;
                let participantB = match?.participantB ? match.participantB?.name : match?.matchB?.name ? "Winner From " + match?.matchB?.name : null;
                const winner = match?.winner?.toString() === match?.participantA?._id?.toString() ?
                    match?.participantA?.name :
                    match?.winner?.toString() === match?.participantB?._id?.toString() ?
                        match?.participantB?.name : null;
                return {
                    _id: match._id,
                    name: match.name,
                    participantA_id: match.participantA ? match.participantA?._id : null,
                    participantB_id: match.participantB ? match.participantB?._id : null,
                    timing: match.timing,
                    dateOfPlay: match.dateOfPlay,
                    status: match.status,
                    isCompleted: match.isCompleted,
                    participantA,
                    participantB,
                    winnerId: match?.winner,
                    winner,
                };
            });
            // console.log("round : ", round);
            return {
                ...round,
                matches,
                winners: round?.winners?.length
            };
        });


        return payload;
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in get knockout Game fixtures : ", message);
        throw new AppError(statusCode, message);
    }
}

export default getKnockoutFixturesService;