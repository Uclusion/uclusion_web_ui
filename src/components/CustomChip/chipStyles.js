/**
 * Shared outlined-chip styling (C-all-984 / Q-all-131 option O-2).
 *
 * The count / status chips across the app (tab badges, swimlane status,
 * sidebar counts, bug / backlog list chips) were flat saturated solid pills.
 * This gives them a single consistent outlined look: white/transparent fill,
 * a colored border, and colored text - keeping each chip's color meaning while
 * reading lighter and more intentional. Theme-aware (colors lighten in dark).
 *
 * variant: 'red' | 'orange' | 'teal' | 'yellow' | 'blue'
 * isDark: boolean
 */
const CHIP_COLORS = {
  red:    { text: '#C8362F', textDark: '#FF8A8A', border: '#E85757', borderDark: '#FF8A8A' },
  orange: { text: '#B96F00', textDark: '#FFB347', border: '#F29100', borderDark: '#FFB347' },
  teal:   { text: '#347079', textDark: '#9FCCD3', border: '#7FB6BD', borderDark: '#6d99a0' },
  yellow: { text: '#7E7E00', textDark: '#D4D44D', border: '#C2C24A', borderDark: '#D4D44D' },
  blue:   { text: '#2F80ED', textDark: '#5BA3F5', border: '#2F80ED', borderDark: '#5BA3F5' },
};

export function outlinedChipStyle(variant, isDark) {
  const c = CHIP_COLORS[variant] || CHIP_COLORS.teal;
  return {
    backgroundColor: isDark ? 'transparent' : '#ffffff',
    border: `1.5px solid ${isDark ? c.borderDark : c.border}`,
    color: isDark ? c.textDark : c.text,
    fontWeight: 600,
  };
}

// Map a raw chip fill color (as used inline across the app) to a variant, so
// existing call sites can adopt the shared outlined style without restructuring.
export function variantForColor(color) {
  const c = (color || '').toUpperCase();
  if (c.includes('E85757') || c.includes('FF6B6B')) return 'red';
  if (c.includes('F29100') || c.includes('FFB347')) return 'orange';
  if (c.includes('E6E969') || c.includes('CCCC') || c.includes('D4D44D')) return 'yellow';
  if (c.includes('2F80ED') || c.includes('5BA3F5') || c.includes('2D9CDB')) return 'blue';
  return 'teal';
}
