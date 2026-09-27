const oidcConfig = require("../config/oidcConfig");
const {
  createOidcTransaction,
} = require("../services/auth/oidcTransactionStore");

const OIDC_TRANSACTION_COOKIE = "nestory_oidc_transaction";

const startOidcLogin = async (req, res, next) => {
  try {
  const {
    randomState,
    randomNonce,
    randomPKCECodeVerifier,
    calculatePKCECodeChallenge,
    buildAuthorizationUrl,
    discovery,
  } = await import("openid-client");

    const state = randomState();
    const nonce = randomNonce();
    const codeVerifier = randomPKCECodeVerifier();

    const codeChallenge =
      await calculatePKCECodeChallenge(codeVerifier);

    const transactionId = createOidcTransaction({
      state,
      codeVerifier,
      nonce,
    });

    res.cookie(OIDC_TRANSACTION_COOKIE, transactionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
      path: "/api/auth/oidc",
    });

    const config = await discovery(
      new URL(`${oidcConfig.baseUrl}/oauth2/token`),
      oidcConfig.clientId,
      oidcConfig.clientSecret,
    );

    const authorizationUrl = buildAuthorizationUrl(config, {
      redirect_uri: oidcConfig.redirectUri,
      scope: oidcConfig.scopes.join(" "),
      response_type: "code",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return res.redirect(authorizationUrl.href);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  startOidcLogin,
};