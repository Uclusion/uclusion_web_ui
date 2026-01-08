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
import {
  getGroupPresences,
  getMarketPresences,
  isAutonomousGroup
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import Link from '@material-ui/core/Link';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { fixName } from '../../../utils/userFunctions';
import Gravatar from '../../Avatars/Gravatar';

function IntroduceGroupStep(props) {
  const { message } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const { market_id: marketId, type_object_id: typeObjectId } = message;
  const market = getMarket(marketsState, marketId) || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [, ,groupId] = typeObjectId.split('_');
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const group = getGroup(groupsState, marketId, groupId) || {};
  const isAutonomous = isAutonomousGroup(groupPresences, group);
  const link = formMarketLink(marketId, groupId);

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch);
    // Go to the group when done as that's what was just introduced
    navigate(history, formMarketLink(marketId, groupId));
  }

  return (
    <WizardStepContainer
      {...props}
    >
      {isAutonomous && (
        <Typography className={classes.introText} style={{display: 'flex'}}>
          Welcome to <div style={{marginLeft: '0.4rem'}}/>
          <Gravatar name={fixName(groupPresences[0].name)} email={groupPresences[0].email} />
          <Link href={link} style={{marginLeft: '0.4rem', marginRight: '0.4rem'}}
                onClick={(event) => {preventDefaultAndProp(event);
            navigate(history, link);}}>work</Link> of {market.name}
        </Typography>
      )}
      {!isAutonomous && (
        <Typography className={classes.introText}>
          Welcome to <Link href={link} onClick={
          (event) => {
            preventDefaultAndProp(event);
            navigate(history, link);
          }
        }>{group.name}</Link> of {market.name}
        </Typography>
      )}
      {!isAutonomous && (
        <div style={{paddingBottom: '1rem', paddingTop: '1rem'}}>
          <Typography variant='body2' style={{paddingBottom: '1.5rem'}}>
            Now these view members
          </Typography>
          <GravatarGroup users={groupPresences} gravatarClassName={classes.smallGravatar} />
          <Typography variant='body2' style={{paddingTop: '1.5rem'}}>
            will be automatically notified when you create jobs, comments or bugs in this view.
          </Typography>
        </div>
      )}
      {isAutonomous && (
        <div style={{paddingBottom: '1rem', paddingTop: '1rem'}}>
          <Typography style={{paddingBottom: '1.5rem'}}>
            This view holds all of your assignments - even one's that also display in other views.
          </Typography>
        </div>
      )}
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

export default IntroduceGroupStep;