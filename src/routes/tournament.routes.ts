import { Router } from "express";
import { auth, getUserRole, verifyAdmin, verifySubAdmin, verifyUserAccess } from "../middlewares/auth.js";
import sportController from "../controllers/sport.controller.js";
import createTournament from "../controllers/tournament/createTournament.controller.js";
import getGameFixturesController from "../controllers/tournament/gameFixtures.controller.js";
import updateMatchWinnerController from "../controllers/tournament/updateMatchWinner.controller.js";
import addParticipantIntoTournament from "../controllers/tournament/AddParticipant.controller.js";
import removeParticipantFromTournament from "../controllers/tournament/RemoveParticipant.controller.js";


const router = Router();

const permissions = {
    // 1.TOURNAMENT SPORTS 
    CREATE_SPORT: "CREATE SPORT",
    FETCH_SPORTS: "FETCH SPORTS",
    EDIT_SPORT: "EDIT SPORT",
    UPDATE_SPORT: "UPDATE SPORT",
    REMOVE_SPORT: "REMOVE SPORT",
}


// ************************************** TOURNAMENT SPORT ROUTES **********************************

// 1. Tournament Sports Endpoints
// Create Tournament Sport
router.post(
    "/sport",
    // verifyAdmin,
    // verifySubAdmin(permissions.CREATE_SPORT),
    sportController.createSport
);
// Fetch Sports
router.get(
    "/sport",
    verifySubAdmin(permissions.FETCH_SPORTS),
    sportController.getSports
);
// Edit Tournament Sport
router.put(
    "/sport",
    verifySubAdmin(permissions.EDIT_SPORT),
    sportController.editSport
);
// Update Sport Status
router.put(
    "/sport/status/:sportID",
    verifySubAdmin(permissions.UPDATE_SPORT),
);

// ************************************** TOURNAMENT ROUTES **************************************
// 2.Tournament Creation
router.post(
    "/create",
    // auth,
    // getUserRole,
    // verifyUserAccess("CREATE TOURNAMENT"),
    createTournament
);
router.post(
    "/addParticipant/:tournamentID",
    // auth,
    // getUserRole,
    // verifyUserAccess("CREATE TOURNAMENT"),
    addParticipantIntoTournament
);
router.post(
    "/removeParticipant/:tournamentID",
    // auth,
    // getUserRole,
    // verifyUserAccess("CREATE TOURNAMENT"),
    removeParticipantFromTournament
);

// Get tournament Game Fixtures
router.get(
    "/game-fixtures/:tournamentID",
    // auth,
    // getUserRole,
    // verifyUserAccess("GET TOURNAMENT GAME FIXTURES"),
    getGameFixturesController
);

// Announce Tournament Match Winner
router.patch(
    "/match/announce-winner/:tournamentID",
    // auth,
    // getUserRole,
    // verifyUserAccess("ANNOUNCE TOURNAMENT MATCH WINNER"),
    updateMatchWinnerController
)

export default router;