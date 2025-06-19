import { IRoundRobbinFormat } from '../../../models/RRformat.model.js';
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
import matchModel from '../../../models/match.model.js';
import roundModel from '../../../models/round.model.js';
import pointTablesModel from '../../../models/pointTable.model.js';

type participantsParamsType = {
    participants: number,
    tournamentID: string,
    gameType: string,
    sportID: string,
    sportName: string,

}

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

const getRoundsAndMatchesConfigurations = (len: number) => {

    const participants = Array.from(new Array(len), (value, index) => index + 1);

    let totalRounds = 0;

    let halfSize = 0;
    if (participants.length % 2 === 0) {
        totalRounds = participants.length - 1;
    } else {
        totalRounds = participants.length;
    }
    halfSize = Math.floor(participants.length / 2);

    const schedule = [];

    // for odd
    const players = [...participants];
    for (let round = 0; round < totalRounds; round++) {
        const roundsArr = [];
        for (let match = 0; match < halfSize; match++) {
            const home = players[match];
            const away = players[players.length - 1 - match];
            //   roundsArr.push([home, away]);
            roundsArr.push(home);
            roundsArr.push(away);
        }
        schedule.push(roundsArr);
        if (participants.length % 2 == 0) {
            const lastPlayer: number = players.pop() as number;
            players.splice(1, 0, lastPlayer);
        } else {
            const lastEle = players.pop() as number;
            players.unshift(lastEle);
        }
    }
    const dataPayload = {
        totalRounds: totalRounds,
        matchesLength: halfSize,
        roundsSchedule: schedule,
    };
    return dataPayload;
};
console.log(getRoundsAndMatchesConfigurations(8));

