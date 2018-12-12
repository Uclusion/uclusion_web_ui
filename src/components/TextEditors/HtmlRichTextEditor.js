/**
 Html RTF editor based on slate, that's we can ue wherever we need full text editing
It accepts an onChange property, which will return the string HTML value of the current state of the editor,
 the initialText property which will be the text string renedered if no existing state is available,
 and an ObjectId which will be used to search for state that hasn't been flushed (eg. we reloaded) without saving
 It's onchange handler emulates the material ui input type onChange emission
 **/

import RichTextEditor from './SlateEditors/RichTextEditor'

import React from 'react'
import Html from 'slate-html-serializer'
import { rules } from './SlateEditors/html_rules'
import PropTypes from 'prop-types'


class HtmlRichTextEditor extends React.Component {

  constructor (props) {
    super(props)
    const {value} = props
    this.onChange = this.onChange.bind(this)
    this.html = new Html({rules})
    const internalValue = this.html.deserialize(value)
    this.state = {value: internalValue}
  }

  onChange ({value}) {
    const { readOnly, onChange } = this.props
    if(!readOnly) {
      // When the document changes, save the serialized HTML to Local Storage.
      if (value.document !== this.state.value.document) {
        const string = this.html.serialize(value)
        //call the parent onChange with the string html value
        //emulate material ui field's onchange symantics
        if (onChange) {
          const changeUpdate = {target: {value: string}}
          console.log(changeUpdate)
          onChange(changeUpdate)
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


HtmlRichTextEditor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func
}

export default HtmlRichTextEditor
