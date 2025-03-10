import yup from 'yup';

const ObjectIdSchema = (field: string) => (yup.string().required(`${field} is required`).matches(/^[0-9a-fA-F]{24}$/, `pass a valid ${field} as ObjectId.`))

const createTournamentSchema = yup.object({
    gameType: yup.string().oneOf(['team', 'individual'], 'Invalid gameType').required("gameType is required"),
    formatType: yup.string().oneOf(['knockout', 'double_elimination_bracket', 'round_robbin'], 'Invalid formatType').required("formatType is required"),
    fixingType: yup.string().oneOf(['random', 'manual', 'top_vs_bottom', 'sequential'], 'Invalid fixingType').required("fixingType is required"),
    sportID: ObjectIdSchema("sportID"),
    participants: yup.number().min(5, "participants must be at least 5").max(50, "participants must be up to 50 only.").required("participants are required"),
});


export {
    ObjectIdSchema,
    createTournamentSchema,
}