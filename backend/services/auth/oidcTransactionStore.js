const crypto = require("crypto");

const transactions = new Map();

const TRANSACTION_TTL_MS = 5 * 60 * 1000;

const cleanupExpiredTransactions = () => {
  const now = Date.now();

  for (const [transactionId, transaction] of transactions.entries()) {
    if (transaction.expiresAt <= now) {
      transactions.delete(transactionId);
    }
  }
};

const createOidcTransaction = ({ state, codeVerifier, nonce }) => {
  cleanupExpiredTransactions();

  const transactionId = crypto.randomBytes(32).toString("hex");

  transactions.set(transactionId, {
    state,
    codeVerifier,
    nonce,
    expiresAt: Date.now() + TRANSACTION_TTL_MS,
  });

  return transactionId;
};

const consumeOidcTransaction = (transactionId) => {
  cleanupExpiredTransactions();

  const transaction = transactions.get(transactionId);

  if (!transaction) {
    return null;
  }

  transactions.delete(transactionId);

  if (transaction.expiresAt <= Date.now()) {
    return null;
  }

  return transaction;
};

module.exports = {
  createOidcTransaction,
  consumeOidcTransaction,
};