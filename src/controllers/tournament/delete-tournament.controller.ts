import mongoose from "mongoose";
import statusCodes from "../../constants/status-codes.constant.js";
import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";
import teamModel from "../../models/team.model.js";
import playerModel from "../../models/player.model.js";
import matchModel from "../../models/match.model.js";
import roundModel from "../../models/round.model.js";
import roundRobbinFormatModel from "../../models/rr-format.model.js";
import pointTablesModel from "../../models/point-table.model.js";
import KnockoutModel from "../../models/knockout-format.model.js";
import doubleKnockoutModel from "../../models/double-knockout.model.js";


const deleteTournament = catchAsync(async (req, res) => {

    try {

        // Step 1 : Extract the fields from request and Validate fields
        const { tournamentID } = req.params;

        if (_.isEmpty(tournamentID) || !mongoose.Types.ObjectId.isValid(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldMustBeaValidObjectId("tournamentID"))
        }

        // Step 2 : Validate the Tournament exist or not
        const isTournamentExist = await TournamentModel.findById({ _id: tournamentID })
            .select("tournamentID formatID sportID sportName formatName gameType")
            .lean();

        if (_.isEmpty(isTournamentExist)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist('Tournament'));
        }

        const allUpdates = [];

        // Delete Tournament
        allUpdates.push(
            TournamentModel.deleteOne(
                { _id: isTournamentExist?._id }
            )
        );

        // Step 3 : Delete Participants Of Tournament
        if (isTournamentExist?.gameType === 'team') {
            allUpdates.push(
                teamModel.deleteMany(
                    { tournamentID: isTournamentExist._id }
                )
            );
        } else {
            allUpdates.push(
                playerModel.deleteMany(
                    { tournamentID: isTournamentExist._id }
                )
            );
        }

        // Step 4 : Delete Matches Of Tournament
        allUpdates.push(
            matchModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            )
        );

        // Step 5 : Delete Rounds Of Tournament
        allUpdates.push(
            roundModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            )
        );

        // Step 7 : Delete Tournament Format
        if (isTournamentExist.formatName === 'round_robbin') {
            allUpdates.push(
                roundRobbinFormatModel.deleteMany(
                    { tournamentID: isTournamentExist._id }
                )
            );
            allUpdates.push(
                pointTablesModel.deleteMany(
                    { tournamentID: isTournamentExist._id }
                )
            );
        }
        if (isTournamentExist.formatName === 'knockout') {
            allUpdates.push(
                KnockoutModel.deleteMany(
                    { tournamentID: isTournamentExist._id }
                )
            );
        }
        if (isTournamentExist.formatName === 'double_elimination_bracket') {
            allUpdates.push(
                doubleKnockoutModel.deleteMany(
                    { tournamentID: isTournamentExist._id }
                )
            );
        }
        // Step 8 : Delete Related Data

        // 8.1 Remove Sponsors of the Tournament
        // 8.2 Remove The Venues Of Tournament
        // 8.3 Remove The Sport ( Cricket or Football ) Things


        // Execute Queries All in once
        await Promise.all(allUpdates);

        // Step 9 : Return response
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    `Tournament Deleted Successfully`,
                    {
                        tournamentID: isTournamentExist?._id,
                        message: 'Tournament Deleted!'
                    },
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in Delete tournament controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Delete Tournament",
                    { message: message },
                    false
                )
            );
    }
});

export default deleteTournament;