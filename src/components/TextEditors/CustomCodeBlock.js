import Quill from 'quill';
var CodeBlock = Quill.import('formats/code-block');

class CustomCodeBlock extends CodeBlock {

}
CustomCodeBlock.tagName = "pre";

export default CustomCodeBlock;