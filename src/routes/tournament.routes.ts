import { Router } from "express";
import { auth, getUserRole, verifyAdmin, verifySubAdmin, verifyUserAccess } from "../middlewares/auth.js";
import sportController from "../controllers/sportController.js";
import createTournament from "../controllers/tournament/createTournamentController.js";


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

export default router;