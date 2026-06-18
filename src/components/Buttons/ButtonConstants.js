import { useContext } from 'react';
import { ThemeModeContext } from '../../contexts/ThemeModeContext';

// Light mode colors (default)
export const ACTION_BUTTON_COLOR = "#8f8f8f";
export const WARNING_COLOR = '#E85757';
export const INFO_COLOR = '#A9D4D9';
export const COUNT_COLOR = '#F29100';
export const LIGHT_BLUE_COLOR = '#B8E2E5';
export const LIGHTER_BLUE_COLOR = '#EDF7F8';
// Left sidebar panel (deeper than the main area so the sidebar reads as a
// distinct section) and the selected-item pill / card border (T-all-2173).
// Kept as named constants so the section colors are easy to tune.
export const SIDEBAR_COLOR = '#8FC5CC';
export const SIDEBAR_SELECTED_COLOR = '#FFFFFF';
export const CARD_BORDER_COLOR = '#8CBEC4';

// Dark mode colors
export const DARK_ACTION_BUTTON_COLOR = "#b0b0b0";
const DARK_WARNING_COLOR = '#FF6B6B';
export const DARK_INFO_COLOR = '#2a3a3c';
export const DARK_COUNT_COLOR = '#FFB347';
const DARK_LIGHT_BLUE_COLOR = '#1e2e30';
export const DARK_LIGHTER_BLUE_COLOR = '#1a2628';
export const DARK_TEXT_BACKGROUND_COLOR = '#C7CBCA';
export const DARK_SIDEBAR_COLOR = '#1F2B2D';
export const DARK_SIDEBAR_SELECTED_COLOR = '#3C4F52';
export const DARK_CARD_BORDER_COLOR = 'rgba(255, 255, 255, 0.18)';

/**
 * Hook that returns theme-aware button colors
 * Use this in components that need colors to adapt to dark mode
 */
export function useButtonColors() {
  const [themeMode] = useContext(ThemeModeContext);
  const isDark = themeMode === 'dark';

  return {
    actionButtonColor: isDark ? DARK_ACTION_BUTTON_COLOR : ACTION_BUTTON_COLOR,
    warningColor: isDark ? DARK_WARNING_COLOR : WARNING_COLOR,
    infoColor: isDark ? DARK_INFO_COLOR : INFO_COLOR,
    countColor: isDark ? DARK_COUNT_COLOR : COUNT_COLOR,
    lightBlueColor: isDark ? DARK_LIGHT_BLUE_COLOR : LIGHT_BLUE_COLOR,
    lighterBlueColor: isDark ? DARK_LIGHTER_BLUE_COLOR : LIGHTER_BLUE_COLOR,
    sidebarColor: isDark ? DARK_SIDEBAR_COLOR : SIDEBAR_COLOR,
    sidebarSelectedColor: isDark ? DARK_SIDEBAR_SELECTED_COLOR : SIDEBAR_SELECTED_COLOR,
  };
}
