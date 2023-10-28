/**
 * Non-negative modulo function. E.g., `mod(-1, 5) === 4` while `-1 % 5 === -1`.
 *
 * @param {number} n - Dividend (integer)
 * @param {number} m - Divisor (integer)
 * @return {number} Remainder (integer)
 */
const mod = (n, m) => ((n % m) + m) % m;

export default mod;
