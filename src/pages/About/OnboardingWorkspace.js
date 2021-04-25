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
import { doCreateRequirementsWorkspace } from '../../components/AddNew/Workspace/RequirementsWorkspace/workspaceCreator'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'

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
  const [, marketsDispatch] = useContext(MarketsContext);

  function onDone(marketLink) {
    navigate(history, marketLink);
  }

  function handleSave() {
    return doCreateRequirementsWorkspace(marketsDispatch, {
      workspaceName: intl.formatMessage({ id: 'onboardingWorkspace' }, { x: name }),
      workspaceDescription: '<h2>Thanks for reaching out!</h2><p/><p>If you have any questions, suggestions or issues please don\'t hesitate to open them below and we will get back to you as soon as possible.</p>'})
      .then((marketDetails) => {
        const {
          market
        } = marketDetails;
        const marketId = market.id;
        const link = formMarketLink(marketId);
        const supportUser = getRandomSupportUser();
        return addParticipants(marketId, [{
          user_id: supportUser.user_id,
          account_id: supportUser.account_id,
          is_observer: false,
        }]).then(() => ({
            result: link,
            spinChecker: () => Promise.resolve(true),
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
