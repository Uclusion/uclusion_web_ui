/**
 Html RTF editor based on slate, that's we can ue wherever we need full text editing
It accepts an onChange property, which will return the string HTML value of the current state of the editor,
 the initialText property which will be the text string renedered if no existing state is available,
 and an ObjectId which will be used to search for state that hasn't been flushed (eg. we reloaded) without saving
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
    const {initialHtml, onChange, readOnly} = props
    this.onChange = this.onChange.bind(this)
    this.html = new Html({rules})
    this.loadEditor = this.loadEditor.bind(this)
    const loadedEditor = this.loadEditor();
    let value = this.html.deserialize(initialHtml)
    if(loadedEditor){
      value = loadedEditor;
      //fire upstream onchange to alert the upper level code we changed loaded state
      console.log(readOnly)
      if(!readOnly && onChange){
        const string = this.html.serialize(value)
        onChange({target: {value: string}})
      }
    }
    this.state = {value}
    this.saveEditor = this.saveEditor.bind(this)
    this.removeEditor = this.removeEditor.bind(this)
  }

  loadEditor () {
    const {objectId} = this.props
    const activeEditors = getUclusionLocalStorageItem('htmlEditors')
    if (objectId && activeEditors && activeEditors[objectId]) {
      const storedValue = this.html.deserialize(activeEditors[objectId])
      return storedValue
    }
  }

  saveEditor (string) {
    const {objectId} = this.props
    const activeEditors = getUclusionLocalStorageItem('htmlEditors')
    const newActiveEditors = Object.assign({}, activeEditors)

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
    const { readOnly } = this.props
    if(!readOnly) {
      // When the document changes, save the serialized HTML to Local Storage.
      if (value.document != this.state.value.document) {
        const string = this.html.serialize(value)
        this.saveEditor(string)
        //call the parent onChange with the string value
        const {onChange, readOnly} = this.props
        //emulate the other field's onchange
        if (!readOnly && onChange) {
          onChange({target: {value: string}})
        }
      }
      this.setState({value})
    }
  }

  // Render the editor.
  render () {
    const {readOnly} = this.props
    const editor = <RichTextEditor value={this.state.value} onChange={this.onChange} readOnly={readOnly}/>
    return editor;
  }
}

export default HtmlRichTextEditor
