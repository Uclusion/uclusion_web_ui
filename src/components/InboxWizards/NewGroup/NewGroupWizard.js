import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import IntroduceGroupStep from './IntroduceGroupStep';
import IntroduceWorkspaceStep from './IntroduceWorkspaceStep';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { DEMO_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function NewGroupWizard(props) {
  const [marketsState] = useContext(MarketsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const { message } = props;
  const { group_id: groupId, market_id: marketId } = message;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const market = getMarket(marketsState, marketId) || {};
  const isDemo = market.market_type === PLANNING_TYPE && market.object_type === DEMO_TYPE;
  // If this is demo, or you are a pure observer introduce the workspace
  // If not demo, and you are a member of some group then introduce the group as
  // you've either seen the workspace or were put specifically in this group
  const parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`new_group_wizard${parentElementId}`} defaultFormData={{parentElementId}}>
      {(isDemo || _.isEmpty(groupPresences)) && (
        <IntroduceWorkspaceStep message={message} />
      )}
      {!isDemo && !_.isEmpty(groupPresences) && (
        <IntroduceGroupStep message={message} />
      )}
    </FormdataWizard>
  );
}

NewGroupWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

NewGroupWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default NewGroupWizard;

