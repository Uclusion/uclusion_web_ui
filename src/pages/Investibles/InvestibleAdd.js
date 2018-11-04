import React from 'react'
import PropTypes from 'prop-types'
import Editor, { Editable, createEmptyState } from 'ory-editor-core'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketInvestible } from '../../containers/MarketInvestibles/actions'
import GlobalState from 'uclusion-shell/lib/utils/GlobalState'
const styles = theme => ({

  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.uni  ,
  }

})

class InvestibleAdd extends React.Component {

  constructor (props) {
    super(props)
    this.initEditor = this.initEditor.bind(this);
    this.getEditor = this.getEditor.bind(this);
  }
  
  initEditor = () => {
    const editable = createEmptyState()
    editable.id = 'InvestibleAdd'
    const editor = new Editor({
      editables: [editable]
    })
    return editor
  }

  getEditor = () => {
    let editor = GlobalState.oryEditor;
    if (!editor) {
      editor = this.initEditor()
      GlobalState.oryEditor = editor;
    }
    return editor;
  }



  render () {
    const editor = this.getEditor();
    return(
      <Editable editor={editor} id={'InvestibleAdd'}/>
    )
  }
}




function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketInvestible }, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, {withTheme: true})(InvestibleAdd)))
