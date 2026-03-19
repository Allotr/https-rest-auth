require('dotenv').config();

import express from "express";
import { getLoadedEnvVariables } from "./utils/env-loader";
import { initializeGooglePassport } from "./auth/google-passport";
import { initializeCORS } from "./cors/cors-middleware";

const app = express();

// Create GraphQL HTTP server
// IMPORTANT: ENVIRONMENT VARIABLES ONLY ARE AVAILABLE HERE AND ON onExpressServerListen
initializeCORS(app);
initializeGooglePassport(app);

const { HTTPS_PORT } = getLoadedEnvVariables();


app.listen(HTTPS_PORT, () => {
  // MongoDB Connection
  const { HTTPS_PORT } = getLoadedEnvVariables();

  console.log(`https-rest-auth server running on port ${HTTPS_PORT}`);
});


