import express from 'express';
import cors, { CorsOptions } from 'cors';
import catchAsync from './utils/catchAsync.js';
import env from './constants/env.js';
import apiRoutes from "./routes/index.js"
import authRoutes from "./routes/auth.routes.js"
import { connectDB } from './config/database.js';



const app = express();
const allowedOrigins = ['http://localhost:4001', 'http://localhost:3001', 'http://example3.com'];

const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        console.log("Received origin:", origin);
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'), false);
        }
    }
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/', catchAsync(async (req, res) => {
    console.log("Request received");
    res.send("Hello World");
}));
app.use("/api/v1",apiRoutes);
app.use("/auth",authRoutes);

let port = env.PORT; // 4004
app.listen(port, async() => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log("Server is started ");
    await connectDB();
});