type roundType = {
    tournamentID: string,
    formatTypeID: string,
    formatName: string,
    formatRef: string,
    fixingType: string,
    gameType: string,
    participantsRef: string,
    roundNumber: number,
    roundName: string,
    matches: number,
    brackets: string,
    scoreType: string,
    round: number[]
}
const createRoundsAndMatches = async (roundsData: roundType[], participants: string[], session: ClientSession) => {
    try {

        let roundsIds: mongoose.Schema.Types.ObjectId[] = [];
        const matchesPayload = [];
        const roundsPayload = [];
        for (const round of roundsData) {

            const roundPayload = new roundModel({
                _id: new mongoose.Types.ObjectId(), // Manually generate _id
                roundNumber: round.roundNumber,
                roundName: round.roundName,
                tournamentID: round.tournamentID,
                formatTypeID: round.formatTypeID,
                formatName: round.formatName,
                formatRef: round.formatRef,
                fixingType: round.fixingType,
                participantsRef: round?.participantsRef,
                bracket: round.brackets,
                gameType: round.gameType,
                participants: [] as mongoose.Schema.Types.ObjectId[],
                matches: [] as mongoose.Schema.Types.ObjectId[]
            });
            // Create matches for the current round
            const roundMatches = Array.from(
                new Array(round.matches),
                (value, index) => index + 1
            );

            // preparing matches data payload
            const allMatches = [];
            let matchIds = [];
            for (const match of roundMatches) {
                const teamA_Id_index = round.round[match * 2 - 2];
                const teamB_Id_index = round.round[match * 2 - 1];
                const str = round?.brackets === "winners" ? "K1" : round?.brackets === "losers" ? "K2" : "K3";
                const matchObj = new matchModel({
                    _id: new mongoose.Types.ObjectId(), // Manually generate _id
                    name: "Match #" + str + "R" + roundPayload?.roundNumber + "M" + match,
                    tournamentID: roundPayload.tournamentID,
                    roundID: roundPayload?._id?.toString(),
                    formatID: roundPayload.formatTypeID,
                    gameType: roundPayload.gameType,
                    bracket: roundPayload?.bracket,
                    scoreA: [0],
                    scoreB: [0],
                    scoreType: round?.scoreType,
                    gameTypeRef: roundPayload?.participantsRef,
                    participantA: participants[teamA_Id_index - 1],
                    participantB: participants[teamB_Id_index - 1],
                });

                // Add Score Type or Scoring Functionality
                // if (
                //     roundData?.scoreType?.toLowerCase() === "football" ||
                //     roundData?.scoreType?.toLowerCase() === "cricket"
                // ) {
                //     const tossOptions = ["Bat", "Bowl", "Choice of Side", "Kick Off"];
                //     matchObj.tossOptions = tossOptions;
                // }
                // if (roundData?.scoreType?.toLowerCase() === "football") {
                //     const footballArr = new Array(5).fill(0);
                //     matchObj.FootballA = footballArr;
                //     matchObj.FootballB = footballArr;
                // }

                allMatches.push(matchObj);
                matchesPayload.push(matchObj);
            }
            matchIds = allMatches?.map((match) => (match?._id as unknown) as mongoose.Schema.Types.ObjectId);
            roundPayload.matches = matchIds
            roundsPayload.push(roundPayload);

        }
        const allRounds = await roundModel.create(roundsPayload, { session });
        if (_.isEmpty(allRounds)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Rounds'));
        }
        const allMatches = await matchModel.create(matchesPayload, { session });
        if (_.isEmpty(allMatches)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Round Matches'));
        }
        roundsIds = allRounds?.map((round) => round?._id);
        return roundsIds;
    } catch (error) {
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
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
        const tournament: ITournament[] | mongoose.Document<ITournament>[] = await TournamentModel.create([tournamentCreatePayload], { session });
        let tournamentDetails = tournament?.[0];

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
        const RoundRobbinFormatArray: IRoundRobbinFormat[] | mongoose.Document[] = await roundRobbinFormatModel.create([RRFormatPayload], { session });
        if (_.isEmpty(RoundRobbinFormatArray)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Round Robbin Format'));
        }
        let RoundRobbinFormat = RoundRobbinFormatArray?.[0] as unknown as IRoundRobbinFormat
        // Configure the Number of Rounds and Matches 
        const roundsConfig = getRoundsAndMatchesConfigurations(participantsIds.length);
        const formatID = RoundRobbinFormat?._id?.toString();

        const roundsPayload = roundsConfig?.roundsSchedule?.map((round, index) => {
            return {
                tournamentID: tournamentId as string,
                formatTypeID: formatID as string,
                formatName: 'round_robbin',
                formatRef: 'RoundRobbin',
                fixingType,
                gameType,
                participantsRef: gameType === "team" ? "team" : "player",
                roundNumber: index + 1,
                roundName: 'Round ' + (index + 1),
                matches: roundsConfig?.matchesLength,
                brackets: 'winners',
                scoreType,
                round
            }
        });
        // Create Rounds and Matches
        const roundIds = await createRoundsAndMatches(roundsPayload, participantsIds as string[], session);
        if (_.isEmpty(roundIds)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Rounds'));
        }
        // Create Standing Table for Each Participant
        const pointTablePayload = participantsIds.map((id) => {
            return {
                tournamentID: tournamentId,
                formatID: formatID,
                formatName: "round_robbin",
                gameType,
                gameTypeRef: gameType === 'team' ? 'team' : 'individual',
                participantID: id,
            };
        });
        const pointTable = await pointTablesModel.create(
            pointTablePayload,
            { session: session }
        );

        if (_.isEmpty(pointTable)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Participant Point Table'));
        }

        const pointTableIds = pointTable.map((record) => record?._id as mongoose.Schema.Types.ObjectId);

        // Update tournament format

        RoundRobbinFormat.pointTable = pointTableIds;
        RoundRobbinFormat.rounds = roundIds;
        RoundRobbinFormat.totalRounds = roundIds.length;

        RoundRobbinFormat = await RoundRobbinFormat.save({ session });
        // Update tournament
        tournamentDetails.formatID = RoundRobbinFormat?._id;
        tournamentDetails = await tournamentDetails.save({ session });
        await session.commitTransaction();
        await session.endSession();
        return tournamentDetails
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error : Create Round Robbin Tournament Service : ", message);
        throw new AppError(statusCode, message);
    }
}

export default createRoundRobbinTournament;