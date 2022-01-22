import _ from 'lodash';
import { editorEmpty } from '../QuillEditor2';
  import QuillEditorRegistry from '../QuillEditorRegistry';
import { setUclusionLocalStorageItem } from '../../localStorageUtils';

function isWhitespace (ch) {
  return (ch === ' ') || (ch === '\t') || (ch === '\n')
}

export function generateOnChangeHandler(editorId){
  const editor = QuillEditorRegistry.getEditor(editorId);
  if(!editor) {
    return () => {};
  }
  return _.debounce((delta) => {
    // URL stuff from https://github.com/quilljs/quill/issues/109
    const regex = /https?:\/\/[^\s]+$/
    if (delta.ops.length === 2 && delta.ops[0].retain && isWhitespace(delta.ops[1].insert)) {
      const endRetain = delta.ops[0].retain;
      const text = editor.getText().substr(0, endRetain);
      const match = text.match(regex);

      if (match !== null) {
        const url = match[0];

        const ops = [];
        if(endRetain > url.length) {
          ops.push({ retain: endRetain - url.length });
        }

        const retOps = ops.concat([
          { delete: url.length },
          { insert: url, attributes: { link: url } }
        ]);

        editor.updateContents({
          ops: retOps
        });
      }
    }
    const contents = editor.root.innerHTML;
    if (editorEmpty(contents)) {
      storeState(editorId, '');
    } else {
      storeState(editorId, contents);
    }
  }, 50);

}


const OUR_CLOUDFRONT_FILE_PATTERN = /https:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
const OUR_CND_DOMAIN_ENDING = 'imagecdn.uclusion.com';


export function storeState (id, state) {
  if (_.isEmpty(state)) {
    setUclusionLocalStorageItem(`editor-${id}`, state);
  } else {
    //Remove tokens here that were added in ImageBlot Quill format
    const regexp = /img src\s*=\s*"(.+?)"/g;
    const newStr = state.replace(regexp, (match, p1) => {
      const cloudfrontMatch = p1.match(OUR_CLOUDFRONT_FILE_PATTERN);
      const cdnMatch = p1.includes(OUR_CND_DOMAIN_ENDING);
      if (!cloudfrontMatch && !cdnMatch) {
        return `img src="${p1}"`;
      }
      const url = new URL(p1);
      const params = new URLSearchParams(url.search);
      params.delete('authorization');
      url.search = params.toString();
      return `img src="${url.toString()}"`;
    });
    setUclusionLocalStorageItem(`editor-${id}`, newStr);
  }
}

export function getBoundsId(id){
  return `editorBox-${id}`;
}

export function focusEditor (id) {
  const boundsId = getBoundsId(id);
  const container = document.getElementById(boundsId);
  if (!_.isEmpty(container?.children)) {
    container.children[0].click()
  }
  const editor = QuillEditorRegistry.getEditor(id);
  editor?.focus()
}

export function replaceEditorContents(contents, id) {
  const editor = QuillEditorRegistry.getEditor(id);
  if(!editor){
    return;
  }
  editor.setContents({insert: contents});
  storeState(id, contents);
}

