import Quill from 'quill';
import Delta from 'quill-delta';

const { Attributor, Scope } = Quill.import('parchment');
const Keyboard = Quill.import('modules/keyboard');

function validStart(value) {
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value));
}

class ListStartAttributor extends Attributor {
  canAdd(node, value) {
    return validStart(value);
  }

  add(node, value) {
    if (!super.add(node, value)) return false;
    node.setAttribute(this.keyName, String(Number(value)));
    // The attribute survives storage; the counter style is regenerated on import.
    node.style.setProperty('--ql-list-start', Number(value));
    return true;
  }

  remove(node) {
    super.remove(node);
    node.style.removeProperty('--ql-list-start');
  }
}

export const listStart = new ListStartAttributor('list-start', 'data-list-start', { scope: Scope.BLOCK });

export class ListStartKeyboard extends Keyboard {
  handleEnter(range, context) {
    super.handleEnter(range, context);
    // A start belongs to the first item, whereas native Enter inherits every
    // block format onto both halves of the split line.
    if (context.format['list-start'] != null) {
      this.quill.formatLine(range.index + 1, 1, 'list-start', false, Quill.sources.USER);
    }
  }
}

// Quill merges adjacent OL containers and ignores their native start attribute.
// Put the start on the first line, where it survives that merge and later edits.
export function matchListStart(node, delta) {
  const start = node.getAttribute('start');
  const previousList = /^(OL|UL)$/.test(node.previousElementSibling?.tagName);
  if (!validStart(start) && !previousList) return delta;
  let index = 0;
  for (const op of delta.ops) {
    const newline = typeof op.insert === 'string' ? op.insert.indexOf('\n') : -1;
    if (newline >= 0) {
      if (op.attributes?.list !== 'ordered' || op.attributes['list-start'] != null) return delta;
      return delta.compose(new Delta().retain(index + newline).retain(1, {
        'list-start': validStart(start) ? String(Number(start)) : '1',
      }));
    }
    index += typeof op.insert === 'string' ? op.insert.length : 1;
  }
  return delta;
}
