import mongoose from "mongoose";
import statusCodes from "../../constants/statusCodes.js";
import catchAsync from "../../utils/catchAsync.js";
import catchErrorMsgAndStatusCode from "../../utils/catchError.js";
import { failed_response, success_response } from "../../utils/response.js";
import AppError from "../../utils/appError.js";
import AppErrorCode from "../../constants/appErrorCode.js";
import _ from "lodash";
import TournamentModel from "../../models/tournament.model.js";
import teamModel from "../../models/team.model.js";
import playerModel from "../../models/player.model.js";
import matchModel from "../../models/match.model.js";
import roundModel from "../../models/round.model.js";
import roundRobbinFormatModel from "../../models/RRformat.model.js";
import pointTablesModel from "../../models/pointTable.model.js";
import KnockoutModel from "../../models/knockoutFormat.model.js";
import doubleKnockoutModel from "../../models/doubleKnockout.model.js";


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

        // Delete Tournament
        await TournamentModel.deleteOne(
            { _id: isTournamentExist?._id }
        );

        // Step 3 : Delete Participants Of Tournament
        if (isTournamentExist?.gameType === 'team') {
            await teamModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            );
        } else {
            await playerModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            );
        }
        // Step 4 : Delete Matches Of Tournament
        await matchModel.deleteMany(
            { tournamentID: isTournamentExist._id }
        );
        // Step 5 : Delete Rounds Of Tournament
        await roundModel.deleteMany(
            { tournamentID: isTournamentExist._id }
        );
        // Step 7 : Delete Tournament Format
        if (isTournamentExist.formatName === 'round_robbin') {
            await roundRobbinFormatModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            );
            await pointTablesModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            );
        }
        if (isTournamentExist.formatName === 'knockout') {
            await KnockoutModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            );
        }
        if (isTournamentExist.formatName === 'double_elimination_bracket') {
            await doubleKnockoutModel.deleteMany(
                { tournamentID: isTournamentExist._id }
            );
        }
        // Step 8 : Delete Related Data

        // 8.1 Remove Sponsors of the Tournament
        // 8.2 Remove The Venues Of Tournament
        // 8.3 Remove The Sport ( Cricket or Football ) Things



        // Step 9 : Return response
        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    `Tournament Restored Successfully`,
                    {
                        tournamentID: isTournamentExist?._id,
                        message: 'Tournament Restored!'
                    },
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in Restore tournament controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Restore Tournament",
                    { message: message },
                    false
                )
            );
    }
});

export default deleteTournament;