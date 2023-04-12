import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
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
import { Block, Group as GroupIcon, Inbox as InboxIcon } from '@material-ui/icons';
import OptionVoting from '../../pages/Dialog/Decision/OptionVoting';
import React, { useContext, useState } from 'react';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useIntl } from 'react-intl';
import { findMessagesForInvestibleId } from '../../utils/messageUtils';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';

export function isRead(inv, messagesState) {
  const investibleId = inv.investible.id;
  const myMessages = findMessagesForInvestibleId(investibleId, messagesState);
  return _.isEmpty(myMessages.find((message) => !message.is_highlighted));
}

function Options(props) {
  const { anInlineMarket, marketId, investibleId, inArchives, isEditable, isSent, groupId, removeActions,
    selectedInvestibleIdParent, setSelectedInvestibleIdParent, searchResults } = props;
  const intl = useIntl();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [tabIndex, setTabIndex] = useState(0);
  const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id, searchResults) || [];
  const anInlineMarketInvestibleComments = getMarketComments(commentsState, anInlineMarket.id) || [];
  const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
  const underConsiderationStage = getInCurrentVotingStage(marketStagesState, anInlineMarket.id);
  const proposedStage = getProposedOptionsStage(marketStagesState, anInlineMarket.id);
  const abstaining = anInlineMarketPresences.filter((presence) => presence.abstain);
  const abstained = _.isEmpty(abstaining) ? undefined :
    <div style={{display: 'flex', paddingLeft: '2rem', alignItems: 'center'}}>
      <Typography variant='body2' style={{paddingRight: '0.5rem'}}>
        {intl.formatMessage({ id: 'commentAbstainingLabel' })}</Typography>
      <GravatarGroup users={abstaining}/>
    </div>;

  function getInlineInvestiblesForStage(stage, inlineInvestibles) {
    if (stage) {
      return inlineInvestibles.reduce((acc, inv) => {
        const { market_infos: marketInfos } = inv;
        for (let x = 0; x < marketInfos.length; x += 1) {
          if (marketInfos[x].stage === stage.id && !marketInfos[x].deleted) {
            return [...acc, inv]
          }
        }
        return acc;
      }, []);
    }
    return [];
  }

  if (_.isEmpty(inlineInvestibles)) {
    return React.Fragment;
  }

  const underConsideration = getInlineInvestiblesForStage(underConsiderationStage, inlineInvestibles);
  const proposed = getInlineInvestiblesForStage(proposedStage, inlineInvestibles);
  const unreadCount = _.size(underConsideration.filter((inv) => !isRead(inv)));
  const htmlColor = _.isEmpty(underConsideration) ? '#8f8f8f' : (unreadCount > 0 ? '#E85757' : '#2D9CDB');
  return (
    <>
      <GmailTabs
        value={tabIndex}
        onChange={(event, value) => {
          setTabIndex(value);
        }}
        indicatorColors={[htmlColor, '#00008B']}
        style={{ paddingBottom: '1rem' }}>
        <GmailTabItem icon={<ThumbsUpDownIcon htmlColor={htmlColor} />}
                      label={intl.formatMessage({id: 'decisionDialogCurrentVotingLabel'})}
                      color='black' tagLabel={unreadCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                      tagColor={unreadCount > 0 ? '#E85757' : undefined}
                      tag={unreadCount > 0 ? `${unreadCount}` :
                        (_.size(underConsideration) > 0 ? `${_.size(underConsideration)}` : undefined)} />
        <GmailTabItem icon={<Block />}
                      label={intl.formatMessage({id: 'decisionDialogProposedOptionsLabel'})}
                      tag={_.size(proposed) > 0 ?
                        `${_.size(proposed)}` : undefined} />
      </GmailTabs>
      {tabIndex === 0 && (
        <OptionVoting
          marketPresences={anInlineMarketPresences}
          investibles={underConsideration}
          marketId={anInlineMarket.id}
          parentMarketId={marketId}
          parentInvestibleId={investibleId}
          groupId={groupId}
          comments={anInlineMarketInvestibleComments}
          inArchives={inArchives}
          isAdmin={isEditable}
          isSent={isSent}
          removeActions={removeActions}
          selectedInvestibleIdParent={selectedInvestibleIdParent}
          setSelectedInvestibleIdParent={setSelectedInvestibleIdParent}
        />
      )}
      {tabIndex === 1 && (
        <OptionVoting
          marketPresences={anInlineMarketPresences}
          investibles={proposed}
          marketId={anInlineMarket.id}
          parentMarketId={marketId}
          parentInvestibleId={investibleId}
          groupId={groupId}
          comments={anInlineMarketInvestibleComments}
          inArchives={inArchives}
          isAdmin={isEditable}
          isSent={isSent}
          removeActions={removeActions}
          selectedInvestibleIdParent={selectedInvestibleIdParent}
          setSelectedInvestibleIdParent={setSelectedInvestibleIdParent}
        />
      )}
    </>
  );
}

export default Options;