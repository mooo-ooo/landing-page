/**
 * Known SI prefixes, multiples of 3
 */
const PREFIXES: Record<string, string> = {
  '24': 'Y',
  '21': 'Z',
  '18': 'E',
  '15': 'P',
  '12': 'T',
  '9': 'B',
  '6': 'M',
  '3': 'k',
  '0': '',
  '-3': 'm',
  '-6': 'µ',
  '-9': 'n',
  '-12': 'p',
  '-15': 'f',
  '-18': 'a',
  '-21': 'z',
  '-24': 'y'
};

/**
 * Calculates the base-10 exponent of a number
 */
function getExponent(n: number): number {
  if (n === 0) {
    return 0;
  }
  return Math.floor(Math.log10(Math.abs(n)));
}

/**
 * Returns a number formatted to a precision of 3
 */
function precise(n: number): number {
  return Number.parseFloat(n.toPrecision(3));
}

/**
 * Converts a number or string representation of a number 
 * to a human-readable string with SI prefixes.
 */
export function toHumanString(sn: string | number): string {
  if(!sn) {
    return '0'
  }
  const inputNum = typeof sn === 'string' ? Number.parseFloat(sn) : sn;
  const n = precise(inputNum);
  
  // Calculate exponent clamped between -24 and 24, aligned to multiples of 3
  const e = Math.max(Math.min(3 * Math.floor(getExponent(n) / 3), 24), -24);
  
  const scaledValue = precise(n / Math.pow(10, e));
  const prefix = PREFIXES[e.toString()] || '';
  
  return scaledValue.toString() + prefix;
}

// Optional: Default export for backward compatibility or simpler imports
export default {
  toHumanString
};