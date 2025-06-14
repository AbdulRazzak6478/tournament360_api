import mongoose from "mongoose";
import statusCodes from "../../constants/statusCodes.js";
import TournamentModel from "../../models/tournament.model.js";
import AppError from "../../utils/appError.js";
import catchAsync from "../../utils/catchAsync.js";
import _ from "lodash";
import AppErrorCode from "../../constants/appErrorCode.js";
import addParticipantInKnockoutFormatAndReArrangeTournament from "../../service/tournament/knockout/AddParticipantKnockoutService.js";
import { failed_response, success_response } from "../../utils/response.js";
import catchErrorMsgAndStatusCode from "../../utils/catchError.js";
import addParticipantInDoubleKnockoutFormatAndReArrangeTournament from "../../service/tournament/doubleKnockout/addDoubleKnockoutParticipantService.js";

const addParticipantIntoTournament = catchAsync(async (req, res) => {
    try {
        const { tournamentID } = req.params;
        const { participantName } = req.body;
        if (_.isEmpty(tournamentID) || !mongoose.Types.ObjectId.isValid(tournamentID)) {
           throw new AppError(statusCodes.BAD_REQUEST,AppErrorCode.validFieldObjectIdIsRequired("tournamentID"))
        }
        if (_.isEmpty(participantName)) {
            throw new AppError(statusCodes.BAD_REQUEST,"participantName is required.")
        }
        let tournamentDetails = await TournamentModel.findById(tournamentID);
        if (_.isEmpty(tournamentDetails)) {
            throw new AppError(statusCodes.BAD_REQUEST,AppErrorCode.fieldNotExist("Tournament"))
        }
        if (tournamentDetails?.status === 'ACTIVE' || tournamentDetails?.status === 'COMPLETED') {
            throw new AppError(statusCodes.BAD_REQUEST,`Tournament is ${tournamentDetails?.status}, Can't Add Participants.`);
        }

        let responseData = {};
        if (tournamentDetails?.formatName?.toLowerCase() === "knockout") {
            responseData = await addParticipantInKnockoutFormatAndReArrangeTournament(tournamentDetails?._id?.toString() as string, participantName);
        }
        if (tournamentDetails?.formatName?.toLowerCase() === "double_elimination_bracket") {
            responseData = await addParticipantInDoubleKnockoutFormatAndReArrangeTournament(tournamentDetails?._id?.toString() as string, participantName);
            // responseData = {
            //   message: "work in progress for double_elimination_bracket",
            // };
        }
        if (tournamentDetails?.formatName?.toLowerCase() === "round_robbin") {
            // responseData = await addParticipantIntoRoundRobbinFormat(tournamentDetails, participantName);
            // responseData = {
            //   message: "work in progress for round_robbin",
            // };
        }
        return res
            .status(statusCodes.CREATED)
            .json(
                success_response(
                    statusCodes.CREATED,
                    `Participant ${participantName} added!`,
                    responseData,
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in add participant controller : ",message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Add Participant Into Tournament",
                    { message: message },
                    false
                )
            );
    }
});

export default addParticipantIntoTournament;
