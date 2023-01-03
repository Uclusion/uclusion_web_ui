import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { JUSTIFY_TYPE } from '../../constants/comments'
import YourVoting from '../../pages/Investible/Voting/YourVoting'
import Voting from '../../pages/Investible/Decision/Voting'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import _ from 'lodash'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getPageReducerPage, usePageStateReducer } from '../../components/PageState/pageStateHooks'
import GravatarGroup from '../../components/Avatars/GravatarGroup'

function InlineInitiativeBox(props) {
  const {
    anInlineMarket, inlineUserId, inArchives, isInbox, showAcceptReject
  } = props;
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, anInlineMarket.id);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
  const myInlinePresence = anInlineMarketPresences.find((presence) => presence.current_user) || {};
  const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id) || [];
  const { created_by: createdBy } = anInlineMarket;
  const isCreator = myInlinePresence.id === createdBy;
  const [fullInlineInvestible] = inlineInvestibles;
  const inlineInvestibleId = fullInlineInvestible ? fullInlineInvestible.investible.id : undefined;
  const comments = getMarketComments(commentsState, anInlineMarket.id);
  const investibleComments = comments.filter((comment) => comment.investible_id === inlineInvestibleId);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const positiveVoters = anInlineMarketPresences.filter((presence) => {
    const { investments } = presence
    const negInvestment = (investments || []).find((investment) => {
      const { quantity } = investment
      return quantity > 0
    })
    return !_.isEmpty(negInvestment)
  });
  const negativeVoters = anInlineMarketPresences.filter((presence) => {
    const { investments } = presence;
    const negInvestment = (investments || []).find((investment) => {
      const { quantity } = investment;
      return quantity < 0;
    });
    return !_.isEmpty(negInvestment);
  });
  const abstaining = anInlineMarketPresences.filter((presence) => presence.abstain);
  const yourPresence = anInlineMarketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments &&
    yourPresence.investments.find((investment) => investment.investible_id === inlineInvestibleId);

  return (
    <div style={{paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0.5rem'}}>
      {!showAcceptReject && !isCreator && !yourVote && inlineInvestibleId && (
        <YourVoting
          investibleId={inlineInvestibleId}
          marketPresences={anInlineMarketPresences}
          comments={investmentReasons}
          userId={inlineUserId}
          market={anInlineMarket}
          groupId={anInlineMarket.id}
          votingPageState={votingPageState}
          updateVotingPageState={updateVotingPageState}
          votingPageStateReset={votingPageStateReset}
          isInbox={isInbox}
        />
      )}
      <h2>
        <FormattedMessage id="initiativeVotingFor"/>
      </h2>
      <Voting
        investibleId={inlineInvestibleId}
        marketPresences={positiveVoters}
        investmentReasons={investmentReasons}
        votingPageState={votingPageState}
        updateVotingPageState={updateVotingPageState}
        votingPageStateReset={votingPageStateReset}
        market={anInlineMarket}
        groupId={anInlineMarket.id}
        votingAllowed={!inArchives}
        yourPresence={myInlinePresence}
      />
      <h2>
        <FormattedMessage id="initiativeVotingAgainst" />
      </h2>
      <Voting
        investibleId={inlineInvestibleId}
        marketPresences={negativeVoters}
        investmentReasons={investmentReasons}
        votingPageState={votingPageState}
        updateVotingPageState={updateVotingPageState}
        votingPageStateReset={votingPageStateReset}
        market={anInlineMarket}
        groupId={anInlineMarket.id}
        votingAllowed={!inArchives}
        yourPresence={myInlinePresence}
      />
      {!_.isEmpty(abstaining) && (
        <>
          <h3>
            <FormattedMessage id="commentAbstainingLabel" />
          </h3>
          <GravatarGroup users={abstaining}/>
        </>
      )}
    </div>
  );
}

InlineInitiativeBox.propTypes = {
  anInlineMarket: PropTypes.object.isRequired,
  inlineUserId: PropTypes.string.isRequired
};

export default InlineInitiativeBox;
