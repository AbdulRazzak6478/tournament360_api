import AppError from "../../../utils/app-error.util.js";
import catchErrorMsgAndStatusCode from "../../../utils/catch-error.util.js";
import sportModel from "../../../models/sport.model.js";
import _ from "lodash";
import statusCodes from "../../../constants/status-codes.constant.js";
import AppErrorCode from "../../../constants/app-error-codes.constant.js";
import TournamentModel, { ITournament } from "../../../models/tournament.model.js";
import mongoose, { ClientSession, HydratedDocument, ObjectId } from "mongoose";
import teamModel from "../../../models/team.model.js";
import playerModel from "../../../models/player.model.js";
import roundModel, { IRound } from "../../../models/round.model.js";
import matchModel, { IMatch } from "../../../models/match.model.js";
import doubleKnockoutModel from "../../../models/double-knockout.model.js";
import { generateTournamentID } from "../../../utils/unique-ids.util.js";

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
        let winnersBrackets = [];
        let losersBrackets = [];
        for (let i = 1; i <= totalRounds; i++) {
            let matches = 0;
            let winners = 0;
            let losers = 0;
            matches = Math.round(tourTeams / 2);
            losers = Math.floor(tourTeams / 2);
            winners = matches;
            tourTeams = matches;
            let losersMatches = 0;
            let losersWinners = 0;
            let losersBracketLosers = 0;
            if (i == 1) {
                losersMatches = Math.round(losers / 2);
                losersWinners = Math.round(losers / 2);
                losersBracketLosers = Math.floor(losers / 2);
            } else {
                losersMatches = Math.round(
                    (losers + losersBrackets[i - 2]?.winners) / 2
                );
                losersWinners = Math.round(
                    (losers + losersBrackets[i - 2]?.winners) / 2
                );
                losersBracketLosers = Math.floor(
                    (losers + losersBrackets[i - 2]?.winners) / 2
                );
            }
            let losersObj = {
                roundNumber: i,
                matches: losersMatches,
                winners: losersWinners,
                losers: losersBracketLosers,
            };
            losersBrackets.push(losersObj);
            let winnerObj = {
                roundNumber: i,
                matches,
                winners,
                losers,
            };
            winnersBrackets.push(winnerObj);
        }
        let winners = losersBrackets[totalRounds - 1]?.winners;
        let round = totalRounds;
        while (winners > 1) {
            let losersMatches = Math.round(winners / 2);
            let losersWinners = losersMatches;
            let losersBracketLosers = Math.floor(winners / 2);
            let losersObj = {
                roundNumber: round + 1,
                matches: losersMatches,
                winners: losersWinners,
                losers: losersBracketLosers,
            };
            losersBrackets.push(losersObj);
            winners = losersMatches;
        }
        winnersBrackets = getRoundsNamesForBrackets(winnersBrackets);
        losersBrackets = getRoundsNamesForBrackets(losersBrackets);
        const winnersRoundNames = winnersBrackets?.map(
            (bracket) => bracket?.roundName
        );
        const losersRoundNames = losersBrackets?.map(
            (bracket) => bracket?.roundName
        );
        const bracketsPayload = {
            winnersBrackets,
            losersBrackets,
            winnersRoundNames,
            losersRoundNames,
        };
        return bracketsPayload;
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
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

        const roundsPayload = [];
        const matchesPayload = [];
        for (const roundData of roundsData) {
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
            const roundMatches = Array.from(
                new Array(roundData.matches),
                (value, index) => index + 1
            );

            // preparing matches data payload
            const allMatches = [];
            let matchIds = [];
            for (const matchData of roundMatches) {
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
                    gameTypeRef: roundData?.participantsRef
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
        const roundArr = await roundModel.create([...roundsPayload], {
            session: session,
        });
        if (_.isEmpty(roundArr)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField("Rounds"))
        }

        const matches = await matchModel.create(matchesPayload, {
            session: session,
        });

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
        const allRoundsData = await roundModel
            .find({
                tournamentID: tournamentID,
                formatTypeID: formatTypeID,
                bracket: bracket,
            }).select('roundNumber matches')
            .populate<{ matches: IMatch[] & mongoose.Document }>({
                path: "matches",
                select: "_id matchA matchB nextMatch"
            })
            .session(session);
        allRoundsData.sort(
            (round1, round2) => round1?.roundNumber - round2?.roundNumber
        );

        // Generating array upto rounds length to iterate
        const rounds = Array.from(
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
                // return match?._id?.toString();
            });
            roundMatchIdsMap.set(round.roundNumber, matchArray);
        });

        // iterating over the rounds and there matches to add reference of next rounds matches
        let bulkUpdateMatches = [];
        for (const round of rounds) {
            const roundMatches = (allRoundsData[round - 1].matches as unknown) as IMatch[] & mongoose.Document;

            // referencing next round or match in current match
            let index = 0;
            for (let i = 0; i < roundMatches.length; i += 2) {
                if (roundMatchIdsMap.get(round + 1)) {
                    const nextRoundMatchesIds: ObjectId[] = roundMatchIdsMap.get(round + 1);
                    if (index < nextRoundMatchesIds.length) {

                        // having next round match
                        roundMatches[i].nextMatch = nextRoundMatchesIds[index];
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
            const prevRoundMatchesIds = roundMatchIdsMap.get(i - 1);
            const currentRoundMatches = allRoundsData[i - 1].matches;

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
type payloadType = {
    gameType: string,
    participants: number,
    formatType: string,
    sportID: string,
    fixingType: string
}
const arrangingTeamsBasedOnFixingType = (fixingType: string, participants: ObjectId[]) => {
    try {
        let arrangedParticipants: ObjectId[] = [];
        const matchFixingType = fixingType.toLowerCase();

        if (matchFixingType === "top_vs_bottom") {
            const updatedTeams = [];
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
            const randomMetrics = participants.map((item) => ({
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

type bracketRoundType = {
    matches: IMatch[]
}

const assigningLosersIntoLosersBracket = async (
    winnersBracket: bracketRoundType[],
    losersBracket: bracketRoundType[],
    session: ClientSession
) => {
    try {
        let round = 0;
        const bulkMatchUpdates = [];
        for (let loserRound of losersBracket) {
            let index = 0;
            for (let match = 0; match < loserRound?.matches?.length; match++) {
                if (round >= winnersBracket.length) {
                    break;
                }

                // winnersBracket[round].matches = winnersBracket[round]?.matches as IMatch[]
                if (index < winnersBracket[round]?.matches.length) {

                    if (round === 0) {
                        if (!loserRound.matches[match].matchA) {
                            if (
                                winnersBracket[round]?.matches[index]?.participantA &&
                                winnersBracket[round]?.matches[index]?.participantB
                            ) {
                                loserRound.matches[match].matchA =
                                    winnersBracket[round]?.matches[index]?._id;

                                index++;
                            }
                        }
                        if (
                            !loserRound.matches[match].matchB &&
                            index < winnersBracket[round]?.matches.length
                        ) {
                            if (
                                winnersBracket[round]?.matches[index]?.participantA &&
                                winnersBracket[round]?.matches[index]?.participantB
                            ) {
                                loserRound.matches[match].matchB =
                                    winnersBracket[round]?.matches[index]?._id;
                                index++;
                            }
                        }
                        bulkMatchUpdates.push({
                            updateOne: {
                                filter: { _id: loserRound.matches[match]?._id },
                                update: { $set: { matchA: loserRound.matches[match].matchA, matchB: loserRound.matches[match].matchB } }
                            }
                        });
                    } else {
                        if (!loserRound.matches[match].matchA) {
                            if (
                                winnersBracket[round]?.matches[index]?.matchA &&
                                winnersBracket[round]?.matches[index]?.matchB
                            ) {
                                loserRound.matches[match].matchA =
                                    winnersBracket[round]?.matches[index]?._id;
                                index++;
                            }
                        }
                        if (
                            !loserRound.matches[match].matchB &&
                            index < winnersBracket[round]?.matches.length
                        ) {
                            if (
                                winnersBracket[round]?.matches[index]?.matchA &&
                                winnersBracket[round]?.matches[index]?.matchB
                            ) {
                                loserRound.matches[match].matchB =
                                    winnersBracket[round]?.matches[index]?._id;
                                index++;
                            }
                        }

                        bulkMatchUpdates.push({
                            updateOne: {
                                filter: { _id: loserRound.matches[match]?._id },
                                update: { $set: { matchA: loserRound.matches[match].matchA, matchB: loserRound.matches[match].matchB } }
                            }
                        });
                    }

                }
            }
            round++;
        }

        await matchModel.bulkWrite(bulkMatchUpdates, { session });
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};
type finalBracketPayload = {
    tournamentID: string;
    formatTypeID: mongoose.Schema.Types.ObjectId;
    formatName: string;
    formatRef: string;
    fixingType: string;
    gameType: string;
    participantsRef: string;
    roundNumber: number;
    roundName: string;
    matches: number;
    brackets: string;
    scoreType: string;
}

const creatingFinalBracketRoundMatch = async (data: finalBracketPayload, session: ClientSession) => {
    try {
        const roundObj = {
            _id: new mongoose.Types.ObjectId(), // Manually generate _id
            roundNumber: data.roundNumber,
            roundName: data.roundName,
            tournamentID: data.tournamentID,
            formatTypeID: data.formatTypeID,
            formatName: data.formatName,
            formatRef: data.formatRef,
            fixingType: data.fixingType,
            participantsRef: data?.participantsRef,
            bracket: data.brackets,
            gameType: data.gameType,
        };
        let finalBracketArr = await roundModel.create([roundObj], {
            session,
        });
        if (_.isEmpty(finalBracketArr)) {
            throw new Error(AppErrorCode.notAbleToCreateField('Final Bracket'));
        }
        let finalBracket = finalBracketArr[0] as IRound & mongoose.Document;
        const str = "K3";
        const matchObj = {
            name: "Match #" + str + "R" + finalBracket?.roundNumber + "M" + 1,
            // tournamentID: data.tournamentID,
            tournamentID: finalBracket.tournamentID,
            roundID: finalBracket?._id?.toString(),
            formatID: finalBracket.formatTypeID,
            gameType: finalBracket.gameType,
            bracket: finalBracket?.bracket,
            scoreA: [0],
            scoreB: [0],
            scoreType: data?.scoreType,
            gameTypeRef: data?.participantsRef
        };
        // if (
        //     data?.scoreType.toLowerCase() === "football" ||
        //     data?.scoreType.toLowerCase() === "cricket"
        // ) {
        //     const tossOptions = ["Bat", "Bowl", "Choice of Side", "Kick Off"];
        //     matchObj.tossOptions = tossOptions;
        // }
        // if (data?.scoreType.toLowerCase() === "football") {
        //     const footballArr = new Array(5).fill(0);
        //     matchObj.FootballA = footballArr;
        //     matchObj.FootballB = footballArr;
        // }
        let finalMatchArr = await matchModel.create([matchObj], { session });

        if (_.isEmpty(finalMatchArr)) {
            throw new Error(",not able to create final bracket round match");
        }
        let finalMatch = finalMatchArr[0] as IMatch;
        finalBracket.matches = [finalMatch?._id];
        finalBracket = await finalBracket?.save({ session });
        return {
            finalBracket,
            finalMatch,
        };
    } catch (error) {
        const { statusCode, message } = catchErrorMsgAndStatusCode(error);
        throw new AppError(statusCode, message);
    }
};
const tournamentDoubleKnockoutFormatCreation = async (payload: payloadType) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Step 1 : Extract the data fields from payload
        const data = {
            gameType: payload.gameType,
            participants: +payload.participants,
            formatType: payload.formatType,
            sportID: payload.sportID,
            fixingType: payload.fixingType,
        };
        const { gameType, participants, formatType, sportID, fixingType } = payload;


        // Step 2 : Validate Sport is Exist or not
        const tournamentSport = await sportModel.findById(sportID).select("name").lean();
        if (_.isEmpty(tournamentSport)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.fieldNotFound('Sport'));
        }

        // Step 3 : Identify the scoreType for Tournament
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

        // Step 4 : Generate Tournament Id and Create Tournament

        // 4.1 : Generate Tournament Id
        const tournamentID = generateTournamentID();

        // 4.2 : Create Tournament
        const tournamentPayload = {
            tournamentID,
            gameType,
            sportID: tournamentSport?._id,
            sportName: tournamentSport?.name,
            formatName: formatType,
            totalParticipants: participants,
            fixingType,
            formatRef: "doubleKnockout",
            scoreType,
            scoreTypes
        }

        const tournamentDetailsArray: HydratedDocument<ITournament>[] = await TournamentModel.create(
            [tournamentPayload],
            { session }
        );
        if (_.isEmpty(tournamentDetailsArray)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.unableToCreateTournament);
        }
        let tournamentDetails: HydratedDocument<ITournament> | null = tournamentDetailsArray?.[0] || null;


        // Step 5 : Create Participants
        const tourId = tournamentDetails?._id?.toString();
        const participantPayload = {
            participants,
            tournamentID: tourId as string,
            gameType,
            sportID: tournamentSport?._id as string,
            sportName: tournamentSport?.name
        }
        const participantsIds = await createParticipants(participantPayload, session);
        if (_.isEmpty(participantsIds)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Participants'));
        }

        // Step 6 : Create Double Knockout Tournament
        const doubleKnockoutPayload = {
            tournamentID: tourId,
            formatName: 'double_elimination_bracket',
            fixingType,
            gameType,
            totalParticipants: participants,
            participantRef: gameType === "team" ? "team" : "player",
            participants: participantsIds
        }

        const doubleKnockoutArray = await doubleKnockoutModel.create(
            [doubleKnockoutPayload],
            { session }
        );
        if (_.isEmpty(doubleKnockoutArray)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField("Double Knockout Format"));
        }
        let doubleKnockoutFormat = doubleKnockoutArray?.[0];


        // Step 7 : Generate Brackets Round Data For winners, losers
        const roundsData = getBracketsRoundsAndMatches(data.participants);

        // Step 8 : Create Rounds For Winners Bracket
        const winnersBracketPayload = roundsData?.winnersBrackets.map((round) => {
            const obj = round?.roundNumber === 1 ? { participantsIds: participantsIds as string[] } : {}
            return {
                tournamentID: tourId as string,
                formatTypeID: doubleKnockoutFormat?._id?.toString() as string,
                formatName: "double_elimination_bracket",
                formatRef: "doubleKnockout",
                fixingType,
                gameType,
                participantsRef: gameType === "team" ? "team" : "player",
                roundNumber: round?.roundNumber,
                roundName: round?.roundName as string,
                matches: round?.matches,
                brackets: "winners",
                scoreType,
                ...obj
            };
        });
        const losersBracketPayload = roundsData?.losersBrackets.map((round) => {
            // const obj = round?.roundNumber === 1 ? { participantsIds: participantsIds as string[] } : {}
            return {
                tournamentID: tourId as string,
                formatTypeID: doubleKnockoutFormat?._id?.toString() as string,
                formatName: "double_elimination_bracket",
                formatRef: "doubleKnockout",
                fixingType,
                gameType,
                participantsRef: gameType === "team" ? "team" : "player",
                roundNumber: round?.roundNumber,
                roundName: round?.roundName as string,
                matches: round?.matches,
                brackets: "losers",
                scoreType,
            };
        });

        await createRoundAndTheirMatches(winnersBracketPayload, session);


        // Step 9 : add Referencing of next matches and Add Previous Match Placeholders

        const allRoundsAndMatches = await referencingMatchesToNextMatches(tourId as string, doubleKnockoutFormat?._id?.toString() as string, "winners", session);
        // const allRoundsAndMatches = allRoundsData;
        const arrangedTeams = arrangingTeamsBasedOnFixingType(
            data.fixingType,
            (participantsIds as unknown) as ObjectId[]
        );


        // Step 10 : assigning participants into round matches
        let matches: IMatch[] = [];
        for (let round = 0; round < allRoundsAndMatches.length; round++) {
            if (allRoundsAndMatches[round]?.roundNumber === 1) {
                matches = allRoundsAndMatches[round]?.matches;
            }
        }
        let index = 0;
        const bulkMatchUpdates = [];
        for (const match of matches) {
            if (arrangedTeams && index < arrangedTeams.length) {
                const setObj: { participantA: mongoose.Schema.Types.ObjectId, participantB?: mongoose.Schema.Types.ObjectId } = { participantA: arrangedTeams[index] }
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
                });
            }
        }
        const result3 = await matchModel.bulkWrite(bulkMatchUpdates, { session });

        if (!_.isEmpty(result3) && (result3?.matchedCount !== bulkMatchUpdates?.length || result3?.modifiedCount !== bulkMatchUpdates?.length)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Failed to Update Match Participants.")
        }
        // Step 11 : Create Rounds For Losers Bracket
        await createRoundAndTheirMatches(losersBracketPayload, session);

        // Step 12 : Add Referencing of Matches into Loser Bracket and Add Previous Match Placeholders
        const losersBracketRounds = await referencingMatchesToNextMatches(tourId as string, doubleKnockoutFormat?._id?.toString() as string, "losers", session);

        // Step 13 : Assign Losers of Winners Bracket into losers Bracket
        const winnersRoundMatches = allRoundsAndMatches?.map((round) => ({ matches: round?.matches as IMatch[] }));
        const losersRoundMatches = losersBracketRounds?.map((round) => ({ matches: round?.matches as IMatch[] }));

        await assigningLosersIntoLosersBracket(
            winnersRoundMatches,
            losersRoundMatches,
            session
        );

        // Create Final Bracket
        // Step 14 : Creating Final Round and match
        const finalObjData = {
            tournamentID: tourId as string,
            formatTypeID: doubleKnockoutFormat?._id,
            formatName: "double_elimination_bracket",
            formatRef: "doubleKnockout",
            fixingType,
            gameType,
            participantsRef: gameType === "team" ? "team" : "player",
            roundNumber: 1,
            roundName: 'Final',
            matches: 1,
            brackets: "Final Bracket",
            scoreType,
        };
        const finalBracketData = await creatingFinalBracketRoundMatch(
            finalObjData,
            session
        );

        const finalBracketRound = finalBracketData?.finalBracket;
        let FinalBracketMatch = finalBracketData?.finalMatch as IMatch & mongoose.Document;

        // 15. Setting Reference of participants Into Final Bracket Match From winners and losers bracket Final match
        const winnersLastRound = allRoundsAndMatches.length;
        const bracketFinalMatchesUpdates = [];
        allRoundsAndMatches[winnersLastRound - 1].matches[0].nextMatch =
            FinalBracketMatch?._id;
        FinalBracketMatch.matchA =
            allRoundsAndMatches[winnersLastRound - 1].matches[0]?._id;
        bracketFinalMatchesUpdates.push({
            updateOne: {
                filter: { _id: allRoundsAndMatches[winnersLastRound - 1].matches[0]?._id },
                update: { nextMatch: FinalBracketMatch?._id }
            }
        });


        let losersLastRound = losersBracketRounds.length;
        losersBracketRounds[losersLastRound - 1].matches[0].nextMatch =
            FinalBracketMatch?._id;
        FinalBracketMatch.matchB =
            losersBracketRounds[losersLastRound - 1].matches[0]?._id;


        bracketFinalMatchesUpdates.push({
            updateOne: {
                filter: { _id: losersBracketRounds[losersLastRound - 1].matches[0]?._id },
                update: { nextMatch: FinalBracketMatch?._id }
            }
        });
        // Step 16 : Add referencing and Placeholder of Previous Bracket Finals
        await matchModel.bulkWrite(bracketFinalMatchesUpdates, { session });

        FinalBracketMatch = await FinalBracketMatch.save({ session });
        // Step 17 : Update Double Knockout and Tournament 
        const winnersBracketRounds = roundsData?.winnersBrackets?.length;
        const winnersBracketNames = roundsData?.winnersRoundNames;
        const winnersBracketRoundIds = allRoundsAndMatches?.map((round) => round?._id);

        const losersBracketTotalRounds = roundsData?.losersBrackets?.length;
        const losersBracketNames = roundsData?.losersRoundNames;
        const losersBracketRoundIds = losersBracketRounds?.map((round) => round?._id);

        doubleKnockoutFormat.totalWinnersRounds = winnersBracketRounds;
        doubleKnockoutFormat.winnersRoundsNames = winnersBracketNames as string[];
        doubleKnockoutFormat.winnersRoundsIds = winnersBracketRoundIds;
        doubleKnockoutFormat.totalLosersRounds = losersBracketTotalRounds;
        doubleKnockoutFormat.losersRoundsNames = losersBracketNames as string[];
        doubleKnockoutFormat.losersRoundsIds = losersBracketRoundIds;
        doubleKnockoutFormat.finalRoundName = finalBracketRound?.roundName;
        doubleKnockoutFormat.finalRoundId = [finalBracketRound?._id];

        tournamentDetails.formatID = doubleKnockoutFormat?._id;
        doubleKnockoutFormat = await doubleKnockoutFormat.save({ session })
        tournamentDetails = await tournamentDetails.save({ session })

        // Step 18 : return response Payload

        console.log("Tournament Format Created Successfully");

        await session.commitTransaction();
        await session.endSession();
        return tournamentDetails;

    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        const { message, statusCode } = catchErrorMsgAndStatusCode(error);
        console.log("Error in create knockout service : ", message);
        throw new AppError(statusCode, message);
    }
};


export default tournamentDoubleKnockoutFormatCreation;