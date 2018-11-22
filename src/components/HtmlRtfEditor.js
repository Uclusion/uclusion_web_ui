/**
 Html RTF editor based on slate, that's we can ue wherever we need full text editing
 **/

import { Editor } from 'slate-react'
import { Value } from 'slate'
import { React } from 'react'

const initialValue = (defaultText) => {
  return Value.fromJSON({
    document: {
      nodes: [
        {
          object: 'block',
          type: 'paragraph',
          nodes: [
            {
              object: 'text',
              leaves: [
                {
                  text: defaultText
                }
              ]
            }
          ]
        }
      ]
    }
  })
}

class HtmlRtfEditor extends React.Component {
  constructor (props) {
    super(props)
    const { initialText } = props
    this.state = {value: initialValue(initialText)}
  }

  // On change, update the app's React state with the new editor value.
  onChange ({value}) {
    this.setState({value})
  }

  // Render the editor.
  render () {
    return <Editor value={this.state.value} onChange={this.onChange}/>
  }
}

export default HtmlRtfEditor
