/* A simple singleton cache class that decouples state in react functions
from the message handlers that need to operate on the underlying quill objects
 */


class QuillEditorRegistry {

  constructor () {
    this.cache = {};
  }

  setEditor(id, editor, config){
    this.cache[id] = {editor, config};
  }

  getEditor(id){
    return this.cache[id] ?? {};
  }

  remove(id){
    delete this.cache[id];
  }
}

const singleton = new QuillEditorRegistry();
export default singleton;