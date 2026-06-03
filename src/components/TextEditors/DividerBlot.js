import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

// Teaches Quill to recognize <hr> tags (e.g. from the backend's markdown -> Quill
// HTML conversion). Without a registered blot Quill's clipboard drops the tag and
// the literal "<hr/>" leaks into the rendered text. Quill 2.0 has no built-in
// horizontal rule, so this minimal BlockEmbed is what makes one actually render.
class DividerBlot extends BlockEmbed {
}
DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'hr';

export default DividerBlot;
