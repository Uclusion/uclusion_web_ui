import { getMarketInvestibles, refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import _ from 'lodash';
import { Typography } from '@material-ui/core';
import GravatarGroup from '../Avatars/GravatarGroup';
import { GmailTabItem, GmailTabs } from '../../containers/Tab/Inbox';
import { Block } from '@material-ui/icons';
import OptionVoting from '../../pages/Dialog/Decision/OptionVoting';
import React, { useContext, useEffect, useState } from 'react';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useIntl } from 'react-intl';
import { findMessageForCommentId, findMessagesForInvestibleId } from '../../utils/messageUtils';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import { getMarketInfo } from '../../utils/userFunctions';
import { moveInvestibleToCurrentVoting } from '../../api/investibles';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { ACTIVE_STAGE } from '../../constants/markets';
import { useLocation } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';

export function isNew(inv, messagesState) {
  const investibleId = inv.investible.id;
  const myMessages = findMessagesForInvestibleId(investibleId, messagesState);
  return !_.isEmpty(myMessages.find((message) => message.is_highlighted));
}

export function isNewComment(comment, messagesState) {
  const myMessage = findMessageForCommentId(comment.id, messagesState) || {};
  if (myMessage?.highlighted_list !== undefined) {
    return myMessage.highlighted_list.includes(comment.id);
  }
  return myMessage?.is_highlighted;
}

