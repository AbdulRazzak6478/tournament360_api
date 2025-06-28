import _ from "lodash";
import AppErrorCode from "../../constants/app-error-codes.constant.js";
import statusCodes from "../../constants/status-codes.constant.js";
import TournamentModel from "../../models/tournament.model.js";
import AppError from "../../utils/app-error.util.js";
import catchAsync from "../../utils/catch-async.util.js";
import catchErrorMsgAndStatusCode from "../../utils/catch-error.util.js";
import { failed_response, success_response } from "../../utils/response.util.js";
import mongoose from "mongoose";
import venueModel from "../../models/venue.model.js";


const addVenueIntoTournament = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract the sponsor details and Tournament id
        const { tournamentID } = req.params;
        const { name, addressLine1, addressLine2, city, state } = req.body;

        // Step 2 : Validate the sponsor details and tournament Id
        // Validate Tournament id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Validate sponsor details
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('sponsor name'));
        }


        // Step 3 : Check Tournament Exist or not
        const tournament = await TournamentModel.exists({ tournamentID })

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }

        // Step 4 : generate add venue payload
        const addVenuePayload: {
            name: string;
            addressLine1?: string,
            addressLine2?: string;
            city?: string,
            state?: string,
        } = {
            name
        };
        if (addressLine1) {
            addVenuePayload.addressLine1 = addressLine1;
        }
        if (addressLine2) {
            addVenuePayload.addressLine2 = addressLine2;
        }
        if (city) {
            addVenuePayload.city = city;
        }
        if (state) {
            addVenuePayload.state = state;
        }

        // Step 5 : Add Sponsor
        const venue = await venueModel.create({ tournamentID: tournament?._id, ...addVenuePayload });
        if (_.isEmpty(venue)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Tournament Venue'));
        }
        // step 6 : return sponsor Payload

        return res.status(statusCodes.CREATED).json(
            success_response(
                statusCodes.CREATED,
                "Tournament Venue Added successfully.",
                { venue },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to add tournament Venue",
                { message },
                false
            )
        );
    }
});

const fetchTournamentVenues = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract Tournament id from the request
        const { tournamentID } = req.params;

        // Step 2 : Validate tournament Id

        // Validate Tournament id
        if (_.isEmpty(tournamentID)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('tournamentID'));
        }
        if (tournamentID.length !== 15 || tournamentID.slice(3) !== 'TMT') {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.invalidFieldFormat('tournamentID'));
        }

        // Step 3 : Check Tournament Exist or not
        const tournament = await TournamentModel.exists({ tournamentID })

        if (_.isEmpty(tournament)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Tournament'));
        }

        // Step 4 : fetch tournament venues

        let venues = await venueModel.find({ tournamentID: tournament?._id }).select('name addressLine1 city updatedAt').lean();


        // step 5 : return sponsors Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetch Tournament Venues",
                { venues },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to fetch tournament venues",
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
const fetchSpecificTournamentVenue = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract venueId id from the request
        const { venueId } = req.params;

        // Step 2 : Validate venueId

        // Validate venueId id
        if (_.isEmpty(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('venueId'));
        }
        if (!isValidObjectId(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('venueId'));
        }

        // Step 3 : Fetch venue
        let venue = await venueModel.findById(venueId).lean();

        if (_.isEmpty(venue)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound('Venue'));
        }

        // step 4 : return venue Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Successfully Fetch Tournament Venue",
                { venue },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to fetch tournament venue",
                { message },
                false
            )
        );
    }
});

const editSpecificTournamentVenue = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract the venue details and venue id
        const { venueId } = req.params;
        const { name, addressLine1, addressLine2, city, state } = req.body;

        // Step 2 : Validate the venue details and venue Id
        // Validate venue id
        if (_.isEmpty(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('venueId'));
        }
        if (!isValidObjectId(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('venueId'));
        }

        // Validate venue details
        if (_.isEmpty(name)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('venue name'));
        }


        // Step 3 : generate add Venue payload
        const addVenuePayload: {
            name: string;
            addressLine1?: string;
            addressLine2?: string;
            city?: string;
            state?: string
        } = {
            name
        };

        if (addressLine1) {
            addVenuePayload.addressLine1 = addressLine1;
        }
        if (addressLine2) {
            addVenuePayload.addressLine2 = addressLine2;
        }
        if (city) {
            addVenuePayload.city = city;
        }
        if (state) {
            addVenuePayload.state = state;
        }

        // Step 4 : fetch venue
        const venue = await venueModel.exists({ _id: venueId });
        if (_.isEmpty(venue)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Tournament venue'));
        }

        await venueModel.updateOne(
            { _id: venue?._id },
            { $set: addVenuePayload }
        )
        // step 5 : return venue Payload

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Tournament Venue Updated successfully.",
                { venue },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to edit tournament Venue",
                { message },
                false
            )
        );
    }
});

const removeTournamentVenue = catchAsync(async (req, res) => {
    try {
        // Step 1 : Extract venueId from params
        const { venueId } = req.params;

        // Step 2 : Validate venue Id
        if (_.isEmpty(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldIsRequired('venueId'));
        }

        if (!isValidObjectId(venueId)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.validFieldObjectIdIsRequired('venueId'));
        }

        // Step 3 : Check venue exist or not
        const venue = await venueModel.exists({ _id: venueId });
        if (_.isEmpty(venue)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Venue'));
        }

        // Step 4 : delete Venue
        await venueModel.deleteOne({ _id: venue?._id });

        return res.status(statusCodes.OK).json(
            success_response(
                statusCodes.OK,
                "Tournament Venue Remove successfully.",
                { message: 'Venue Deleted Successfully' },
                true
            )
        );
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        return res.status(statusCode).json(
            failed_response(
                statusCode,
                "failed to remove tournament Venue",
                { message },
                false
            )
        );
    }
});


export {
    addVenueIntoTournament,
    fetchTournamentVenues,
    fetchSpecificTournamentVenue,
    editSpecificTournamentVenue,
    removeTournamentVenue
}