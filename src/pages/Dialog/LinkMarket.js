import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage } from 'react-intl'
import { List, Paper, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import clsx from 'clsx'
import { useMetaDataStyles } from '../Investible/Planning/PlanningInvestible'

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px',
    marginTop: '-6px',
    boxShadow: 'none',
    width: '100%',
  },
  sidebarContent: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingTop: '0',
    paddingBottom: '0',
    '& span': {
      fontSize: '.9375rem',
      fontWeight: 700
    }
  },
  capitalize: {
    textTransform: 'capitalize'
  }
}))

function LinkMarket (props) {
  const { actions } = props;
  const classes = useStyles();
  const metaClasses = useMetaDataStyles();

  if (_.isEmpty(actions)) {
    return React.Fragment;
  }

  return (
    <Paper className={classes.container} id="summary">
      <div className={classes.capitalize}>
        <div className={clsx(metaClasses.group, metaClasses.assignments, metaClasses.linkContainer)}>
          <List className={classes.sidebarContent}>
            {actions}
          </List>
        </div>
      </div>
    </Paper>
  )
}

LinkMarket.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.element),
}

LinkMarket.defaultProps = {
  actions: [],
};

export default LinkMarket
