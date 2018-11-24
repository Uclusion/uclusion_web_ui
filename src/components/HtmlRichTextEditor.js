/**
 Html RTF editor based on slate, that's we can ue wherever we need full text editing
 **/

import RichTextEditor from './TextEditors/SlateEditors/RichTextEditor'
import React from 'react'

class HtmlRichTextEditor extends React.Component {

  // Render the editor.
  render () {
    const { initialText } = this.props;
    return <RichTextEditor initialText={initialText}/>
  }
}

export default HtmlRichTextEditor
