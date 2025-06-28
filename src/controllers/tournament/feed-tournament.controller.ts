
/*
Filters:
1.SportId,
2.Format Name
3.GameType
4.Tournament Id
*/

import mongoose from "mongoose";
import statusCodes from "../../constants/status-codes.constant.js";
import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import _ from "lodash";
import AppError from "../../utils/app-error.util.js";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import { formatNames } from "../../constants/model-refs.constant.js";
import TournamentModel from "../../models/tournament.model.js";


// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}


const fetchTournamentFeed = catchAsync(async (req, res) => {
    try {

        // Step 1  : Extract the status and filters fields from request
        const { status } = req.params;
        const { formatName, sportId, tournamentId, page = 1, limit = 10 }: {
            formatName?: string;
            sportId?: string;
            tournamentId?: string;
            page?: number;
            limit?: number
        } = req.query;
        const skip = (page - 1) * limit;


        // Step 2  : Validate the status and filters fields

        // 2.1 : Validate status field
        const statusList = ['all', 'pending', 'active', 'completed', 'archived'];
        if (_.isEmpty(status) || !statusList.includes(status?.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, "Invalid status Param");
        }

        // 2.2 : Validate Valid Format Name
        if (formatName && !formatNames.includes(formatName.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, "Invalid Format Name");
        }

        // 2.3 : Validate sportId must be an ObjectId
        if (sportId && !isValidObjectId(sportId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldMustBeaValidObjectId('sportId'));
        }

        // 2.4 : Validate TournamentId
        if (tournamentId && tournamentId?.length > 15) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentId'));
        }

        // Step 3  : Prepare a payload for query
        const query: {
            isDeleted?: boolean;
            startDate?: object;
            endDate?: object;
            sportID?: string;
            tournamentID?: object;
            createdBy?: string
        } = {};
        query.isDeleted = status === 'archived' ? true : false;
        const today = new Date();
        switch (status) {
            case 'all':
                query.isDeleted = false;
                break;
            case 'ongoing':
                query.isDeleted = false;
                query.startDate = { $lte: today };
                query.endDate = { $gte: today };
                break;
            case 'upcoming':
                query.isDeleted = false;
                query.startDate = {
                    $or: [
                        { $gte: today },
                        { $eq: null }
                    ]
                };
                query.endDate = {
                    $or: [
                        { $gte: today },
                        { $eq: null }
                    ]
                };
                break;
            case 'completed':
                query.isDeleted = false;
                query.startDate = { $lte: today };
                query.endDate = { $lte: today };
                break;
            case 'archived':
                query.isDeleted = true;
        }
        if (sportId) {
            query.sportID = sportId;
        }
        if (tournamentId) {
            query.tournamentID = { $regex: tournamentId, $option: 'i' };
        }



        // Step 4  : Execute the Query
        const totalTournaments = await TournamentModel.countDocuments(query);

        const tournaments = await TournamentModel.find(query)
            .skip(skip)
            .limit(limit)
            .select('tournamentID formatID formatName sportID sportName totalParticipants gameType tournamentName status startDate endDate scoreType')
            .lean();

        // Step 5  : Refactor or format the payload
        const totalPages = totalTournaments
            ? Math.ceil(totalTournaments / limit)
            : 0;
        const tournamentPayload = {
            status: status,
            length: tournaments.length,
            page,
            limit,
            totalTournaments,
            totalPages,
            tournaments,
        };

        // Step 6  : Return the response

        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    `Tournament Feed Fetched Successfully`,
                    tournamentPayload,
                    true
                )
            );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in tournament Feed controller : ", message);
        return res
            .status(statusCode)
            .json(
                failed_response(
                    statusCode,
                    "Failed to Fetch Tournament Feed",
                    { message: message },
                    false
                )
            );
    }
});


export {
    fetchTournamentFeed,

}