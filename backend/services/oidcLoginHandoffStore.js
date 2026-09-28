const crypto = require("crypto");

const HANDOFF_TTL_MS = 60 * 1000;
const handoffs = new Map();

const createOidcLoginHandoff = (userId) => {
  const code = crypto.randomBytes(32).toString("base64url");

  handoffs.set(code, {
    userId: userId.toString(),
    expiresAt: Date.now() + HANDOFF_TTL_MS,
  });

  return code;
};

const consumeOidcLoginHandoff = (code) => {
  if (!code) {
    return null;
  }

  const handoff = handoffs.get(code);

  // One-time use even if the entry has expired.
  handoffs.delete(code);

  if (!handoff || handoff.expiresAt < Date.now()) {
    return null;
  }

  return handoff;
};

module.exports = {
  createOidcLoginHandoff,
  consumeOidcLoginHandoff,
};