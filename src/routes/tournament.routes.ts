import { Router } from "express";
import { auth, getUserRole, verifyAdmin, verifyAuthorizeUser, verifySubAdmin, verifyUserAccess } from "../middlewares/auth.js";
import sportController from "../controllers/sport.controller.js";
import createTournament from "../controllers/tournament/createTournament.controller.js";
import getGameFixturesController from "../controllers/tournament/gameFixtures.controller.js";
import updateMatchWinnerController from "../controllers/tournament/updateMatchWinner.controller.js";
import addParticipantIntoTournament from "../controllers/tournament/AddParticipant.controller.js";
import removeParticipantFromTournament from "../controllers/tournament/RemoveParticipant.controller.js";
import editTournamentDetails from "../controllers/tournament/EditTournament.controller.js";
import { SUB_ADMIN_PERMISSIONS } from "../constants/permisions.js";
import archiveTournament from "../controllers/tournament/archiveTournament.controller.js";


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


/*
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

/*
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

/*
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
    editTournamentDetails
);




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