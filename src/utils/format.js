// src/utils/format.js
export function formatNumber(num, decimals = 2) {
  if (num === undefined || num === null) return '0';
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  if (Math.abs(num) < 0.001 && num !== 0) {
    return num.toExponential(decimals > 0 ? decimals - 1 : 2);
  }
  return num.toFixed(decimals);
}
