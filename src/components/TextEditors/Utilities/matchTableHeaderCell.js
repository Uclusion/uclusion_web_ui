import Delta from 'quill-delta';

// B-all-667: Quill's table registers only <td> as a cell, so the <th> cells of a
// stored Markdown table, or of a table pasted from a web page, never ended their
// line and the whole header row collapsed into one cell. Ending each header cell's
// line the way a <td> does lets Quill's row matcher make it a cell of that row.
export default function matchTableHeaderCell(node, delta) {
  if (!node.closest('table')) {
    return delta;
  }
  const last = delta.ops[delta.ops.length - 1];
  if (typeof last?.insert === 'string' && last.insert.endsWith('\n')) {
    return delta;
  }
  return delta.concat(new Delta().insert('\n'));
}
