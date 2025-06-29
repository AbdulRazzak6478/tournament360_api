import { Router } from "express";
import { auth, getUserRole, verifyAdmin, verifyAuthorizeUser, verifySubAdmin, verifyUserAccess } from "../middlewares/auth.middleware.js";
import sportController from "../controllers/sport.controller.js";
import createTournament from "../controllers/tournament/create-tournament.controller.js";
import getGameFixturesController from "../controllers/tournament/round/game-fixtures.controller.js";
import updateMatchWinnerController from "../controllers/tournament/match/update-match-winner.controller.js";
import addParticipantIntoTournament from "../controllers/tournament/add-participant.controller.js";
import removeParticipantFromTournament from "../controllers/tournament/remove-participant.controller.js";
import editTournamentDetails from "../controllers/tournament/edit-tournament.controller.js";
import { SUB_ADMIN_PERMISSIONS } from "../constants/permissions.constant.js";
import archiveTournament from "../controllers/tournament/archive-tournament.controller.js";
import restoreTournament from "../controllers/tournament/restore-tournament.controller.js";
import deleteTournament from "../controllers/tournament/delete-tournament.controller.js";
import { fetchTournamentFeed } from "../controllers/tournament/feed-tournament.controller.js";
import { tournamentOverview } from "../controllers/tournament/overview.controller.js";
import sponsorController from "../controllers/tournament/sponsor.controller.js";
import venueController from "../controllers/tournament/venue.controller.js";
import refereeController from "../controllers/tournament/referee.controller.js";


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

// ******************************************************** Tournament Sponsors Routes *********************************

// Add Tournament Sponsor
/* 
    @route         POST /api/v1/tournament/sponsor/add/:tournamentID
    @description   Add New Sponsor
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   SPONSOR.ADD
*/
router.post(
    "/sponsor/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPONSOR.ADD,
    ),
    sponsorController.addSponsorIntoTournament
);

// GET Tournament Sponsors
/* 
    @route         GET /api/v1/tournament/sponsor/all/:tournamentID
    @description   Fetch
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   SPONSOR.VIEW
*/
router.get(
    "/sponsor/all/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPONSOR.VIEW,
    ),
    sponsorController.fetchTournamentSponsors
);

// GET Specific Tournament Sponsor
/* 
    @route         GET /api/v1/tournament/sponsor/:sponsorId
    @description   Fetch specific Tournament Sponsor
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   SPONSOR.VIEW
*/
router.get(
    "/sponsor/:sponsorId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPONSOR.VIEW,
    ),
    sponsorController.fetchSpecificTournamentSponsor
);

// Update Specific Tournament Sponsor
/* 
    @route         PATCH /api/v1/tournament/sponsor/:sponsorId
    @description   Update Sponsor details
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   SPONSOR.EDIT
*/
router.patch(
    "/sponsor/:sponsorId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPONSOR.EDIT,
    ),
    sponsorController.editSpecificTournamentSponsor
);

// Remove Tournament Sponsor
/* 
    @route         DELETE /api/v1/tournament/sponsor/:sponsorId
    @description   remove tournament Sponsor
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   SPONSOR.DELETE
*/
router.delete(
    "/sponsor/:sponsorId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.SPONSOR.DELETE,
    ),
    sponsorController.removeTournamentSponsor
);

// ******************************************************** Tournament Venues Routes *********************************

// Add Tournament Venue
/* 
    @route         POST /api/v1/tournament/venue/add/:tournamentID
    @description   Add New Venue
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   VENUE.ADD
*/
router.post(
    "/venue/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.VENUE.ADD,
    ),
    venueController.addVenueIntoTournament
);

// GET Tournament Venues
/* 
    @route         GET /api/v1/tournament/venue/all/:tournamentID
    @description   Fetch Tournament Venues
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   VENUE.VIEW
*/
router.get(
    "/venue/all/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.VENUE.VIEW,
    ),
    venueController.fetchTournamentVenues
);

// GET Specific Tournament Venue
/* 
    @route         GET /api/v1/tournament/venue/:venueId
    @description   Fetch specific Tournament Venue
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   VENUE.VIEW
*/
router.get(
    "/venue/:venueId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.VENUE.VIEW,
    ),
    venueController.fetchSpecificTournamentVenue
);

// Update Specific Tournament Venue
/* 
    @route         PATCH /api/v1/tournament/venue/:venueId
    @description   Update Specific Venue details
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   VENUE.EDIT
*/
router.patch(
    "/venue/:venueId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.VENUE.EDIT,
    ),
    venueController.editSpecificTournamentVenue
);

// Remove Tournament Venue
/* 
    @route         DELETE /api/v1/tournament/venue/:venueId
    @description   remove tournament Venue
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   VENUE.DELETE
*/
router.delete(
    "/venue/:venueId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.VENUE.DELETE,
    ),
    venueController.removeTournamentVenue
);

// ******************************************************** Tournament Referee Routes *********************************

// Add Tournament Referee
/* 
    @route         POST /api/v1/tournament/referee/add/:tournamentID
    @description   Add New Referee
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   REFEREE.ADD
*/
router.post(
    "/referee/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.REFEREE.ADD,
    ),
    refereeController.addRefereeIntoTournament
);

// GET Tournament Referees
/* 
    @route         GET /api/v1/tournament/referee/all/:tournamentID
    @description   Fetch Tournament referees
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   REFEREE.VIEW
*/
router.get(
    "/referee/all/:tournamentID",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.REFEREE.VIEW,
    ),
    refereeController.fetchTournamentReferees
);

// GET Specific Tournament Referee
/* 
    @route         GET /api/v1/tournament/referee/:refereeId
    @description   Fetch specific Tournament Referee
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   REFEREE.VIEW
*/
router.get(
    "/referee/:refereeId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.REFEREE.VIEW,
    ),
    refereeController.fetchSpecificTournamentReferees
);

// Update Specific Tournament Referee
/* 
    @route         PATCH /api/v1/tournament/referee/:refereeId
    @description   Update Specific referee details
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   REFEREE.EDIT
*/
router.patch(
    "/referee/:refereeId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.REFEREE.EDIT,
    ),
    refereeController.editSpecificTournamentReferee
);

// Remove Tournament Referee
/* 
    @route         DELETE /api/v1/tournament/referee/:refereeId
    @description   remove tournament referee
    @access        Private (Restricted to authorized users)
    @roles         Organizer, Staff
    @permissions   REFEREE.DELETE
*/
router.delete(
    "/referee/:refereeId",
    verifyAuthorizeUser(
        SUB_ADMIN_PERMISSIONS.TOURNAMENT.REFEREE.DELETE,
    ),
    refereeController.removeTournamentReferee
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