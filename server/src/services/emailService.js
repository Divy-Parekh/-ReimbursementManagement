const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Reimbursement System'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    return false;
  }
};

const sendPasswordEmail = async (to, name, password, companyName) => {
  const subject = `Welcome to ${companyName} - Your Login Details`;
  const html = `
    <h2>Welcome to ${companyName}!</h2>
    <p>Hi ${name},</p>
    <p>Your account has been created successfully. Here are your login details:</p>
    <p><b>Email:</b> ${to}</p>
    <p><b>Temporary Password:</b> ${password}</p>
    <p>Please log in and change your password immediately.</p>
  `;
  return sendEmail(to, subject, html);
};

const sendForgotPasswordEmail = async (to, newPassword) => {
  const subject = `Password Reset Request`;
  const html = `
    <h2>Password Reset</h2>
    <p>Your password has been reset. Your new temporary password is:</p>
    <p><b>${newPassword}</b></p>
    <p>Please log in and change your password immediately.</p>
  `;
  return sendEmail(to, subject, html);
};

const sendApprovalRequestEmail = async (to, approverName, expense) => {
  const subject = `Action Required: New Expense Approval Request`;
  const html = `
    <h2>Expense Approval Request</h2>
    <p>Hi ${approverName},</p>
    <p>A new expense requires your approval.</p>
    <p><b>Employee:</b> ${expense.user.name}</p>
    <p><b>Amount:</b> ${expense.amount} ${expense.currency}</p>
    <p><b>Description:</b> ${expense.description}</p>
    <p>Please log in to the dashboard to approve or reject this request.</p>
  `;
  return sendEmail(to, subject, html);
};

const sendApprovalNotificationEmail = async (to, expense, action, approverName) => {
  const subject = `Expense ${action}: ${expense.description}`;
  const html = `
    <h2>Expense Status Update</h2>
    <p>Your expense request has been <b>${action}</b> by ${approverName}.</p>
    <p><b>Expense:</b> ${expense.description}</p>
    <p><b>Amount:</b> ${expense.amount} ${expense.currency}</p>
    <p>Log in to your dashboard to view the details.</p>
  `;
  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordEmail,
  sendForgotPasswordEmail,
  sendApprovalRequestEmail,
  sendApprovalNotificationEmail,
};
