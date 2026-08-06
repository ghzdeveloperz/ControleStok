import { env } from "../../config/env";

const FUNCTIONS_REGION = "southamerica-east1";

const remoteFunctionsBaseUrl = `https://${FUNCTIONS_REGION}-${env.firebase.projectId}.cloudfunctions.net`;

const emulatorFunctionsBaseUrl = `http://${env.emulators.functionsHost}:${env.emulators.functionsPort}/${env.firebase.projectId}/${FUNCTIONS_REGION}`;

export const backendEndpoints = Object.freeze({
  functionsBaseUrl: env.emulators.enabled
    ? emulatorFunctionsBaseUrl
    : remoteFunctionsBaseUrl,
  completeAccountRegistration: env.emulators.enabled
    ? `${emulatorFunctionsBaseUrl}/completeAccountRegistration`
    : `${remoteFunctionsBaseUrl}/completeAccountRegistration`,
});
