import _ from "lodash";
import AppErrorCode from "../../../constants/appErrorCode.js";
import statusCodes from "../../../constants/statusCodes.js";
import Sport from "../../../models/sport.model.js";
import AppError from "../../../utils/appError.js";
import catchErrorMsgAndStatusCode from "../../../utils/catchError.js";
import TournamentModel, { ITournament } from "../../../models/tournament.model.js";
import mongoose, { ClientSession } from "mongoose";
import roundRobbinFormatModel from "../../../models/RRformat.model.js";
import teamModel from "../../../models/team.model.js";
import playerModel from "../../../models/player.model.js";

type participantsParamsType = {
    participants: number,
    tournamentID: string,
    gameType: string,
    sportID: string,
    sportName: string,

}
console.log("testing")
const createParticipants = async (
    { participants, tournamentID, gameType, sportID, sportName }: participantsParamsType,
    session: ClientSession // Pass session as an argument
) => {
    try {
        const participantsObjData: {
            tournamentID: string;
            sportID: string;
            sportName: string;
            participantNumber: number;
            name: string;
        }[] = [];

        for (let i = 1; i <= participants; i++) {
            participantsObjData.push({
                tournamentID,
                sportID,
                sportName,
                participantNumber: i,
                name: gameType === "team" ? `Team #${i}` : `Player #${i}`,
            });
        }

        let participantsArr = [];
        if (gameType === "team") {
            participantsArr = await teamModel.create(participantsObjData, { session });
        }
        else if (gameType === "individual") {
            participantsArr = await playerModel.create(participantsObjData, { session });
        } else {
            throw new AppError(statusCodes.BAD_REQUEST, "Invalid gameType while creating Participants.");
        }
        if (_.isEmpty(participantsArr)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField(gameType === "team" ? "Teams" : "Players"));
        }

        participantsArr.sort((participant1, participant2) => participant1.participantNumber - participant2.participantNumber);
        const participantsIds = participantsArr.map((participant) => participant?._id?.toString());

        return participantsIds; // Return generated IDs 
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};

type payloadType = {
    gameType: string,
    participants: number,
    formatType: string,
    sportID: string,
    fixingType: string
}
const createRoundRobbinTournament = async (data: payloadType) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log("data : ", data);
        data.participants = +data.participants
        // Extract the fields from data
        const { gameType, participants, formatType, sportID, fixingType } = data;

        // Fetch the tournament sport
        const tournamentSport = await Sport.findById(sportID).select('_id name').lean();
        if (_.isEmpty(tournamentSport)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Sport'));
        }

        // Identify the scoreType for Tournament
        let scoreType = "Top Score";
        if (tournamentSport?.name?.toLowerCase() === "cricket") {
            scoreType = "Cricket";
        }
        if (tournamentSport?.name?.toLowerCase() === "football") {
            scoreType = "Football";
        }
        const scoreTypes = [
            "Top Score",
            "Best Of",
            "Race To",
            "Cricket",
            "Football",
        ];

        // Generate Tournament Id
        const tournamentID = `TMT${Date.now()}`;

        // Create Round Robbin Tournament
        const tournamentCreatePayload = {
            tournamentID,
            sportID: tournamentSport?._id?.toString(),
            sportName: tournamentSport?.name,
            formatName: formatType,
            fixingType: fixingType,
            gameType: gameType,
            scoreTypes: scoreTypes,
            scoreType: scoreType,
            totalParticipants: participants,
            formatRef: "RoundRobbin"
        }
        let tournament = await TournamentModel.create([tournamentCreatePayload], { session });
        let tournamentDetails = tournament[0];

        // Create Participants
        const tournamentId = tournamentDetails?._id?.toString();
        const participantPayload = {
            participants,
            tournamentID: tournamentId as string,
            gameType,
            sportID: tournamentSport?._id as string,
            sportName: tournamentSport?.name
        }
        const participantsIds = await createParticipants(participantPayload, session);
        if (_.isEmpty(participantsIds)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Participants'));
        }
        // Create Round Robbin format
        const RRFormatPayload = {
            tournamentID: tournamentDetails?._id,
            formatName: formatType,
            fixingType,
            gameType,
            totalParticipants: participantsIds.length,
            participants: participantsIds,
            participantsRef: gameType === 'team' ? 'team' : 'player'
        }
        const RoundRobbinFormat = await roundRobbinFormatModel.create([RRFormatPayload], { session });
        if (_.isEmpty(RoundRobbinFormat)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Round Robbin Format'));
        }
        // Configure the Number of Rounds and Matches 
        // Create Rounds and Matches
        // Create Standing Table for Each Participant
        // Update tournament format
        // Update tournament

        return tournamentDetails
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error : Create Round Robbin Tournament Service : ", message);
        throw new AppError(statusCode, message);
    }
}

export default createRoundRobbinTournament;