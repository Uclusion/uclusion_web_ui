import React from 'react'
import { FormattedMessage } from 'react-intl'
import _ from 'lodash'
import Voting from '../Decision/Voting'
import { JUSTIFY_TYPE } from '../../../constants/comments'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'

function InitiativeVoting(props) {
  const {
    investibleId,
    marketPresences,
    investibleComments,
    market,
    isAdmin,
    inArchives
  } = props;
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState, votingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId);

  const negativeVoters = marketPresences.filter((presence) => {
    const { investments } = presence;
    const negInvestment = (investments || []).find((investment) => {
      const { quantity } = investment;
      return quantity < 0;
    });
    return !_.isEmpty(negInvestment);
  });
  const positiveVoters = marketPresences.filter((presence) => {
    const { investments } = presence
    const negInvestment = (investments || []).find((investment) => {
      const { quantity } = investment
      return quantity > 0
    })
    return !_.isEmpty(negInvestment)
  });
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const votingAllowed = !isAdmin && !inArchives;
  return (
    <>
      <h2 id="for">
        <FormattedMessage id="initiativeVotingFor"/>
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={positiveVoters}
        investmentReasons={investmentReasons}
        votingPageState={votingPageState}
        updateVotingPageState={updateVotingPageState}
        votingPageStateReset={votingPageStateReset}
        market={market}
        votingAllowed={votingAllowed}
        yourPresence={yourPresence}
      />
      <h2 id="against">
        <FormattedMessage id="initiativeVotingAgainst" />
      </h2>
      <Voting
        investibleId={investibleId}
        marketPresences={negativeVoters}
        investmentReasons={investmentReasons}
        votingPageState={votingPageState}
        updateVotingPageState={updateVotingPageState}
        votingPageStateReset={votingPageStateReset}
        market={market}
        votingAllowed={votingAllowed}
        yourPresence={yourPresence}
      />
    </>
  );
}

export default InitiativeVoting;
