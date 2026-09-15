import Delta from 'quill-delta';

export default function matchTextPreservingSpaces(node) {
  const parent = node.parentElement;
  // A source continuation newline must not create another numbered/bulleted line.
  // Keep spaces and preformatted code intact instead of using Quill's collapsed text.
  const isListProse = parent?.closest('li') && !parent.closest('pre, .ql-code-block');
  const text = isListProse ? node.data.replace(/\r\n?|\n/g, ' ') : node.data;
  return new Delta().insert(text);
}
