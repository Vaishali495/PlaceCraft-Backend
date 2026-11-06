
import nodemailer from "nodemailer";

const emailHost = process.env.EMAIL_HOST;
const emailPort = Number(process.env.EMAIL_PORT);
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const frontendUrl = process.env.FRONTEND_URL;

if (!emailHost || !emailPort || !emailUser || !emailPass || !frontendUrl) {
  throw new Error("Email configuration is missing in environment variables.");
}

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

export const sendVerificationEmail = async (
  email: string,
  token: string,
) => {
  const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `"PlaceCraft" <${emailUser}>`,
    to: email,
    subject: "Verify Your Email Address - PlaceCraft",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome to PlaceCraft!</h2>

        <p>Thank you for registering with PlaceCraft.</p>

        <p>Please verify your email address by clicking the button below:</p>

        <a
          href="${verificationUrl}"
          style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;"
        >
          Verify Email Address
        </a>

        <p style="margin-top: 24px;">
          This verification link will expire in 15 minutes.
        </p>

        <p>If you did not create this account, you can safely ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />

        <p style="color: #6b7280; font-size: 12px;">
          © ${new Date().getFullYear()} PlaceCraft. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;
