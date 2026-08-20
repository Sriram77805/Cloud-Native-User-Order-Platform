const mongoose = require("mongoose");
const crypto = require("crypto");

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  replacedByHash: { type: String, default: null },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: Mongo automatically purges expired refresh tokens.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.statics.hash = function hash(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

refreshTokenSchema.methods.isActive = function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
};

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
