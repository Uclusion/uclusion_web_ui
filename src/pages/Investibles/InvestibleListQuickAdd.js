import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Paper, Button, TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketInvestible } from '../../containers/MarketInvestibles/actions'

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
    this.state = {}
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
  }

  handleChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }

  addOnClick = () => {
    const { dispatch, marketId, category } = this.props;
    const payload = {marketId, category, title: this.state.title, description: this.state.description };
    dispatch(createMarketInvestible(payload));
  };


  render () {
    const { classes, user, marketId, category, visible, intl, addCancelOnClick } = this.props;
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
        <TextField
          variant="outlined"
          id="description"
          label={intl.formatMessage({id: 'descriptionLabel'})}
          multiline
          rows="4"
          defaultValue=""
          className={classes.textField}
          fullWidth
          margin="normal"
          onChange={this.handleChange('description')}
        />
        <Button variant='contained' color='primary'
                onClick={() => this.addOnClick()}>{intl.formatMessage({id: 'addButton'})}</Button>
        <Button variant='contained'
                onClick={() => addCancelOnClick() }>{intl.formatMessage({id: 'cancelButton'})}</Button>
        </form>
      </Paper>
    )
  };
}


InvestibleListQuickAdd.propTypes = {
  category: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  cancelOnClick: PropTypes.func.isRequired
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketInvestible }, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, {withTheme: true})(InvestibleListQuickAdd)))
