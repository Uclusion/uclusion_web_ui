import React from 'react'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { createDecision } from '../../api/markets'
import { checkMarketInStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { addParticipants } from '../../api/users'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/core'
import { DECISION_TYPE } from '../../constants/markets'
import { getRandomSupportUser } from '../../utils/userFunctions'

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
  action: {
    boxShadow: "none",
    padding: "4px 16px",
    textTransform: "none",
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

function FeatureRequest() {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  function onDone(marketLink) {
    navigate(history, marketLink);
  }

  function handleSave() {
    const addInfo = {
      name: intl.formatMessage({ id: 'featureRequest' }),
      market_type: DECISION_TYPE,
      description: '<h2>Problem</h2><p>Describe the problem you are facing without referring to a solution. Your ideas for solving this problem should be added as options of this Dialog.</p><p><br></p><h2>Impact</h2><p>How often is this problem occurring and for how many within your organization? How time consuming is the work around if any?</p><p><br></p><h2>Urgency</h2><p>Is there any timeline by which having this problem fixed would be especially important?</p>',
      expiration_minutes: 10080,
    };
    return createDecision(addInfo)
      .then((result) => {
        const { market } = result;
        const { id: marketId } = market;
        const link = formMarketLink(marketId);
        const supportUser = getRandomSupportUser();
        return addParticipants(marketId, [{
          user_id: supportUser.user_id,
          account_id: supportUser.account_id,
          is_observer: false,
        }])
          .then(() => ({
            result: link,
            spinChecker: () => checkMarketInStorage(marketId),
          }));
      });
  }

  return (
    <div>
      <SpinBlockingButton
        marketId=""
        variant="contained"
        color="primary"
        onClick={handleSave}
        hasSpinChecker
        onSpinStop={onDone}
        fullWidth={true}
        className={ clsx(
          classes.action,
          classes.actionPrimary
        )}
      >
        {intl.formatMessage({ id: 'createFeatureRequest' })}
      </SpinBlockingButton>
    </div>
  );
}

export default FeatureRequest;
