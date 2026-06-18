import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@material-ui/core';

// A compact tinted icon badge: an icon inside a rounded-square with a colored
// border and a soft tint of that same color, plus an optional red "unread" dot
// (C-all-988 assistance section / C-all-990 swimlane clock). One implementation
// so every place that uses it stays visually in lockstep. `palette` carries the
// per-theme colors: { base, icon, baseDark?, iconDark? } (hex strings).
//   - unread: draw the red dot (an unread inbox message exists)
//   - dim:    fade the badge (used where "read" means lower priority)
// forwardRef so a MUI Tooltip can attach to the badge root.
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TintedIconBadge = React.forwardRef(function TintedIconBadge(props, ref) {
  const { icon: Icon, palette, unread = false, dim = false, size = 26, iconSize = 17, style, ...other } = props;
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  if (!Icon || !palette) {
    return null;
  }
  const border = isDark ? (palette.baseDark || palette.base) : palette.base;
  const iconColor = isDark ? (palette.iconDark || palette.icon) : palette.icon;
  const tint = hexToRgba(palette.base, isDark ? 0.22 : 0.13);
  const dotBorder = theme.palette.background.paper || (isDark ? '#2b2f36' : '#fff');
  return (
    <span ref={ref} {...other} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', width: size, height: size, borderRadius: 7, boxSizing: 'border-box',
      border: `1.5px solid ${border}`, backgroundColor: tint, opacity: dim ? 0.72 : 1, ...style }}>
      <Icon style={{ fontSize: iconSize, color: iconColor }} />
      {unread && (
        <span style={{ position: 'absolute', top: -2, right: -3, width: 8, height: 8, borderRadius: '50%',
          backgroundColor: '#E53935', border: `1.5px solid ${dotBorder}`, boxSizing: 'border-box' }} />
      )}
    </span>
  );
});

TintedIconBadge.propTypes = {
  icon: PropTypes.elementType,
  palette: PropTypes.shape({
    base: PropTypes.string,
    icon: PropTypes.string,
    baseDark: PropTypes.string,
    iconDark: PropTypes.string,
  }),
  unread: PropTypes.bool,
  dim: PropTypes.bool,
  size: PropTypes.number,
  iconSize: PropTypes.number,
  style: PropTypes.object,
};

export default TintedIconBadge;