function Options(props) {
  const { anInlineMarket, marketId, investibleId, inArchives, isEditable, isSent, groupId, removeActions,
    selectedInvestibleIdParent, searchResults, isInbox, useCompression } = props;
  const location = useLocation();
  const { hash } = location;
  const intl = useIntl();
  const [investiblesState, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [tabIndex, setTabIndex] = useState(0);
  const underConsiderationStage = getInCurrentVotingStage(marketStagesState, anInlineMarket.id);
  const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id, searchResults, isInbox)
    || [];
  function getInlineInvestiblesForStage(stage) {
    const investiblesRaw = inlineInvestibles.filter((investible) => {
      const aMarketInfo = getMarketInfo(investible, anInlineMarket.id);
      return aMarketInfo && aMarketInfo.stage === stage?.id && !aMarketInfo.deleted;
    }) || [];
    return _.orderBy(investiblesRaw, [(inv) => {
      return isNew(inv, messagesState) ? 0 : 1;
    }, (inv) => inv.investible.name]);
  }
  const underConsideration = getInlineInvestiblesForStage(underConsiderationStage);
  const firstConsidered = _.isEmpty(underConsideration) ? undefined : underConsideration[0];
  const selectedInvestibleId = selectedInvestibleIdParent ||
    (useCompression ? undefined : firstConsidered?.investible?.id);
  const selectedInvestible = inlineInvestibles.find((inv) => inv.investible.id === selectedInvestibleId);
  const proposedStage = getProposedOptionsStage(marketStagesState, anInlineMarket.id);
  const selectedStageTab = selectedInvestible ?
    (getMarketInfo(selectedInvestible, anInlineMarket.id).stage === proposedStage.id ? 1 : 0) : undefined;
  const [selectedInvestibleIdTabZero, setSelectedInvestibleIdTabZero] = useState(
    selectedStageTab === 0 ? selectedInvestibleId : undefined);
  const [selectedInvestibleIdTabOne, setSelectedInvestibleIdTabOne] = useState(
    selectedStageTab === 1 ? selectedInvestibleId : undefined);
  const anInlineMarketInvestibleComments = getMarketComments(commentsState, anInlineMarket.id) || [];
  const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
  const myInlinePresence = anInlineMarketPresences.find((presence) => presence.current_user) || {};
  const abstaining = anInlineMarketPresences.filter((presence) => presence.abstain);
  const useTabIndex = selectedStageTab || tabIndex;
  const foundInv = (inlineInvestibles || []).find((inv) => hash?.includes(inv.investible.id));

  useEffect(() => {
    if (hash && !hash.includes(selectedInvestibleIdTabZero) && !hash.includes(selectedInvestibleIdTabOne)) {
      const foundStageTab = foundInv ?
        (getMarketInfo(foundInv, anInlineMarket?.id)?.stage === proposedStage?.id ? 1 : 0) : undefined;
      if (foundInv) {
        if (foundStageTab === 0) {
          setSelectedInvestibleIdTabZero(foundInv.investible.id);
        } else if (foundStageTab === 1) {
          setSelectedInvestibleIdTabOne(foundInv.investible.id);
        }
        setTabIndex(foundStageTab);
      }
    }
  }, [hash, selectedInvestibleId, selectedInvestibleIdTabZero, selectedInvestibleIdTabOne, anInlineMarket?.id,
    proposedStage?.id, foundInv]);

  const abstained = _.isEmpty(abstaining) ? undefined :
    <div style={{display: 'flex', paddingLeft: '2rem', alignItems: 'center'}}>
      <Typography variant='body2' style={{paddingRight: '0.5rem'}}>
        {intl.formatMessage({ id: 'commentAbstainingLabel' })}</Typography>
      <GravatarGroup users={abstaining}/>
    </div>;

  function onDrop(event, fromStage, toStage) {
    const moveInfo = {
      marketId: anInlineMarket.id,
      investibleId: event.dataTransfer.getData('text'),
      stageInfo: {
        current_stage_id: fromStage.id,
        stage_id: toStage.id,
      },
    };
    setOperationRunning(true);
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        refreshInvestibles(invDispatch, () => {}, [inv]);
        setOperationRunning(false);
      });
  }

  function onDropApprovable(event) {
    if (myInlinePresence.is_admin) {
      return onDrop(event, proposedStage, underConsiderationStage);
    }
  }

  function onDropProposed(event) {
    return onDrop(event, underConsiderationStage, proposedStage);
  }

  if (_.isEmpty(inlineInvestibles)) {
    return React.Fragment;
  }

  const proposed = getInlineInvestiblesForStage(proposedStage);
  const unreadCount = _.size(underConsideration.filter((inv) => isNew(inv)));
  const htmlColor = _.isEmpty(underConsideration) ? '#8f8f8f' : (unreadCount > 0 ? '#E85757' : '#2D9CDB');
  const tabInvestibles = useTabIndex === 0 ? underConsideration : proposed;
  return (
    <div style={{marginTop: '0.25rem'}}>
      {abstained}
      <div onDrop={useTabIndex === 0 ? onDropProposed : onDropApprovable}
           onDragOver={(event)=>event.preventDefault()}>
        <GmailTabs
          value={useTabIndex}
          onChange={(event, value) => {
            setTabIndex(value);
          }}
          indicatorColors={[htmlColor, '#00008B']}
          style={{ paddingBottom: '1rem' }}>
          <GmailTabItem icon={<ThumbsUpDownIcon htmlColor={htmlColor} />} onDrop={onDropApprovable}
                        label={intl.formatMessage({id: 'decisionDialogCurrentVotingLabel'})}
                        color='black' tagLabel={unreadCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        tagColor={unreadCount > 0 ? '#E85757' : undefined} toolTipId='votedOptionsToolTip'
                        tag={unreadCount > 0 ? `${unreadCount}` :
                          (_.size(underConsideration) > 0 ? `${_.size(underConsideration)}` : undefined)} />
          <GmailTabItem icon={<Block />} onDrop={onDropProposed} toolTipId='proposedOptionsToolTip'
                        label={intl.formatMessage({id: 'decisionDialogProposedOptionsLabel'})}
                        tag={_.size(proposed) > 0 ? `${_.size(proposed)}` : undefined} />
        </GmailTabs>
      </div>
      {_.isEmpty(tabInvestibles) && useTabIndex === 0 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'decisionDialogCurrentVotingLabel'})} is empty.<br/><br/>
          Options to approve display here.
        </Typography>
      )}
      {_.isEmpty(tabInvestibles) && useTabIndex === 1 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'decisionDialogProposedOptionsLabel'})} is empty.<br/><br/>
          Options that are rejected or need discussion display here.
        </Typography>
      )}
      <OptionVoting
        marketPresences={anInlineMarketPresences}
        investibles={tabInvestibles}
        marketId={anInlineMarket.id}
        parentMarketId={marketId}
        parentInvestibleId={investibleId}
        groupId={groupId}
        comments={anInlineMarketInvestibleComments}
        inArchives={inArchives || anInlineMarket.market_stage !== ACTIVE_STAGE}
        isAdmin={isEditable}
        isSent={isSent}
        removeActions={removeActions}
        selectedInvestibleId={useTabIndex === 0 ? selectedInvestibleIdTabZero : selectedInvestibleIdTabOne}
        setSelectedInvestibleId={useTabIndex === 0 ? setSelectedInvestibleIdTabZero : setSelectedInvestibleIdTabOne}
      />
    </div>
  );
}

export default Options;