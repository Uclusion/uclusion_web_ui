// B-all-717: the report stores the Window sentence as prose. Format its two
// endpoints for the viewer and leave every other character, including "through".
const WINDOW_INSTANT = '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})';
const WINDOW_GAP = '((?:\\s|&nbsp;|<[^>]*>)*)';

function windowClausePattern() {
  return new RegExp(
    `(Window:)${WINDOW_GAP}(${WINDOW_INSTANT})${WINDOW_GAP}(through)${WINDOW_GAP}(${WINDOW_INSTANT})`,
    'g'
  );
}

function escapeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatWindowInstant(formatDate, instant) {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    const formatted = formatDate(date);
    if (typeof formatted !== 'string' || formatted === '' || formatted === 'Invalid Date') {
      return null;
    }
    return escapeText(formatted);
  } catch {
    return null;
  }
}

export function formatBacklogWindowClause(text, formatDate) {
  if (typeof text !== 'string' || typeof formatDate !== 'function') {
    return text;
  }
  return text.replace(windowClausePattern(), (
    match, label, beforeStart, start, beforeThrough, through, beforeEnd, end
  ) => {
    const startText = formatWindowInstant(formatDate, start);
    const endText = formatWindowInstant(formatDate, end);
    if (startText == null || endText == null) {
      return match;
    }
    return `${label}${beforeStart}${startText}${beforeThrough}${through}${beforeEnd}${endText}`;
  });
}
