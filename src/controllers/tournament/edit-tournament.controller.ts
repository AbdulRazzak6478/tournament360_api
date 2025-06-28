import mongoose from "mongoose";
import catchAsync from "../../utils/catch-async.util.js";
import AppError from "../../utils/app-error.util.js";
import statusCodes from "../../constants/status-codes.constant.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { schemaValidation } from "../../utils/schema-validate.util.js";
import { editTournamentSchema } from "../../utils/tournament-validation.util.js";
import editKnockoutTournament from "../../services/tournament/knockout/edit-knockout-tournament.service.js";
import editDoubleKnockoutTournament from "../../services/tournament/double-knockout/edit-double-knockout-tournament.service.js";
import editRoundRobbinFormatTournament from "../../services/tournament/round-robbin/edit-rr-tournament.service.js";

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
            responseData = await editRoundRobbinFormatTournament(data);
            // responseData = {
            //     message: "work in progress for round_robbin",
            // };
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
