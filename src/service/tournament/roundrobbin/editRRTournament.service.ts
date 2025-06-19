import mongoose, { ClientSession } from "mongoose";
import catchErrorMsgAndStatusCode from "../../../utils/catchError.js";
import AppError from "../../../utils/appError.js";
import TournamentModel from "../../../models/tournament.model.js";
import statusCodes from "../../../constants/statusCodes.js";
import AppErrorCode from "../../../constants/appErrorCode.js";
import roundRobbinFormatModel from "../../../models/RRformat.model.js";
import _ from "lodash";
import roundModel from "../../../models/round.model.js";
import matchModel from "../../../models/match.model.js";
import teamModel from "../../../models/team.model.js";
import playerModel from "../../../models/player.model.js";
import pointTablesModel from "../../../models/pointTable.model.js";
import Sport from "../../../models/sport.model.js";


type participantsParamsType = {
    participants: number,
    tournamentID: string,
    gameType: string,
    sportID: string,
    sportName: string,
    length: number

}
const createParticipants = async (
    { participants, tournamentID, gameType, sportID, sportName, length }: participantsParamsType,
    session: ClientSession // Pass session as an argument
) => {
    try {
        let participantsObjData: {
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
                participantNumber: i + length,
                name: gameType === "team" ? `Team #${i + length}` : `Player #${i + length}`,
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
        let participantsIds = participantsArr.map((participant) => participant?._id?.toString());

        return participantsIds; // Return generated IDs 
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};

const getRoundsAndMatchesConfigurations = (len: number) => {

    let participants = Array.from(new Array(len), (value, index) => index + 1);

    let totalRounds = 0;

    let halfSize = 0;
    if (participants.length % 2 === 0) {
        totalRounds = participants.length - 1;
    } else {
        totalRounds = participants.length;
    }
    halfSize = Math.floor(participants.length / 2);

    let schedule = [];

    // for odd
    let players = [...participants];
    for (let round = 0; round < totalRounds; round++) {
        let roundsArr = [];
        for (let match = 0; match < halfSize; match++) {
            let home = players[match];
            let away = players[players.length - 1 - match];
            //   roundsArr.push([home, away]);
            roundsArr.push(home);
            roundsArr.push(away);
        }
        schedule.push(roundsArr);
        if (participants.length % 2 == 0) {
            let lastPlayer: number = players.pop() as number;
            players.splice(1, 0, lastPlayer);
        } else {
            let lastEle = players.pop() as number;
            players.unshift(lastEle);
        }
    }
    let dataPayload = {
        totalRounds: totalRounds,
        matchesLength: halfSize,
        roundsSchedule: schedule,
    };
    return dataPayload;
};

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
        let matchesPayload = [];
        let roundsPayload = [];
        for (let round of roundsData) {

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
            let roundMatches = Array.from(
                new Array(round.matches),
                (value, index) => index + 1
            );

            // preparing matches data payload
            let allMatches = [];
            let matchIds = [];
            for (let match of roundMatches) {
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

type dataType = {
    tournamentID: string,
    fixingType: string,
    gameType: string,
    participants: number,
    Name: string,
    description: string,
    startDate: Date,
    endDate: Date,
    sportID: string,
    formatType: string,
}
const editRoundRobbinFormatTournament = async (data: dataType) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        data.participants = +data.participants;
        const { tournamentID, gameType, participants, Name, description, startDate, endDate, sportID, formatType } = data;

        let tournamentDetails = await TournamentModel.findById(tournamentID).session(session);
        if (_.isEmpty(tournamentDetails)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist("Tournament"))
        }
        if (tournamentDetails?.status === 'ACTIVE' || tournamentDetails?.status === 'COMPLETED') {
            throw new AppError(statusCodes.BAD_REQUEST, `Tournament is ${tournamentDetails?.status}, Can't Updated Tournament.`);
        }

        let RoundRobbinFormat = await roundRobbinFormatModel.findById(tournamentDetails?.formatID).session(session);
        if (_.isEmpty(RoundRobbinFormat)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist("Knockout Format"))
        }
        if (tournamentDetails?.gameType !== gameType) {
            throw new AppError(statusCodes.BAD_REQUEST, "gameType Cannot be Change.")
        }
        if (tournamentDetails?.formatName !== formatType) {
            throw new AppError(statusCodes.BAD_REQUEST, "formatType Cannot be Change.")
        }
        // 2. Update SportID Into Tournament
        if (sportID !== tournamentDetails?.sportID?.toString()) {
            let tournamentSport = await Sport.findById(sportID).session(session);
            if (_.isEmpty(tournamentSport)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotExist("Sport"))
            }
            tournamentDetails.sportID = tournamentSport?._id as unknown as mongoose.Schema.Types.ObjectId;
            tournamentDetails.sportName = tournamentSport?.name;
            // tournamentDetails.sportName = tournamentSport?.name;
            if (tournamentSport?.name?.toLowerCase() === "cricket") {
                tournamentDetails.scoreType = "Cricket";
            } else if (tournamentSport?.name?.toLowerCase() === "football") {
                tournamentDetails.scoreType = "Football";
            } else if (
                tournamentDetails?.scoreType === "Cricket" ||
                tournamentDetails?.scoreType === "Football"
            ) {
                tournamentDetails.scoreType = "Top Score";
            }
            await matchModel
                .updateMany(
                    { tournamentID: tournamentDetails?._id },
                    { scoreType: tournamentDetails.scoreType }
                )
                .session(session);
            // 2.checks if sportName is different
            if (tournamentDetails?.gameType === "team") {
                await teamModel
                    .updateMany(
                        { tournamentID: tournamentDetails?._id },
                        {
                            sportID: tournamentSport?._id?.toString(),
                            sportName: tournamentSport?.name,
                        }
                    )
                    .session(session);
            } else {
                await playerModel
                    .updateMany(
                        { tournamentID: tournamentDetails?._id },
                        {
                            sportID: tournamentSport?._id?.toString(),
                            sportName: tournamentSport?.name,
                        }
                    )
                    .session(session);
            }
        }

        // 3. Save Tournament Details
        if (tournamentDetails.tournamentName !== Name) {
            tournamentDetails.tournamentName = Name;
        }
        if (tournamentDetails.description !== description) {
            tournamentDetails.description = description;
        }
        if (tournamentDetails.startDate !== startDate) {
            tournamentDetails.startDate = startDate;
        }
        if (tournamentDetails.endDate !== endDate) {
            tournamentDetails.endDate = endDate;
        }

        if (participants !== tournamentDetails?.totalParticipants) {
            let participantsIds = [];
            let checks = participants - tournamentDetails?.totalParticipants > 0 ? true : false;
            let remainingParticipants = checks
                ? participants - tournamentDetails?.totalParticipants
                : participants;
            const tourId = tournamentDetails?._id?.toString();
            // let starting = checks ? tournamentDetails?.totalParticipants : 0;
            if (!checks) {
                if (tournamentDetails.gameType === "team") {
                    await teamModel.deleteMany({
                        tournamentID: tourId,
                    });
                }
                if (tournamentDetails.gameType === "individual") {
                    await playerModel.deleteMany({
                        tournamentID: tourId,
                    });
                }
                RoundRobbinFormat.participants = [];
            }
            participantsIds = await createParticipants({ participants: remainingParticipants, tournamentID, gameType, sportID, sportName: tournamentDetails?.sportName, length: checks ? tournamentDetails?.totalParticipants : 0 }, session);
            participantsIds = [...RoundRobbinFormat.participants, ...participantsIds];

            const tournamentId = tournamentDetails?._id?.toString();
            // Configure the Number of Rounds and Matches 
            const roundsConfig = getRoundsAndMatchesConfigurations(participantsIds.length);
            const formatID = RoundRobbinFormat?._id?.toString();

            await roundModel
                .deleteMany({
                    tournamentID: tournamentDetails?._id,
                    formatTypeID: tournamentDetails?.formatID,
                })
                .session(session);
            await matchModel
                .deleteMany({
                    tournamentID: tournamentDetails?._id,
                    formatID: tournamentDetails?.formatID,
                })
                .session(session);

            const roundsPayload = roundsConfig?.roundsSchedule?.map((round, index) => {
                return {
                    tournamentID: tournamentId as string,
                    formatTypeID: formatID as string,
                    formatName: 'round_robbin',
                    formatRef: 'RoundRobbin',
                    fixingType: tournamentDetails?.fixingType as string,
                    gameType: tournamentDetails?.gameType as string,
                    participantsRef: tournamentDetails?.gameType === "team" ? "team" : "player",
                    roundNumber: index + 1,
                    roundName: 'Round ' + (index + 1),
                    matches: roundsConfig?.matchesLength,
                    brackets: 'winners',
                    scoreType: tournamentDetails?.scoreType as string,
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
                    gameType: tournamentDetails?.gameType as string,
                    gameTypeRef: tournamentDetails?.gameType === 'team' ? 'team' : 'individual',
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
            RoundRobbinFormat.participants = participantsIds as unknown as mongoose.Schema.Types.ObjectId[];
            RoundRobbinFormat.pointTable = pointTableIds;
            RoundRobbinFormat.rounds = roundIds;
            RoundRobbinFormat.totalRounds = roundIds.length;
            RoundRobbinFormat = await RoundRobbinFormat.save({ session });
            tournamentDetails.formatID = RoundRobbinFormat?._id;
            tournamentDetails.totalParticipants = participantsIds.length;
        }

        // Update tournament
        tournamentDetails = await tournamentDetails.save({ session });

        await session.commitTransaction();
        await session.endSession();
        return tournamentDetails
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in edit Round Robbin Tournament service : ", message);
        throw new AppError(statusCode, message);
    }
}


export default editRoundRobbinFormatTournament;