import React from 'react'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { createPlanning } from '../../api/markets'
import { checkMarketInStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { addParticipants } from '../../api/users'
import clsx from 'clsx'
import config from '../../config'
import { makeStyles } from '@material-ui/core'
import { PLANNING_TYPE } from '../../constants/markets'
import PropTypes from 'prop-types'

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

function OnboardingWorkspace(props) {
  const { user } = props;
  const { name } = user;
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  function onDone(marketLink) {
    navigate(history, marketLink);
  }

  function handleSave() {
    const addInfo = {
      name: intl.formatMessage({ id: 'onboardingWorkspace' }, { x: name }),
      market_type: PLANNING_TYPE,
      description: '<h2>Thanks for reaching out!</h2><p>If you have any questions, suggestions or issues please don\'t hesitate to open them below and we will get back to you as soon as possible.</p>',
    };
    return createPlanning(addInfo)
      .then((result) => {
        const { market } = result;
        const { id: marketId } = market;
        const link = formMarketLink(marketId);
        return addParticipants(marketId, [{
          user_id: config.support_user_id,
          account_id: config.support_account_id,
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
        {intl.formatMessage({ id: 'createOnboardingWorkspace' })}
      </SpinBlockingButton>
    </div>
  );
}

OnboardingWorkspace.propTypes = {
  user: PropTypes.object.isRequired,
};

export default OnboardingWorkspace;
