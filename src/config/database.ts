import mongoose from 'mongoose';
import env from '../constants/env.js';

const connectDB = async (): Promise<void> => {
    try {
        const MONGO_URI = env.NODE_ENV === "PROD" ? env.MONGO_URI_PROD : env.MONGO_URI_TEST;
        console.log("ENV : ", env.NODE_ENV, ", URI : ", MONGO_URI);
        if (!MONGO_URI) {
            throw new Error('Database URI is not defined in the environment variables');
        }
        mongoose.connect(MONGO_URI);
        const db = mongoose.connection;
        db.on("error", (error) => {
            console.error(error)
            throw new Error("Connecting DB Error : " + error?.message)
        });

        db.once("open", () => console.log("Connected to Database"));
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error connecting to MongoDB:', error.message);
        } else {

            console.log("Error in connecting DB : ", error)
        }
        process.exit(1);
    }
};

const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
};


export { connectDB, disconnectDB };