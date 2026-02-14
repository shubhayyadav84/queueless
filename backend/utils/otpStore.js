const otpStore = new Map();

export const generateOTP = (phone) => {
  const otp = process.env.DEMO_MODE === 'true' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  
  otpStore.set(phone, {
    otp,
    expiresAt,
    attempts: 0
  });
  
  console.log(`OTP for ${phone}: ${otp}`);
  return otp;
};

export const verifyOTP = (phone, otp) => {
  const record = otpStore.get(phone);
  
  if (!record) {
    return { valid: false, message: 'OTP not found. Please request a new one.' };
  }
  
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, message: 'OTP expired. Please request a new one.' };
  }
  
  if (record.attempts >= 3) {
    otpStore.delete(phone);
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }
  
  record.attempts++;
  
  if (record.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  otpStore.delete(phone);
  return { valid: true };
};

export const clearOTP = (phone) => {
  otpStore.delete(phone);
};
