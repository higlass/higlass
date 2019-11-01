/**
 * Non-negative modulo function. E.g., `mod(-1, 5) === 4` while `-1 % 5 === -1`.
 *
 * @param  {Integer}  n  Dividend
 * @param  {Integer}  m  Divisor
 * @return  {Integer}  Remainder
 */
const mod = (n, m) => ((n % m) + m) % m;

export default mod;
