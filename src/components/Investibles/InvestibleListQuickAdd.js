import React from 'react'
import PropTypes from 'prop-types'
//import classnames from 'classnames'
import { Paper, Button, TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketInvestible } from '../../store/MarketInvestibles/actions'
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor'

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

class InvestibleListQuickAdd extends React.Component {

  constructor (props) {
    super(props)
    const { intl } = props
    this.state = {description: intl.formatMessage({id: 'descriptionLabel'})}
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
  }

  handleChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }

  addOnClick = (addSubmitOnClick) => {
    const { dispatch, marketId, teamId, category } = this.props;
    const payload = {marketId, category, teamId, title: this.state.title, description: this.state.description};
    dispatch(createMarketInvestible(payload));
    addSubmitOnClick();
  };


  render () {
    const { classes, visible, intl, addSubmitOnClick, addCancelOnClick } = this.props;
    if(!visible){
      return null;
    }
    return (
      <Paper className={'container'}>
        <form  noValidate autoComplete="off">
        <TextField
          id="title"
          label={intl.formatMessage({id: 'titleLabel'})}
          defaultValue=""
          className={classes.textField}
          variant="filled"
          margin="normal"
          fullWidth
          onChange={this.handleChange('title')}
        />
        <HtmlRichTextEditor value={this.state.description} onChange={this.handleChange('description')}/>

        <Button variant='contained' color='primary'
                onClick={() => this.addOnClick(addSubmitOnClick)}>{intl.formatMessage({id: 'addButton'})}</Button>
        <Button variant='contained'
                onClick={() => addCancelOnClick() }>{intl.formatMessage({id: 'cancelButton'})}</Button>
        </form>
      </Paper>
    )
  };
}


InvestibleListQuickAdd.propTypes = {
  category: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  addCancelOnClick: PropTypes.func.isRequired,
  addSubmitOnClick: PropTypes.func.isRequired
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketInvestible }, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, {withTheme: true})(InvestibleListQuickAdd)))
