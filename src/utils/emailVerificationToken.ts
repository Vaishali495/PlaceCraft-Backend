
import crypto from "node:crypto";

interface EmailVerificationToken {
  token: string;
  hashedToken: string;
  expiresAt: Date;
}

export const generateEmailVerificationToken =
  (): EmailVerificationToken => {
    // Generate a cryptographically secure random token.
    const token = crypto.randomBytes(32).toString("hex");

    // Hash the original token using SHA-256.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Set token expiry to 15 minutes.
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return {
      token,
      hashedToken,
      expiresAt,
    };
  };
