import mongoose from "mongoose";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import statusCodes from "../../constants/statusCodes.js";
import AppErrorCode from "../../constants/appErrorCode.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";
import { failed_response, success_response } from "../../utils/response.js";
import catchErrorMsgAndStatusCode from "../../utils/catchError.js";
import { schemaValidation } from "../../utils/schemaValidate.js";
import { editTournamentSchema } from "../../utils/tournamentValidation.js";
import editKnockoutTournament from "../../service/tournament/knockout/editknockoutTournamentService.js";
import editDoubleKnockoutTournament from "../../service/tournament/doubleKnockout/editDoubleKnockoutTournamentService.js";

const editTournamentDetails = catchAsync(async (req, res) => {
    try {
        const { tournamentID } = req.params;
        if (_.isEmpty(tournamentID) || !mongoose.Types.ObjectId.isValid(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("tournamentID"));
        }

        // 1. validate data payload
        if (await schemaValidation(editTournamentSchema, req.body, res)) {
            return res;
        }

        let tournamentDetails = await TournamentModel.findById(tournamentID).lean();
        if (_.isEmpty(tournamentDetails)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist("Tournament"))
        }
        if (tournamentDetails?.status === 'ACTIVE' || tournamentDetails?.status === 'COMPLETED') {
            throw new AppError(statusCodes.BAD_REQUEST, `Tournament is ${tournamentDetails?.status}, Can't Updated Tournament.`);
        }
        let {
            gameType,
            participants,
            formatType,
            sportID,
            fixingType,
            startDate,
            endDate,
            Name,
            description,
        } = req.body;
        const data = {
            tournamentID,
            gameType,
            participants,
            formatType,
            sportID,
            fixingType,
            startDate,
            endDate,
            Name,
            description,
        };
        let responseData = {};
        if (tournamentDetails?.status === "ACTIVE") {
            let flag = false;
            if (tournamentDetails.tournamentName !== Name) {
                flag = true;
                tournamentDetails.tournamentName = Name;
            }
            if (tournamentDetails.description !== description) {
                flag = true;
                tournamentDetails.description = description;
            }
            if (tournamentDetails.startDate !== startDate) {
                flag = true;
                tournamentDetails.startDate = startDate;
            }
            if (tournamentDetails.endDate !== endDate) {
                flag = true;
                tournamentDetails.endDate = endDate;
            }
            if (flag) {
                await tournamentDetails.updateOne(
                    { _id: tournamentDetails?._id },
                    {
                        $set: {
                            tournamentName: Name,
                            description,
                            startDate,
                            endDate
                        }
                    },
                );
            }
            return res
                .status(statusCodes.CREATED)
                .json(
                    success_response(
                        statusCodes.CREATED,
                        "Tournament Updated!",
                        { tournamentDetails },
                        true
                    )
                );
        }
        if (tournamentDetails?.formatName?.toLowerCase() === "knockout") {
            responseData = await editKnockoutTournament(data);
            // responseData = {
            //     message: "work in progress for knockout section",
            // };
        }
        if (tournamentDetails?.formatName?.toLowerCase() === "double_elimination_bracket") {
            responseData = await editDoubleKnockoutTournament(data);
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
                    "Tournament Updated!",
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
                    "Failed to Edit Tournament",
                    { message },
                    false
                )
            );
    }
});

export default editTournamentDetails;
