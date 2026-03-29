/**
 * Generates a random alphanumeric password
 * @param {number} length - Desired length (default 8)
 * @returns {string} Random password
 */
const generateRandomPassword = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  // Ensure at least one random character from each category (lower, upper, number, special)
  // For simplicity, just completely random characters for now
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = {
  generateRandomPassword,
};
