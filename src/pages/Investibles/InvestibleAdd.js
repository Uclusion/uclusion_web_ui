import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketInvestible } from '../../containers/MarketInvestibles/actions'
import GlobalState from 'uclusion-shell/lib/utils/GlobalState'

import Editor, { Editable, createEmptyState } from 'ory-editor-core'
import { Trash, DisplayModeToggle, Toolbar } from 'ory-editor-ui'
import 'ory-editor-ui/lib/index.css'
import { Button, TextField } from '@material-ui/core'
// Load some exemplary plugins:
import slate from 'ory-editor-plugins-slate' // The rich text area plugin
import 'ory-editor-plugins-slate/lib/index.css' // Stylesheets for the rich text area plugin
import editorBorder from '../../components/OryPlugins/EditorBorderPlugin'

const styles = theme => ({

  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  editor: {
    border: '1px solid'
  }

})

class InvestibleAdd extends React.Component {

  constructor (props) {
    super(props)
    this.initEditor = this.initEditor.bind(this)
    this.getEditor = this.getEditor.bind(this)
  }

  initEditor = () => {
    const editable = createEmptyState()
    editable.id = 'InvestibleAdd'
    const editor = new Editor({
      editables: [editable],
      plugins: {
        content: [slate()],
        layout: [editorBorder({defaultPlugin: slate()})],
      },
      defaultPlugin: slate(),

    })
    editor.trigger.mode.edit()
    return editor
  }

  getEditor = () => {
    let editor = GlobalState.oryEditor
    if (!editor) {
      editor = this.initEditor()
      GlobalState.oryEditor = editor
    }

    return editor
  }

  render () {
    const {intl, classes} = this.props
    const editor = this.getEditor()
    return (
      <div>
        <TextField id="title" className={classes.textField} label={intl.formatMessage({id: 'titleLabel'})}
                   variant="outlined" fullWidth/>
        <div>
          <Editable editor={editor} id='InvestibleAdd'>
            <Toolbar editor={editor}/>
          </Editable>
        </div>
        <Button variant="contained" color='primary' id="save">Save Investible</Button>
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({dispatch}, bindActionCreators({createMarketInvestible}, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, {withTheme: true})(InvestibleAdd)))
