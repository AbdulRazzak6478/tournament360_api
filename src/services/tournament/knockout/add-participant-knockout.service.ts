import mongoose, { ClientSession, ObjectId } from "mongoose";
import AppError from "../../../utils/app-error.util.js";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util.js"
import TournamentModel from "../../../models/tournament.model.js";
import KnockoutModel from "../../../models/knockout-format.model.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import statusCodes from "../../../constants/status-codes.constant.js";
import _ from "lodash";
import roundModel from "../../../models/round.model.js";
import matchModel, { IMatch } from "../../../models/match.model.js";
import teamModel, { ITeam } from "../../../models/team.model.js";
import playerModel, { IPlayer } from "../../../models/player.model.js";

const getRoundNames = (participants: number, totalRounds: number) => {
    let roundNames = [];
    let roundType = "";
    for (let i = 1; i <= totalRounds; i++) {
        if (i === totalRounds) {
            roundNames.push("Final");
        } else {
            roundType =
                i === totalRounds - 1
                    ? "Semi Final"
                    : i === totalRounds - 2
                        ? "Quarter Final"
                        : `Qualification Round ${i}`;
            roundNames.push(roundType);
        }
    }
    return roundNames;
}

type bracketType = {
    roundNumber: number;
    matches: number;
    winners: number;
    losers: number;
    roundName?: string
}
const getRoundsNamesForBrackets = (bracketData: bracketType[]) => {
    let roundName = "";
    for (let i = 1; i <= bracketData.length; i++) {
        if (i === bracketData.length) {
            roundName = "Final";
        } else {
            roundName =
                i === bracketData.length - 1
                    ? "Semi Final"
                    : i === bracketData.length - 2
                        ? "Quarter Final"
                        : `Qualification Round ${i}`;
        }
        bracketData[i - 1].roundName = roundName;
    }
    return bracketData;
};

const getBracketsRoundsAndMatches = (participants: number) => {
    try {
        let totalRounds = Math.ceil(Math.log2(participants));

        let tourTeams = participants;
        const roundMatchMap = new Map();
        let winnersBrackets = [];
        for (let i = 1; i <= totalRounds; i++) {
            let matches = 0;
            let winners = 0;
            let losers = 0;
            if (tourTeams % 2 === 0) {
                matches = Math.round(tourTeams / 2);
                losers = Math.floor(tourTeams / 2);
                winners = matches;
                roundMatchMap.set(i, matches);
                tourTeams = matches;
            } else {
                matches = Math.round(tourTeams / 2);
                losers = Math.floor(tourTeams / 2);
                winners = matches;
                roundMatchMap.set(i, matches);
                tourTeams = matches;
            }
            let winnerObj = {
                roundNumber: i,
                matches,
                winners,
                losers,
            };
            winnersBrackets.push(winnerObj);
        }
        winnersBrackets = getRoundsNamesForBrackets(winnersBrackets);
        return winnersBrackets;
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in Getting rounds Matches : ", message);
        throw new AppError(statusCode, message)
    }
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
    participantsIds?: string[]
}

