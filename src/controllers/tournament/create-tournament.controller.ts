import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response } from "../../utils/response.util.js";
import statusCodes from "../../constants/status-codes.constant.js";
import { schemaValidation } from "../../utils/schema-validate.util.js";
import { createTournamentSchema } from "../../utils/tournament-validation.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import tournamentKnockoutFormatCreation from "../../services/tournament/knockout/create-knockout.service.js";
import tournamentDoubleKnockoutFormatCreation from "../../services/tournament/double-knockout/create-double-knockout-tournament.service.js";
import createRoundRobbinTournament from "../../services/tournament/round-robbin/create-rr-tournament.service.js";


const createTournament = catchAsync(async (req, res) => {
    try {

        // validate subordinate
        if (req.staffID) {
            throw new AppError(statusCodes.UNAUTHORIZED, "You Are Not Authorized!.");
        }
        // 1. validate data payload
        if (await schemaValidation(createTournamentSchema, req.body, res)) {
            return res;
        }

        const { gameType, participants, formatType, sportID, fixingType } = req.body;

        // 2. validate participants range
        const knockoutFormat = {
            min: 4,
            max: 50,
        };
        const double_elimination_bracket_format = {
            min: 4,
            max: 50,
        };
        const round_robbin_format = {
            min: 4,
            max: 50,
        };
        const data = {
            gameType,
            participants,
            formatType,
            sportID,
            fixingType,
        };

        console.log("data : ", data);
        // 3. call the formatType functions
        let responseData = {};
        if (data.formatType.toLowerCase() === "knockout") {
            if (data.participants < knockoutFormat.min || data.participants > knockoutFormat.max) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.participantsRange)
            }
            responseData = await tournamentKnockoutFormatCreation(data);
        }
        if (data.formatType.toLowerCase() === "double_elimination_bracket") {
            if (
                data.participants < double_elimination_bracket_format.min ||
                data.participants > double_elimination_bracket_format.max
            ) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.participantsRange)
            }
            responseData = await tournamentDoubleKnockoutFormatCreation(data);
            // responseData = {
            //     message: "work in progress for double_elimination_bracket",
            // };
        }
        if (data.formatType.toLowerCase() === "round_robbin") {
            if (data.participants < round_robbin_format.min || data.participants > round_robbin_format.max) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.participantsRange)
            }
            responseData = await createRoundRobbinTournament(data);
            // responseData = {
            //     message: "work in progress for round_robbin",
            // };
        }
        return res.status(statusCodes.CREATED)
            .json(
                failed_response(
                    statusCodes.CREATED,
                    "Tournament Created Successfully.",
                    { tournament: responseData },
                    false
                )
            )
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in Creating Tournament : ", message, statusCode);
        return res.status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to create tournament",
                    {
                        message,
                    },
                    false
                )
            )
    }
});

export default createTournament;