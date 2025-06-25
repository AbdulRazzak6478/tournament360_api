import AppError from "../../../utils/appError.js";
import catchErrorMsgAndStatusCode from "../../../utils/catchError.js";
import sportModel from "../../../models/sport.model.js";
import _ from "lodash";
import statusCodes from "../../../constants/statusCodes.js";
import AppErrorCode from "../../../constants/appErrorCode.js";
import TournamentModel, { ITournament } from "../../../models/tournament.model.js";
import mongoose, { ClientSession, HydratedDocument, ObjectId } from "mongoose";
import teamModel from "../../../models/team.model.js";
import playerModel from "../../../models/player.model.js";
import KnockoutModel from "../../../models/knockoutFormat.model.js";
import roundModel from "../../../models/round.model.js";
import matchModel, { IMatch } from "../../../models/match.model.js";



type payloadType = {
    gameType: string,
    participants: number,
    formatType: string,
    sportID: string,
    fixingType: string
}
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
        let participantsIds = participantsArr.map((participant) => participant?._id?.toString());

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
        console.log("Error in creating rounds and matches : ", message, error);
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
                // return match?._id?.toString();
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
const tournamentKnockoutFormatCreation = async (payload: payloadType) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log("knockout payload received");
        const data = {
            gameType: payload.gameType,
            participants: +payload.participants,
            formatType: payload.formatType,
            sportID: payload.sportID,
            fixingType: payload.fixingType,
        };
        const { gameType, participants, formatType, sportID, fixingType } = payload;
        const tournamentSport = await sportModel.findById(sportID).lean();
        if (_.isEmpty(tournamentSport)) {
            throw new AppError(statusCodes.NOT_FOUND, AppErrorCode.sportNotFound);
        }

        let scoreType = "Top Score";
        if (tournamentSport?.name?.toLowerCase() === "cricket") {
            scoreType = "Cricket";
        }
        if (tournamentSport?.name?.toLowerCase() === "football") {
            scoreType = "Football";
        }

        let tournamentID = `TMT${Date.now()}`;

        let totalRounds = Math.ceil(Math.log2(data.participants));
        let roundNames = getRoundNames(data.participants, totalRounds);

        const scoreTypes = [
            "Top Score",
            "Best Of",
            "Race To",
            "Cricket",
            "Football",
        ];

        const tournamentPayload = {
            tournamentID,
            gameType,
            sportID: tournamentSport?._id,
            sportName: tournamentSport?.name,
            formatName: formatType,
            totalParticipants: participants,
            fixingType,
            formatRef: "knockout",
            scoreType,
            scoreTypes
        }

        let tournamentDetailsArray: HydratedDocument<ITournament>[] = await TournamentModel.create(
            [tournamentPayload],
            { session }
        );
        if (_.isEmpty(tournamentDetailsArray)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.unableToCreateTournament);
        }
        let tournamentDetails: HydratedDocument<ITournament> | null = tournamentDetailsArray?.[0] || null;

        console.log("tournament created");

        const tourId = tournamentDetails?._id?.toString();
        const participantPayload = {
            participants,
            tournamentID: tourId as string,
            gameType,
            sportID: tournamentSport?._id as string,
            sportName: tournamentSport?.name
        }
        let participantsIds = await createParticipants(participantPayload, session);
        if (_.isEmpty(participantsIds)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField('Participants'));
        }
        console.log("participants created");

        const knockoutPayload = {
            tournamentID: tourId,
            formatName: 'knockout',
            fixingType,
            gameType,
            totalRounds,
            roundNames,
            totalParticipants: participants,
            participantRef: gameType === "team" ? "team" : "player",
            participants: participantsIds
        }

        let KnockoutArray = await KnockoutModel.create(
            [knockoutPayload],
            { session }
        );
        if (_.isEmpty(KnockoutArray)) {
            throw new AppError(statusCodes.BAD_REQUEST, AppErrorCode.notAbleToCreateField("Tournament Format"));
        }
        let knockoutFormat = KnockoutArray?.[0];
        console.log("knockout format created");

        console.log("Rounds and matches configuring");
        let roundsData = getBracketsRoundsAndMatches(data.participants);

        let roundsPayload = roundsData?.map((round) => {
            let obj = round?.roundNumber === 1 ? { participantsIds: participantsIds as string[] } : {}
            return {
                tournamentID: tourId as string,
                formatTypeID: knockoutFormat?._id?.toString() as string,
                formatName: "knockout",
                formatRef: "knockout",
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
        
        // console.log("rounds Payload ", roundsPayload);
        await createRoundAndTheirMatches(roundsPayload, session);
        console.log("rounds and matches are created");

        const allRoundsAndMatches = await referencingMatchesToNextMatches(tourId as string, knockoutFormat?._id?.toString() as string, "winners", session);
        console.log("all matches next matches reference added")
        // const allRoundsAndMatches = allRoundsData;
        const arrangedTeams = arrangingTeamsBasedOnFixingType(
            data.fixingType,
            (participantsIds as unknown) as ObjectId[]
        );


        // assigning participants into round matches
        let matches: IMatch[] = [];
        for (let round = 0; round < allRoundsAndMatches.length; round++) {
            if (allRoundsAndMatches[round]?.roundNumber === 1) {
                // idx = round;
                matches = allRoundsAndMatches[round]?.matches;
            }
        }
        let index = 0;
        let bulkMatchUpdates = [];
        for (let match of matches) {
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
        const result3 = await matchModel.bulkWrite(bulkMatchUpdates, { session });
        console.log("Participants Assigned to Matches");
        if (!_.isEmpty(result3) && (result3?.matchedCount !== bulkMatchUpdates?.length || result3?.modifiedCount !== bulkMatchUpdates?.length)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Failed to Update Match Participants.")
        }
        const allRounds = allRoundsAndMatches;
        if (_.isEmpty(allRounds)) {
            throw new AppError(statusCodes.BAD_REQUEST, "Rounds and their Matches not found.");
        }
        let roundsIds = allRounds?.map((round) => (round?._id as unknown) as mongoose.Schema.Types.ObjectId);
        knockoutFormat.rounds = roundsIds;
        knockoutFormat = await knockoutFormat.save({ session });

        tournamentDetails.formatID = knockoutFormat?._id as mongoose.Schema.Types.ObjectId;
        tournamentDetails = await tournamentDetails.save({ session });

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


export default tournamentKnockoutFormatCreation;