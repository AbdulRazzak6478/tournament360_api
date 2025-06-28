import _ from "lodash";
import AppError from "../../../utils/app-error.util.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import TournamentModel from "../../../models/tournament.model.js";
import { failed_response, success_response } from "../../../utils/response.util.js";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util.js";
import catchAsync from "../../../utils/catch-async.util.js";
import teamModel from "../../../models/team.model.js";
import playerModel from "../../../models/player.model.js";
import mongoose from "mongoose";


const getTournamentParticipants = catchAsync(async (req, res) => {

    try {

        // Step 1 : Extract the Tournament Id from request param
        const { tournamentID } = req.params;

        // Step 2 : Validate tournament Id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Step 3 : Check Tournament Exist Or Not
        const tournament = await TournamentModel.findOne({ tournamentID })
            .select('_id gameType')
            .lean();

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }
        // Step 4 : Fetch participants
        let participants = [];
        if (tournament.gameType === 'team') {
            participants = await teamModel.find({ tournamentID: tournament._id })
                .select('name participantNumber status createdAt updatedAt')
                .sort({ participantNumber: 1 })
                .lean();
        } else {
            participants = await playerModel.find({ tournamentID: tournament._id })
                .select('name participantNumber status createdAt updatedAt')
                .sort({ participantNumber: 1 })
                .lean();
        }
        // Step 5 : Return the Payload

        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Tournament Participants Fetched Successfully",
                    { participants },
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
                    "Failed To Fetch tournament Participants",
                    { message },
                    false
                )
            );
    }
});

// to validate ObjectId()
function isValidObjectId(id: string) {
    return mongoose.Types.ObjectId.isValid(id);
}

const updateParticipantName = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the Tournament Id from request param
        const { participantId, gameType, name } = req.body;

        // Step 2 : Validate participantId , name and gameType

        // 2.1 : Check the gameType is valid or not
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('name'));
        }
        if (_.isEmpty(gameType)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('gameType'));
        }
        if (!['team', 'individual'].includes(gameType.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidField('gameType, It must be team or individual'));
        }

        // 2.2 : Validate participantId is a valid Object id or not
        if (_.isEmpty(participantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('participantId'));
        }
        if (!isValidObjectId(participantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("matchID"));
        }

        // Step 3 : Update the ParticipantName


        // Step 4 : Update  Participant Name
        if (gameType === 'team') {
            const participant = await teamModel.exists({ _id: participantId });
            if (_.isEmpty(participant)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Team"));
            }
            await teamModel.updateOne(
                { _id: participant?._id },
                { $set: { name } }
            );
        } else {
            const participant = await playerModel.exists({ _id: participantId });
            if (_.isEmpty(participant)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Player"));
            }
            await playerModel.updateOne(
                { _id: participant?._id },
                { $set: { name } }
            );
        }
        // Step 5 : Return the Payload

        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Participant Name Updated!",
                    { message: 'Participant Name Updated' },
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
                    "Failed To Update Participant Name",
                    { message },
                    false
                )
            );
    }
});


const fetchParticipant = catchAsync(async (req, res) => {
    try {

        // Step 1 : Extract the Tournament Id from request param
        const { participantId, gameType } = req.body;

        // Step 2 : Validate participantId , name and gameType

        // 2.1 : Check the gameType is valid or not
        if (_.isEmpty(gameType)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('gameType'));
        }
        if (!['team', 'individual'].includes(gameType.toLowerCase())) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidField('gameType, It must be team or individual'));
        }

        // 2.2 : Validate participantId is a valid Object id or not
        if (_.isEmpty(participantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('participantId'));
        }
        if (!isValidObjectId(participantId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired("matchID"));
        }

        // Step 3 : Update the ParticipantName


        // Step 4 : fetch Participant
        let participant;
        if (gameType === 'team') {
            participant = await teamModel.findById(participantId).select('_id name').lean();
            if (_.isEmpty(participant)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Team"));
            }
        } else {
            participant = await playerModel.findById(participantId).select('_id name email mobileNumber').lean();
            if (_.isEmpty(participant)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Player"));
            }
        }
        // Step 5 : Return the Payload

        return res
            .status(statusCodes.OK)
            .json(
                success_response(
                    statusCodes.OK,
                    "Participant Fetch Successfully",
                    { participant },
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
                    "Failed To Fetch Participant",
                    { message },
                    false
                )
            );
    }
});



export {
    getTournamentParticipants,
    updateParticipantName,
    fetchParticipant,
}