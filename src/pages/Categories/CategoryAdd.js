import React from 'react'
import PropTypes from 'prop-types'
import { Paper, Button, TextField } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketCategory } from '../../store/Markets/actions'

const styles = theme => ({

  container: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: theme.spacing.unit,
  },
  textField: {
    margin: 0,
    marginBottom: theme.spacing.unit,
  },
  textInput: {
    height: 40,
  },
  actionContainer: {
    display: 'flex',
    padding: theme.spacing.unit * 2,
    justifyContent: 'space-between'
  },
  actionButton: {
    maxWidth: 160,
  }

})

class CategoryAdd extends React.Component {

  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this);
    this.addOnClick = this.addOnClick.bind(this);
  }

  handleChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }

  addOnClick = (marketId) => {
    const { dispatch } = this.props;
    const payload = {marketId, name: this.state.title};
    dispatch(createMarketCategory(payload));
  };


  render () {
    const {
      classes,
      intl,
      marketId
    } = this.props;

    return (
      <form noValidate autoComplete="off">
        <Paper className={classes.container}>
          <TextField
            className={classes.textField}
            InputProps={{ className: classes.textInput }}
            id="category"
            placeholder={intl.formatMessage({id: 'categoryLabel'})}
            defaultValue=""
            margin="normal"
            fullWidth
            onChange={this.handleChange('title')}
          />
        </Paper>
        <div className={classes.actionContainer}>
          <Button
            className={classes.actionButton}
            variant="contained"
            fullWidth
            color="primary"
            onClick={() => this.addOnClick(marketId)}
          >
            {intl.formatMessage({ id: 'addButton' })}
          </Button>
        </div>
      </form>
    )
  };
}

CategoryAdd.propTypes = {
  marketId: PropTypes.string.isRequired,
}

function mapDispatchToProps (dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ createMarketCategory }, dispatch))
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles, {withTheme: true})(CategoryAdd)))
