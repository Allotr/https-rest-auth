import express from "express";
import { getLoadedEnvVariables } from "../utils/env-loader";
import { UserDbObject, UserWhitelistDbObject, GlobalRole } from "allotr-graphql-schema-types";
import { ObjectId } from "mongodb"

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import MongoStore from 'connect-mongo';
import { USERS, USER_WHITELIST } from "../consts/collections";
import { getMongoDBConnection } from "../utils/mongodb-connector";
import { getBooleanByString } from "../utils/data-util";
import { clearCache, clearUserCache, initializeRedisCache } from "../cache/envelop-responsecache";


function initializeGooglePassport(app: express.Express) {
    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL,
        MONGO_DB_ENDPOINT,
        SESSION_SECRET,
        REDIRECT_URL,
        WHITELIST_MODE
    } = getLoadedEnvVariables();

    const sessionMiddleware = session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { domain: '.allotr.eu', maxAge: 30 * 24 * 60 * 60 * 1000 },
        store: new MongoStore({ mongoUrl: MONGO_DB_ENDPOINT }),
    })

    const passportMiddleware = passport.initialize();
    const passportSessionMiddleware = passport.session();

    app.use(sessionMiddleware)
    app.use(passportMiddleware)
    app.use(passportSessionMiddleware)

    initializeRedisCache();

    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL,
                passReqToCallback: false
            },
            async (accessToken, refreshToken, profile, done) => {
                // passport callback function
                const db = await (await getMongoDBConnection()).db;
                const currentUser = await db.collection<UserDbObject>(USERS).findOne({ oauthIds: { googleId: profile.id } })

                // Obtain username
                const username = profile?._json?.email?.split?.('@')?.[0] ?? '';

                // Closed beta feature - Only allow access to whitelisted users
                const isWhiteListModeOn = getBooleanByString(WHITELIST_MODE);
                if (isWhiteListModeOn) {
                    const isInWhiteList = await db.collection<UserWhitelistDbObject>(USER_WHITELIST).findOne({ username });

                    if (!isInWhiteList) {
                        done(new Error("This is a closed beta. Ask me on Twitter (@rafaelpernil) to give you access. Thanks for your time :)"))
                        return;
                    }
                }

                //check if user already exists in our db with the given profile ID
                if (currentUser) {
                    //if we already have a record with the given profile ID
                    done(null, currentUser);
                } else {
                    //if not, create a new user 
                    const userToCreate = {
                        username,
                        globalRole: GlobalRole.User,
                        creationDate: new Date(),
                        name: profile.name?.givenName,
                        surname: profile.name?.familyName,
                        userPreferences: {},
                        oauthIds: { googleId: profile.id },
                        webPushSubscriptions: []
                    };
                    await db.collection<UserDbObject>(USERS).insertOne(userToCreate)
                    await db.collection<UserDbObject>(USERS).createIndex({ username: "text", name: "text", surname: "text" })

                    // Clear user cache if new user is registered
                    clearUserCache()

                    done(null, userToCreate);
                }
            })
    )

    passport.serializeUser<ObjectId>((user: any, done) => {
        done(null, user._id);
    });

    passport.deserializeUser<ObjectId>(async (id, done) => {
        try {
            const db = await (await getMongoDBConnection()).db;
            const idToSearch = new ObjectId(id);
            const user = await db.collection<UserDbObject>(USERS).findOne({ _id: idToSearch });
            done(null, user);
        } catch (e) {
            console.log("error deserializing user", e);
        }
    });


    // Google Oauth
    app.get("/auth/google",
        (req, res, next) => {
            // Save the url of the user's current page so the app can redirect back to it after authorization
            req.session.returnTo = req.get('referer') ? req.get('referer')! : REDIRECT_URL;
            next();
        },
        passport.authenticate("google", {
            scope: ["profile", "email"]
        })
    );

    app.get('/auth/google/redirect',
        passport.authenticate('google', {
            failureRedirect: '/auth/google/failed',
            successReturnToOrRedirect: REDIRECT_URL,
            keepSessionInfo: true
        }));

    app.get("/auth/google/logout", async (req, res, next) => {
        // Clean cached resources
        clearCache();
        
        req.logOut((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid');
            req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }
                res.redirect(REDIRECT_URL);
            })
        });
    });

    app.get("/auth/google/failed", (req, res) => res.send("Failed"));
}
export { initializeGooglePassport }