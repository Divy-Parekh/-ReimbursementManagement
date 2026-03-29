const prisma = require('../utils/prisma');
const { sendEmail } = require('./emailService');

const createNotification = async (userId, title, message, sendEmailNotification = false, userEmail = null, userName = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    if (sendEmailNotification && userEmail) {
      const subject = title;
      const htmlContent = `
        <h2>${title}</h2>
        <p>Hi ${userName || 'User'},</p>
        <p>${message}</p>
        <p>Log in to your dashboard to view more details.</p>
      `;
      // Async fire and forget
      sendEmail(userEmail, subject, htmlContent).catch(err => console.error('Email failed in notification service', err));
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
};
