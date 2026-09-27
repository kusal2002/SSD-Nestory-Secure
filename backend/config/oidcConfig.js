const requiredEnvVars = [
  "WSO2_BASE_URL",
  "WSO2_CLIENT_ID",
  "WSO2_CLIENT_SECRET",
  "WSO2_REDIRECT_URI",
  "WSO2_FRONTEND_URL",
];

const missingEnvVars = requiredEnvVars.filter(
  (key) => !process.env[key] || !process.env[key].trim(),
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required WSO2 OIDC environment variables: ${missingEnvVars.join(", ")}`,
  );
}

const baseUrl = process.env.WSO2_BASE_URL.replace(/\/+$/, "");

const oidcConfig = {
  baseUrl,
  clientId: process.env.WSO2_CLIENT_ID,
  clientSecret: process.env.WSO2_CLIENT_SECRET,
  redirectUri: process.env.WSO2_REDIRECT_URI,
  frontendUrl: process.env.WSO2_FRONTEND_URL,

  authorizationEndpoint: `${baseUrl}/oauth2/authorize`,
  tokenEndpoint: `${baseUrl}/oauth2/token`,
  userInfoEndpoint: `${baseUrl}/oauth2/userinfo`,

  scopes: ["openid", "profile", "email"],
};

module.exports = oidcConfig;