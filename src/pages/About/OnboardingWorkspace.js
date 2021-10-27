import React, { useContext } from 'react'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { addParticipants } from '../../api/users'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/core'
import PropTypes from 'prop-types'
import { getRandomSupportUser } from '../../utils/userFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { updateStagesForMarket } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { createOnboardingWorkspace } from '../../api/markets'
import { addPresenceToMarket } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../authorization/TokenStorageManager'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper'

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
  action: {
    boxShadow: 'none',
    padding: '4px 16px',
    textTransform: 'none',
    "&:hover": {
      boxShadow: "none"
    }
  },
  actionPrimary: {
    backgroundColor: "#2D9CDB",
    color: "white",
    "&:hover": {
      backgroundColor: "#2D9CDB"
    }
  }
}));

function OnboardingWorkspace(props) {
  const { user } = props
  const { name } = (user || {});
  const history = useHistory()
  const intl = useIntl()
  const classes = useStyles()
  const [, marketsDispatch] = useContext(MarketsContext)
  const [, presenceDispatch] = useContext(MarketPresencesContext)
  const [, marketStagesDispatch] = useContext(MarketStagesContext)

  function onDone (marketLink) {
    navigate(history, marketLink)
  }

  function handleSave () {
    const tokenStorageManager = new TokenStorageManager()
    return createOnboardingWorkspace(intl.formatMessage({ id: 'onboardingWorkspace' }, { x: name }))
      .then((marketResults) => {
        const { market, stages, users, token } = marketResults[0]
        addMarketToStorage(marketsDispatch, () => {}, market)
        updateStagesForMarket(marketStagesDispatch, market.id, stages)
        users.forEach((user) => addPresenceToMarket(presenceDispatch, market.id, user))
        const link = formMarketLink(market.id)
        const supportUser = getRandomSupportUser()
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token)
          .then(() => addParticipants(market.id, [{
            external_id: supportUser.external_id,
            account_id: supportUser.account_id,
            is_guest: false
          }]))
          .then(() => ({
            result: link,
            spinChecker: () => Promise.resolve(true),
          }))
      });
  }

  return (
    <div>
      <SpinBlockingButton
        marketId=""
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={!user}
        hasSpinChecker
        onSpinStop={onDone}
        fullWidth={true}
        className={ clsx(
          classes.action,
          classes.actionPrimary
        )}
      >
        {intl.formatMessage({ id: 'createOnboardingWorkspace' })}
      </SpinBlockingButton>
    </div>
  );
}

OnboardingWorkspace.propTypes = {
  user: PropTypes.object,
};

export default OnboardingWorkspace;
