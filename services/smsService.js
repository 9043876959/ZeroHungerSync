const twilio = require('twilio');

const TWILIO_SID   = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_FROM  = process.env.TWILIO_FROM;

/**
 * Send SMS via Twilio
 * @param {string|string[]} numbers - phone number(s), 10 digits or with +91
 * @param {string} message - SMS text
 */
async function sendSMS(numbers, message) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.warn('⚠️  Twilio credentials not set in .env — SMS skipped');
    return { skipped: true };
  }

  const client = twilio(TWILIO_SID, TWILIO_TOKEN);

  // Normalise numbers to +91XXXXXXXXXX format
  const normalised = (Array.isArray(numbers) ? numbers : [numbers])
    .map(n => {
      const digits = String(n).replace(/\D/g, '').slice(-10);
      return digits.length === 10 ? `+91${digits}` : null;
    })
    .filter(Boolean);

  if (normalised.length === 0) {
    console.warn('⚠️  No valid numbers to SMS');
    return { skipped: true };
  }

  console.log(`📱 Sending SMS to: ${normalised.join(', ')}`);

  // Send to each number (Twilio sends one at a time)
  const results = await Promise.allSettled(
    normalised.map(to =>
      client.messages.create({
        body: message,
        from: TWILIO_FROM,
        to
      })
    )
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`✅ SMS sent to ${normalised[i]} — SID: ${r.value.sid}`);
    } else {
      console.error(`❌ SMS failed to ${normalised[i]}:`, r.reason?.message);
    }
  });

  return results;
}

module.exports = { sendSMS };