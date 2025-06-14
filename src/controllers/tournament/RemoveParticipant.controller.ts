import mongoose from "mongoose";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import statusCodes from "../../constants/statusCodes.js";
import AppErrorCode from "../../constants/appErrorCode.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";
import { failed_response, success_response } from "../../utils/response.js";
import catchErrorMsgAndStatusCode from "../../utils/catchError.js";
import removeKnockoutTournamentParticipant from "../../service/tournament/knockout/removeParticipantKnockoutService.js";
import removeDoubleKnockoutTournamentParticipant from "../../service/tournament/doubleKnockout/removeParticipantDoubleKnockoutService.js";

const removeParticipantFromTournament = catchAsync(async (req, res) => {
    try {
        const { tournamentID } = req.params;
        const { participantID } = req.body;
        if (_.isEmpty(tournamentID) || !mongoose.Types.ObjectId.isValid(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("tournamentID"));
        }
        if (_.isEmpty(participantID) || !mongoose.Types.ObjectId.isValid(participantID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("participantID"));
        }
        let tournamentDetails = await TournamentModel.findById(tournamentID);
        if (_.isEmpty(tournamentDetails)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist("Tournament"))
        }
        if (tournamentDetails?.status === 'ACTIVE' || tournamentDetails?.status === 'COMPLETED') {
            throw new AppError(statusCodes.BAD_REQUEST, `Tournament is ${tournamentDetails?.status}, Can't Remove Participant.`);
        }
        let responseData = {};
        if (tournamentDetails?.formatName?.toLowerCase() === "knockout") {
            responseData = await removeKnockoutTournamentParticipant(tournamentDetails?._id?.toString() as string, participantID);
            // responseData = {
            //     message: "work in progress for knockout section",
            // };
        }
        if (tournamentDetails?.formatName?.toLowerCase() === "double_elimination_bracket") {
            responseData = await removeDoubleKnockoutTournamentParticipant(tournamentDetails?._id?.toString() as string, participantID)
            // responseData = {
            //     message: "work in progress for double_elimination_bracket",
            // };
        }
        if (tournamentDetails?.formatName?.toLowerCase() === "round_robbin") {
            // responseData = await removeParticipantFromRoundRobbinTournament(tournamentDetails, participantId);
            responseData = {
                message: "work in progress for round_robbin",
            };
        }
        return res
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    "Participant Removed. Tournament Updated!",
                    responseData,
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Remove Tournament Participant",
                    { message },
                    false
                )
            );
    }
});

export default removeParticipantFromTournament;
