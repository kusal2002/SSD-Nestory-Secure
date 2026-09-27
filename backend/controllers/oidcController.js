const oidcConfig = require("../config/oidcConfig");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const OIDC_TRANSACTION_COOKIE = "nestory_oidc_transaction";
const {
  createOidcTransaction,
  consumeOidcTransaction,
} = require("../services/auth/oidcTransactionStore");

const handleOidcCallback = async (req, res, next) => {
  try {
    const transactionId = req.cookies[OIDC_TRANSACTION_COOKIE];

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "OIDC transaction cookie is missing or expired",
      });
    }

    const transaction = consumeOidcTransaction(transactionId);

    res.clearCookie(OIDC_TRANSACTION_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/oidc",
    });

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: "OIDC transaction is invalid or expired",
      });
    }

    const {
      discovery,
      authorizationCodeGrant,
    } = await import("openid-client");

    const config = await discovery(
      new URL(`${oidcConfig.baseUrl}/oauth2/token`),
      oidcConfig.clientId,
      oidcConfig.clientSecret,
    );

    const currentUrl = new URL(
      `${req.protocol}://${req.get("host")}${req.originalUrl}`
    );

    const tokens = await authorizationCodeGrant(
      config,
      currentUrl,
      {
        pkceCodeVerifier: transaction.codeVerifier,
        expectedState: transaction.state,
        expectedNonce: transaction.nonce,
      }
    );

    const claims = tokens.claims();

    if (!claims) {
      return res.status(401).json({
        success: false,
        message: "WSO2 did not return valid OpenID Connect claims",
      });
    }

    const oidcName =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
      claims.username ||
      null;

    if (!claims.sub || !claims.iss || !claims.email || !oidcName) {
      return res.status(400).json({
        success: false,
        message: "Required WSO2 identity claims are missing",
      });
    }

    let user = await User.findOne({
      authProvider: "wso2",
      oidcIssuer: claims.iss,
      oidcSubject: claims.sub,
    });

    if (!user) {
      const existingEmailUser = await User.findOne({
        email: claims.email.toLowerCase(),
      });

      if (existingEmailUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists. Sign in using the original authentication method.",
        });
      }

      user = await User.create({
        name: oidcName,
        email: claims.email,
        authProvider: "wso2",
        oidcIssuer: claims.iss,
        oidcSubject: claims.sub,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "WSO2 login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    return next(error);
  }
};

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
  handleOidcCallback,
};