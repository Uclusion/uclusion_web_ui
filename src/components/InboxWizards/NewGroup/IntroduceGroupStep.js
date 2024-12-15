import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { useHistory } from 'react-router';
import GravatarGroup from '../../Avatars/GravatarGroup';
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import Link from '@material-ui/core/Link';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';

function IntroduceGroupStep(props) {
  const { message } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const { market_id: marketId, type_object_id: typeObjectId } = message;
  const classes = wizardStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const history = useHistory();
  const market = getMarket(marketsState, marketId) || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [, ,groupId] = typeObjectId.split('_');
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const group = getGroup(groupsState, marketId, groupId) || {};
  const link = formMarketLink(marketId, groupId);

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Welcome to <Link href={link} onClick={
        (event) => {
          preventDefaultAndProp(event);
          navigate(history, link);
        }
      }>{group.name}</Link> of {market.name}
      </Typography>
      <div style={{paddingBottom: '1rem', paddingTop: '1rem'}}>
        <Typography variant='body2' style={{paddingBottom: '1.5rem'}}>
          Now these group members
        </Typography>
        <GravatarGroup users={groupPresences} gravatarClassName={classes.smallGravatar} />
        <Typography variant='body2' style={{paddingTop: '1.5rem'}}>
          will be automatically notified when you create jobs, comments or bugs in this group.
        </Typography>
      </div>
      <WizardStepButtons
        {...props}
        focus
        showNext={false}
        showTerminate
        onFinish={myOnFinish}
        terminateLabel="notificationDelete"
      />
    </WizardStepContainer>
  );
}

IntroduceGroupStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

IntroduceGroupStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default IntroduceGroupStep;