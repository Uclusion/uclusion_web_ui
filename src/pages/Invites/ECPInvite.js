import React, { useContext, useEffect } from 'react'
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import Header from '../../containers/Header'
import { navigate, } from '../../utils/marketIdPathFunctions'
import { toastError } from '../../utils/userMessage'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { makeStyles } from '@material-ui/styles'
import _ from 'lodash'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import LoadingDisplay from '../../components/LoadingDisplay';
import { createECPMarkets } from './ECPMarketGenerator';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    background: '#efefef',
    padding: '46px 20px 156px',
  },
  containerAll: {
    background: '#efefef',
    padding: '24px 20px 156px',
    marginTop: '80px',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: '24px 12px 156px',
    },
  },
  actionContainer: {
    marginBottom: '-6rem'
  },
  content: {
    background: '#efefef',
  },
  elevated: {
    zIndex: 99,
  },
}));

function ECPInvite(props) {
  const { hidden, utm } = props;
  const intl = useIntl();
  const history = useHistory();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [userState] = useContext(AccountUserContext);
  const { user } = userState;
  const { name } = user || {};
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && !_.isEmpty(name)) {
      const dispatchers = {marketsDispatch, diffDispatch, presenceDispatch, investiblesDispatch};
      createECPMarkets(dispatchers)
        .then(() => {
          navigate(history, '/#onboarded');
        })
        .catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [name, hidden, history, marketsDispatch, intl, diffDispatch, presenceDispatch, investiblesDispatch]);

  if (hidden) {
    return <React.Fragment/>
  }
  
  return (
    <div>
    <Helmet
      defer={false}
    >
      <title>{intl.formatMessage({ id: 'loadingMarket' })}</title>
    </Helmet>)
    <Header
      title={intl.formatMessage({ id: 'loadingMarket' })}
      breadCrumbs={[]}
      toolbarButtons={[]}
      hidden={hidden}
      appEnabled
      logoLinkDisabled
      hideTools
    />
    <div className={classes.content}>
      <div>LLL1</div>
      <LoadingDisplay showMessage={true} messageId="OnboardingCreatingCustomWorkspace" />
    </div>
  </div>
  );
}

ECPInvite.propTypes = {
  hidden: PropTypes.bool,
  utm: PropTypes.string,
};

ECPInvite.defaultProps = {
  hidden: false,
  utm: 'team',
};

export default ECPInvite;
