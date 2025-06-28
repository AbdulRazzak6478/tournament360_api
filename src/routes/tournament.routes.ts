import { Router } from "express";
import { auth, getUserRole, verifyAdmin, verifyAuthorizeUser, verifySubAdmin, verifyUserAccess } from "../middlewares/auth.middleware.js";
import sportController from "../controllers/sport.controller.js";
import createTournament from "../controllers/tournament/create-tournament.controller.js";
import getGameFixturesController from "../controllers/tournament/game-fixtures.controller.js";
import updateMatchWinnerController from "../controllers/tournament/update-match-winner.controller.js";
import addParticipantIntoTournament from "../controllers/tournament/add-participant.controller.js";
import removeParticipantFromTournament from "../controllers/tournament/remove-participant.controller.js";
import editTournamentDetails from "../controllers/tournament/edit-tournament.controller.js";
import { SUB_ADMIN_PERMISSIONS } from "../constants/permisions.constant.js";
import archiveTournament from "../controllers/tournament/archive-tournament.controller.js";
import restoreTournament from "../controllers/tournament/restore-tournament.controller.js";
import deleteTournament from "../controllers/tournament/delete-tournament.controller.js";
import { fetchTournamentFeed } from "../controllers/tournament/feed-tournament.controller.js";
import { tournamentOverview } from "../controllers/tournament/overview.controller.js";


const router = Router();


// ************************************** TOURNAMENT SPORT ROUTES **********************************

// 1. Tournament Sports Endpoints
// @route  : POST /api/v1/tournament/sport
// @desc   : Create Tournament Sport
// @access : Private to Admin or Sub admin 
router.post(
    "/sport",
    verifySubAdmin(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.CREATE_SPORT,
    ),
    sportController.createSport
);

// @route  : GET /api/v1/tournament/sport
// @desc   : Fetch Sports
// @access : Private to Admin or Sub admin 
router.get(
    "/sport",
    verifySubAdmin(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.CREATE_SPORT,
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.VIEW_SPORT,
    ),
    sportController.getSports
);


// @route  : PATCH /api/v1/tournament/sport
// @desc   : Edit Tournament Sport
// @access : Private to Admin or Sub admin 
router.patch(
    "/sport",
    verifySubAdmin(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.EDIT_SPORT,
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.VIEW_SPORT,
    ),
    sportController.editSport
);


// @route  : PATCH /api/v1/tournament/sport
// @desc   : Update Sport Status
// @access : Private to Admin or Sub admin 
router.patch(
    "/sport/status/:sportID",
    verifySubAdmin(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.EDIT_SPORT,
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.VIEW_SPORT,
    ),
    sportController.updateSportStatus
);

// ************************************** TOURNAMENT ROUTES **************************************
// 2.Tournament Creation

// Create Tournament
/*
    @route         POST /api/v1/tournament/create
    @description   Creates a new tournament with specified parameters.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   CREATE_TOURNAMENT, VIEW_SPORT
*/
router.post(
    "/create",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.CREATE_TOURNAMENT,
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPORT.VIEW_SPORT,
    ),
    createTournament
);


// Add New Participant
/*
    @route         POST /api/v1/tournament/addParticipant/:tournamentID
    @description   Add New Participant Into Tournament.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   ADD_PARTICIPANT
*/
router.post(
    "/addParticipant/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.ADD_PARTICIPANT,
    ),
    addParticipantIntoTournament
);

// Remove Participant
/*
    @route         POST /api/v1/tournament/removeParticipant/:tournamentID
    @description   remove Participant from Tournament.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   REMOVE_PARTICIPANT
*/
router.post(
    "/removeParticipant/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.REMOVE_PARTICIPANT,
    ),
    removeParticipantFromTournament
);

// **************************************** Tournament Feed Routes *********************************************


// Edit Tournament
/*
    1.
    @route         POST /api/v1/tournament/editTournament/:tournamentID
    @description   Edit Tournament Details.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   EDIT_TOURNAMENT
*/
router.post(
    "/editTournament/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.EDIT_TOURNAMENT,
    ),
    editTournamentDetails
);

// Archive Tournament
/*
    2.
    @route         POST /api/v1/tournament/archive/:tournamentID
    @description   Archive The Tournament
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   ARCHIVE_TOURNAMENT
*/
router.post(
    "/archive/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.ARCHIVE_TOURNAMENT,
    ),
    archiveTournament
);

// Restore Tournament
/*
    3.
    @route         POST /api/v1/tournament/restore/:tournamentID
    @description   Restore The Archive Tournament.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   RESTORE_TOURNAMENT
*/
router.post(
    "/restore/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.RESTORE_TOURNAMENT,
    ),
    restoreTournament
);

// Delete Tournament
/*
    4. 
    @route         POST /api/v1/tournament/delete/:tournamentID
    @description   Delete Tournament from archive section.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   DELETE_TOURNAMENT
*/
router.post(
    "/delete/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.DELETE_TOURNAMENT,
    ),
    deleteTournament
);

// Fetch Tournament Feed With filters
/*
    4. 
    @route         POST /api/v1/tournament/feed/:status
    @description   Fetch Tournaments based on status and filters.
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   DELETE_TOURNAMENT
*/
router.post(
    "/feed/:status",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.VIEW_TOURNAMENTS,
    ),
    fetchTournamentFeed
);

// Fetch Tournament Overview
/*
    4. 
    @route         POST /api/v1/tournament/overview/:tournamentID
    @description   Fetch Tournament Overview
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   TOURNAMENT_OVERVIEW
*/
router.post(
    "/overview/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.TOURNAMENT_OVERVIEW,
    ),
    tournamentOverview
);


//********************************************************* Tournament Rounds routes ***********************************/

/*

    @route         POST /api/v1/tournament/game-fixtures/:tournamentID
    @description   Get Tournament Round Game Fixtures
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   GAME_FIXTURES
*/
router.get(
    "/game-fixtures/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.ROUND.GAME_FIXTURES,
    ),
    getGameFixturesController
);

// Announce Tournament Match Winner
/*
    S.No : 6
    @route         POST /api/v1/tournament/match/announce-winner/:tournamentID
    @description   Announce Tournament Match Winner
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   GAME_FIXTURES
*/
router.patch(
    "/match/announce-winner/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.ANNOUNCE_MATCH_WINNER,
    ),
    updateMatchWinnerController
);

export default router;