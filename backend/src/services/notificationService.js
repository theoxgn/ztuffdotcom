const nodemailer = require('nodemailer');

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email notification
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email text content (optional)
 * @returns {Promise<object>} Email result
 */
const sendEmail = async (options) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email configuration not found, skipping email notification');
      return { success: false, error: 'Email not configured' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};


/**
 * Send push notification (placeholder for future implementation)
 * @param {object} options - Push notification options
 * @param {string} options.userId - User ID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {object} options.data - Additional data
 * @returns {Promise<object>} Push notification result
 */
const sendPushNotification = async (options) => {
  try {
    // Placeholder for push notification implementation
    // You can integrate with Firebase Cloud Messaging, OneSignal, etc.
    console.log('Push notification would be sent:', options);
    
    return { success: true, message: 'Push notification not implemented yet' };

  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification via multiple channels
 * @param {object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.email - User email
 * @param {string} options.subject - Email subject
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.html - Email HTML content
 * @param {array} options.channels - Channels to send ['email', 'push']
 * @returns {Promise<object>} Notification results
 */
const sendMultiChannelNotification = async (options) => {
  const results = {};
  const channels = options.channels || ['email'];

  try {
    // Send email notification
    if (channels.includes('email') && options.email) {
      results.email = await sendEmail({
        to: options.email,
        subject: options.subject || options.title,
        html: options.html || `<p>${options.message}</p>`,
        text: options.message
      });
    }

    // Send push notification
    if (channels.includes('push') && options.userId) {
      results.push = await sendPushNotification({
        userId: options.userId,
        title: options.title,
        message: options.message,
        data: options.data
      });
    }

    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('Error in multi-channel notification:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  }
};

module.exports = {
  sendEmail,
  sendPushNotification,
  sendMultiChannelNotification
};