import { MongoDBSingleton } from "../utils/mongodb-connector";


declare module 'express-session' {
    export interface SessionData {
        returnTo: string;
    }
}