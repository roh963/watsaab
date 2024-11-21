import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import logger from "../logger/winston.logger.js";
import { MAILTRAP_SMTP_HOST, MAILTRAP_SMTP_PASS, MAILTRAP_SMTP_PORT, MAILTRAP_SMTP_USER } from "../../config.js";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "FreeAPI",
      link: "https://freeapi.app",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: MAILTRAP_SMTP_HOST,
    port: MAILTRAP_SMTP_PORT,
    auth: {
      user: MAILTRAP_SMTP_USER,
      pass: MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.freeapi@gmail.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    logger.error("Email service failed silently. Check MAILTRAP credentials.");
    logger.error("Error: ", error);
  }
};

const emailVerificationMailgenContent = (username, verificationUrl) => ({
  body: {
    name: username,
    intro: "Welcome to our WhatsApp-like app! We're excited to have you.",
    action: {
      instructions: "Click the button below to verify your email address:",
      button: {
        color: "#22BC66",
        text: "Verify your email",
        link: verificationUrl,
      },
    },
    outro: "Need help or have questions? Reply to this email.",
  },
});

const forgotPasswordMailgenContent = (username, passwordResetUrl) => ({
  body: {
    name: username,
    intro: "We received a request to reset your password.",
    action: {
      instructions: "Click the button below to reset your password:",
      button: {
        color: "#22BC66",
        text: "Reset password",
        link: passwordResetUrl,
      },
    },
    outro: "If you did not request this, please ignore this email.",
  },
});

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};
