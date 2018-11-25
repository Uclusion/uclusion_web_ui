/**
 Html RTF editor based on slate, that's we can ue wherever we need full text editing
 **/

import RichTextEditor from './TextEditors/SlateEditors/RichTextEditor'
import { defaultValue } from './TextEditors/SlateEditors/RichTextEditor'
import React from 'react'
import Html from 'slate-html-serializer'
import { rules } from './TextEditors/SlateEditors/html_rules'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from './utils'

class HtmlRichTextEditor extends React.Component {

  constructor (props) {
    super(props)
    const {initialText} = props
    this.onChange = this.onChange.bind(this)
    this.html = new Html({rules})
    this.loadEditor = this.loadEditor.bind(this)
    const loadedEditor = this.loadEditor();
    let value = defaultValue(initialText)
    if(loadedEditor){
      value = loadedEditor;
    }
    this.state = {value}
    this.saveEditor = this.saveEditor.bind(this)
    this.removeEditor = this.removeEditor.bind(this)
  }

  loadEditor () {
    const {objectId} = this.props
    const activeEditors = getUclusionLocalStorageItem('htmlEditors')
    console.log(objectId)
    if (objectId && activeEditors[objectId]) {
      console.log("Loading state from storage")
      const storedValue = this.html.deserialize(activeEditors[objectId])
      return storedValue
    }
  }

  saveEditor (value) {
    const {objectId} = this.props
    const activeEditors = getUclusionLocalStorageItem('htmlEditors')
    const newActiveEditors = Object.assign({}, activeEditors)
    const string = this.html.serialize(value)
    newActiveEditors[objectId] = string
    setUclusionLocalStorageItem('htmlEditors', newActiveEditors)
  }

  removeEditor () {
    const {objectId} = this.props
    const activeEditors = getUclusionLocalStorageItem('htmlEditors')
    const newActiveEditors = Object.assign({}, activeEditors)
    delete newActiveEditors[objectId]
    setUclusionLocalStorageItem('htmlEditors', newActiveEditors)
  }

  getStoredStateIfAvailable () {
    const storedValue = this.loadEditor()
    if (storedValue) {
      this.setState({value: storedValue})
    }
  }

  onChange ({value}) {
    // When the document changes, save the serialized HTML to Local Storage.
    if (value.document != this.state.value.document) {
      this.saveEditor(value)
    }
    this.setState({value})
  }

  // Render the editor.
  render () {

    const editor = <RichTextEditor value={this.state.value} onChange={this.onChange}/>
    return editor;
  }
}

export default HtmlRichTextEditor
