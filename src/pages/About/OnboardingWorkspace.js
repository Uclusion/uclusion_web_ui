import React, { useContext } from 'react'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { Button, makeStyles } from '@material-ui/core'
import PropTypes from 'prop-types'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
  actionPrimary: {
    backgroundColor: '#2D9CDB',
    color: 'white',
    textTransform: 'unset',
    '&:hover': {
      backgroundColor: '#e0e0e0'
    },
    '&:disabled': {
      color: 'white',
      backgroundColor: 'rgba(45, 156, 219, .6)'
    }
  },
}));

function OnboardingWorkspace() {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const [marketsState] = useContext(MarketsContext);
  const { marketDetails } = marketsState;
  const supportMarket = (marketDetails || []).find((market) => market.market_sub_type === 'SUPPORT') || {};
  const marketLink = supportMarket.id ? formMarketLink(supportMarket.id) : undefined;
  return (
    <Button
      marketId=""
      variant="contained"
      color="primary"
      onClick={() => navigate(history, marketLink)}
      disabled={!marketLink}
      fullWidth={true}
      className={classes.actionPrimary}
    >
      {intl.formatMessage({ id: 'createOnboardingWorkspace' })}
    </Button>
  );
}

OnboardingWorkspace.propTypes = {
  user: PropTypes.object,
};

export default OnboardingWorkspace;