const createRoundAndTheirMatches = async (roundsData: roundType[], session: ClientSession) => {
    try {

        let roundsPayload = [];
        let matchesPayload = [];
        for (let roundData of roundsData) {
            // Create a new round
            const roundPayload = new roundModel({
                _id: new mongoose.Types.ObjectId(), // Manually generate _id
                roundNumber: roundData.roundNumber,
                roundName: roundData.roundName,
                tournamentID: roundData.tournamentID,
                formatTypeID: roundData.formatTypeID,
                formatName: roundData.formatName,
                formatRef: roundData.formatRef,
                fixingType: roundData.fixingType,
                participantsRef: roundData?.participantsRef,
                bracket: roundData.brackets,
                gameType: roundData.gameType,
                participants: [] as mongoose.Schema.Types.ObjectId[],
                matches: [] as mongoose.Schema.Types.ObjectId[]
            });
            if (roundData.roundNumber === 1) {
                // roundPayload.participants = participantsIds;
                roundPayload.participants = (roundData?.participantsIds as unknown) as mongoose.Schema.Types.ObjectId[];
            }
            // Create matches for the current round
            let roundMatches = Array.from(
                new Array(roundData.matches),
                (value, index) => index + 1
            );

            // preparing matches data payload
            let allMatches = [];
            let matchIds = [];
            for (let matchData of roundMatches) {
                const str = roundPayload?.bracket === "winners" ? "K1" : roundPayload?.bracket === "losers" ? "K2" : "K3";
                const matchObj = {
                    _id: new mongoose.Types.ObjectId(), // Manually generate _id
                    name: "Match #" + str + "R" + roundPayload?.roundNumber + "M" + matchData,
                    tournamentID: roundData.tournamentID,
                    roundID: roundPayload?._id?.toString(),
                    formatID: roundData.formatTypeID,
                    gameType: roundData.gameType,
                    bracket: roundData?.brackets,
                    scoreA: [0],
                    scoreB: [0],
                    scoreType: roundData?.scoreType,
                    gameTypeRef: roundData?.gameType === "team" ? "team" : "player"
                };
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
        let roundArr = await roundModel.create([...roundsPayload], {
            session: session,
        });
        if (_.isEmpty(roundArr)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField("Rounds"))
        }

        const matches = await matchModel.create(matchesPayload, {
            session: session,
        }); // creating matches

        if (_.isEmpty(matches)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField("Matches"))
        }

    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
}

const referencingMatchesToNextMatches = async (
    tournamentID: string,
    formatTypeID: string,
    bracket: string,
    session: ClientSession
) => {
    try {
        const roundMatchIdsMap = new Map();
        // Get all rounds data and matches
        let allRoundsData = await roundModel
            .find({
                tournamentID: tournamentID,
                formatTypeID: formatTypeID,
                bracket: bracket,
            })
            .populate<{ matches: IMatch[] }>("matches") // Ensures matches are populated with full objects
            .session(session);

        console.log("rounds data : ", allRoundsData);
        allRoundsData.sort(
            (round1, round2) => round1?.roundNumber - round2?.roundNumber
        );
        // Generating array upto rounds length to iterate
        let rounds = Array.from(
            new Array(allRoundsData.length),
            (value, index) => index + 1
        );
        // saving the next rounds matches Ids into Map
        allRoundsData?.forEach((round) => {
            // const matchArray: string[] = round?.matches?.map((match: IMatch) => match._id.toString());
            const matchArray = round.matches.map((match) => {
                if (typeof match === "object" && "_id" in match) {
                    return match._id.toString(); // It's a populated match object
                }
            });
            roundMatchIdsMap.set(round.roundNumber, matchArray);
        });

        // iterating over the rounds and there matches to add reference of next rounds matches
        let bulkUpdateMatches = [];
        for (let round of rounds) {
            let roundMatches = (allRoundsData[round - 1].matches as unknown) as IMatch[] & mongoose.Document;

            // referencing next round or match in current match
            let index = 0;
            for (let i = 0; i < roundMatches.length; i += 2) {
                if (roundMatchIdsMap.get(round + 1)) {
                    const updateOne = {
                        filter: {},
                        update: {}
                    }
                    let nextRoundMatchesIds: ObjectId[] = roundMatchIdsMap.get(round + 1);
                    if (index < nextRoundMatchesIds.length) {
                        // having next round match
                        roundMatches[i].nextMatch = nextRoundMatchesIds[index];
                        updateOne.filter = { _id: roundMatches[i]?._id }
                        updateOne.update = { $set: { nextMatch: roundMatches[i].nextMatch } }
                        bulkUpdateMatches.push({
                            updateOne: {
                                filter: { _id: roundMatches[i]?._id },
                                update: { $set: { nextMatch: roundMatches[i]?.nextMatch } }
                            }
                        });
                        if (i + 1 < roundMatches.length) {
                            if (roundMatches[i + 1]) {
                                roundMatches[i + 1].nextMatch = nextRoundMatchesIds[index];
                                bulkUpdateMatches.push({
                                    updateOne: {
                                        filter: { _id: roundMatches[i + 1]?._id },
                                        update: { $set: { nextMatch: roundMatches[i + 1].nextMatch } }
                                    }
                                });
                            }

                        }
                    }
                    // else {
                    //     // no next round match
                    //     roundMatches[i].nextMatch = null; // no next round match
                    //     allRoundsData[round - 1].matches[i] = await (roundMatches[i] as mongoose.Document & IMatch).save({
                    //         session,
                    //     });
                    //     if (i + 1 < roundMatches.length) {
                    //         if (roundMatches[i + 1]) {
                    //             roundMatches[i + 1].nextMatch = null; // no next round match
                    //             allRoundsData[round - 1].matches[i + 1] = await (roundMatches[i + 1] as mongoose.Document & IMatch).save({ session });
                    //         }
                    //     }
                    // }
                    index += 1; // incrementing to get next match id index
                }
            }
        }

        const result = await matchModel.bulkWrite(bulkUpdateMatches, { session });
        if (!_.isEmpty(result) && (result?.matchedCount !== bulkUpdateMatches?.length || result?.modifiedCount !== bulkUpdateMatches?.length)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Update Match reference failed.")
        }

        bulkUpdateMatches = [];
        // matches placeholder making
        // 1. start allocating placeholder from next round
        for (let i = 2; i <= rounds.length; i++) {
            let prevRoundMatchesIds = roundMatchIdsMap.get(i - 1);
            let currentRoundMatches = allRoundsData[i - 1].matches;
            let index = 0;
            for (let match = 0; match < currentRoundMatches.length; match++) {
                if (index < prevRoundMatchesIds.length) {
                    const setObj = { matchA: prevRoundMatchesIds[index], matchB: null };
                    currentRoundMatches[match].matchA = prevRoundMatchesIds[index];
                    if (index + 1 < prevRoundMatchesIds.length) {
                        setObj.matchB = prevRoundMatchesIds[index + 1];
                        currentRoundMatches[match].matchB = prevRoundMatchesIds[index + 1];
                        index = index + 2;
                    } else {
                        index++;
                    }
                    bulkUpdateMatches.push({
                        updateOne: {
                            filter: { _id: currentRoundMatches[match]?._id },
                            update: { $set: { ...setObj } }
                        }
                    })
                }
            }
        }
        const result2 = await matchModel.bulkWrite(bulkUpdateMatches, { session });
        if (!_.isEmpty(result2) && (result2?.matchedCount !== bulkUpdateMatches?.length || result2?.modifiedCount !== bulkUpdateMatches?.length)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Update Matches Placeholder failed.")
        }
        return allRoundsData;
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};

const arrangingTeamsBasedOnFixingType = (fixingType: string, participants: ObjectId[]) => {
    try {
        let arrangedParticipants: ObjectId[] = [];
        let matchFixingType = fixingType.toLowerCase();

        if (matchFixingType === "top_vs_bottom") {
            let updatedTeams = [];
            let start = 0;
            let end = participants.length - 1;
            while (start <= end) {
                if (start === end) {
                    updatedTeams.push(participants[start]);
                    start++;
                    end--;
                } else if (start < end) {
                    updatedTeams.push(participants[start]);
                    updatedTeams.push(participants[end]);
                    start++;
                    end--;
                }
            }
            arrangedParticipants = updatedTeams;
        }
        if (matchFixingType === "random") {
            // Generate random sorting metrics proportional to array length
            let randomMetrics = participants.map((item) => ({
                item,
                sortMetric: Math.floor(Math.random() * participants.length),
            }));
            // Sort based on the generated metrics
            randomMetrics.sort((a, b) => a.sortMetric - b.sortMetric);
            // Extract sorted items
            arrangedParticipants = randomMetrics.map((item) => item.item);
        }
        if (matchFixingType === "sequential" || matchFixingType === "manual") {
            arrangedParticipants = participants;
        }
        return arrangedParticipants;
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};
const addParticipantInKnockoutFormatAndReArrangeTournament = async (tournamentID: string, participantName: string) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        let tournamentDetails = await TournamentModel
            .findById(tournamentID)
            .session(session);
        if (_.isEmpty(tournamentDetails)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Tournament"));
        }
        let KnockoutFormat = await KnockoutModel
            .findById(tournamentDetails?.formatID)
            .session(session);
        if (_.isEmpty(KnockoutFormat)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Knockout Format"));
        }

        let isWinnerDeclared = false;
        if (tournamentDetails?.status !== "PENDING") {
            isWinnerDeclared = true;
        }
        if (isWinnerDeclared) {
            throw new AppError(statusCodes.BAD_REQUEST, `Can't Add Participants. Tournament is ${tournamentDetails?.status === "ACTIVE" ? "STARTED" : tournamentDetails?.status}`);
        }

        await roundModel
            .deleteMany({
                tournamentID: tournamentDetails?._id,
            })
            .session(session);
        await matchModel
            .deleteMany({
                tournamentID: tournamentDetails?._id,
            })
            .session(session);


        let tournamentId = tournamentDetails?._id?.toString();
        let allParticipantIds: string[] = [];
        const participantObj = {
            tournamentID: tournamentId,
            participantNumber: tournamentDetails?.totalParticipants + 1,
            sportID: tournamentDetails?.sportID,
            sportName: tournamentDetails?.sportName,
            name: participantName,
        }
        if (tournamentDetails?.gameType === 'team') {
            let newParticipant: ITeam[] = await teamModel.create([participantObj], {
                session: session,
            });
            if (_.isEmpty(newParticipant)) {
                throw new AppError(statusCodes.BAD_REQUEST, "Team Creation Failed.");
            }
            const teams = await teamModel
                .find({ tournamentID: tournamentId })
                .select('name')
                .session(session).lean();
            if (_.isEmpty(teams)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Teams"));
            }
            // let sportName = teams?.[0]?.sportName;
            // await teamModel.findByIdAndUpdate(newParticipant?.[0]?._id, { sportName });
            allParticipantIds = teams?.map((team) => team?._id?.toString());
        }
        if (tournamentDetails?.gameType === 'individual') {
            let newParticipant: IPlayer[] = await playerModel.create([participantObj], {
                session: session,
            });
            if (_.isEmpty(newParticipant)) {
                throw new AppError(statusCodes.BAD_REQUEST, "Player Creation Failed.");
            }
            const players = await playerModel
                .find({ tournamentID: tournamentId })
                .select('name')
                .session(session).lean();
            if (_.isEmpty(players)) {
                throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.fieldNotFound("Players"));
            }
            // let sportName = players?.[0]?.sportName;
            // await teamModel.findByIdAndUpdate(newParticipant?.[0]?._id, { sportName });
            allParticipantIds = players?.map((player) => player?._id?.toString());
        }

        let totalRounds = Math.ceil(Math.log2(allParticipantIds?.length));
        let roundNames = getRoundNames(allParticipantIds?.length, totalRounds);


        let roundsData = getBracketsRoundsAndMatches(allParticipantIds?.length);

        let roundsPayload = roundsData?.map((round) => {
            let obj = round?.roundNumber === 1 ? { participantsIds: allParticipantIds as string[] } : {}
            return {
                tournamentID: tournamentId as string,
                formatTypeID: KnockoutFormat?._id?.toString() as string,
                formatName: "knockout",
                formatRef: "knockout",
                fixingType: tournamentDetails?.fixingType as string,
                gameType: tournamentDetails?.gameType as string,
                participantsRef: tournamentDetails?.gameType === "team" ? "team" : "player",
                roundNumber: round?.roundNumber,
                roundName: round?.roundName as string,
                matches: round?.matches,
                brackets: "winners",
                scoreType: tournamentDetails?.scoreType as string,
                ...obj
            };
        });

        await createRoundAndTheirMatches(roundsPayload, session);

        const allRoundsAndMatches = await referencingMatchesToNextMatches(tournamentId as string, KnockoutFormat?._id?.toString() as string, "winners", session);

        // const allRoundsAndMatches = allRoundsData;
        const arrangedTeams = arrangingTeamsBasedOnFixingType(
            tournamentDetails?.fixingType,
            (allParticipantIds as unknown) as ObjectId[]
        );

        // assigning participants into round matches
        let idx = 0;
        for (let round = 0; round < allRoundsAndMatches.length; round++) {
            if (allRoundsAndMatches[round]?.roundNumber === 1) {
                idx = round;
            }
        }
        let index = 0;
        console.log("before")
        const firstRoundMatches = allRoundsAndMatches[idx]?.matches ? allRoundsAndMatches[idx]?.matches : [];
        let bulkMatchUpdates = [];
        for (let match of firstRoundMatches) {
            if (arrangedTeams && index < arrangedTeams.length) {
                let setObj: { participantA: mongoose.Schema.Types.ObjectId, participantB?: mongoose.Schema.Types.ObjectId } = { participantA: arrangedTeams[index] }
                match.participantA = arrangedTeams[index];
                if (index + 1 < arrangedTeams.length) {
                    match.participantB = arrangedTeams[index + 1];
                    setObj.participantB = arrangedTeams[index + 1];
                    index += 2;
                }
                bulkMatchUpdates.push({
                    updateOne: {
                        filter: { _id: match?._id },
                        update: { $set: setObj }
                    }
                })
                // match = await (match as mongoose.Document & IMatch).save({ session });
            }
        }
        console.log("after")
        const result3 = await matchModel.bulkWrite(bulkMatchUpdates, { session });
        if (!_.isEmpty(result3) && (result3?.matchedCount !== bulkMatchUpdates?.length || result3?.modifiedCount !== bulkMatchUpdates?.length)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Failed to Update Match Participants.")
        }
        const allRounds = allRoundsAndMatches;
        if (_.isEmpty(allRounds)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Rounds and their Matches not found.");
        }
        let roundsIds = allRounds?.map((round) => (round?._id as unknown) as mongoose.Schema.Types.ObjectId);

        tournamentDetails.totalParticipants = allParticipantIds?.length;
        KnockoutFormat.rounds = roundsIds;
        KnockoutFormat.roundNames = roundNames;
        KnockoutFormat.totalParticipants = allParticipantIds?.length;
        KnockoutFormat.participants = (allParticipantIds as unknown) as mongoose.Schema.Types.ObjectId[];
        KnockoutFormat.rounds = roundsIds;

        KnockoutFormat = await KnockoutFormat.save({ session });

        tournamentDetails.formatID = KnockoutFormat?._id as mongoose.Schema.Types.ObjectId;
        tournamentDetails = await tournamentDetails.save({ session });
        console.log("tournamentDetails : ", tournamentDetails)
        await session.commitTransaction();
        await session.endSession();
        return tournamentDetails;
    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        console.log("Error in add participant knockout service : ", message);
        throw new AppError(statusCode, message);
    }
}

export default addParticipantInKnockoutFormatAndReArrangeTournament;