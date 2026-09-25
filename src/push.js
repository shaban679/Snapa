const { Expo } = require('expo-server-sdk');
const expo = new Expo();

// Tuma push notification kwa mtumiaji mmoja. Haizuii request kuu ikishindikana.
async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;
  try {
    await expo.sendPushNotificationsAsync([{ to: pushToken, sound: 'default', title, body, data }]);
  } catch (err) {
    console.error('Push notification imeshindikana:', err.message);
  }
}

module.exports = { sendPushNotification };
