import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { JUSTIFY_TYPE } from '../../constants/comments'
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
import AddIcon from '@material-ui/icons/Add';
import { formWizardLink, navigate } from '../../utils/marketIdPathFunctions';
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton';
import { useHistory } from 'react-router';
import { APPROVAL_WIZARD_TYPE } from '../../constants/markets';

function InlineInitiativeBox(props) {
  const {
    anInlineMarket, inArchives, removeActions, isTaskDisplay, typeObjectId
  } = props;
  const history = useHistory();
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, anInlineMarket.id, {useCompression: true});
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const { useCompression } = votingPageState;
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
  const yourVote = yourPresence?.investments?.find((investment) => investment.investible_id === inlineInvestibleId &&
      !investment.deleted);
  const showVoteButtons = !isCreator && !yourVote && inlineInvestibleId && !removeActions;
  if (isTaskDisplay && _.isEmpty(positiveVoters) && _.isEmpty(negativeVoters)) {
    return React.Fragment;
  }
  return (
    <div style={{paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0.5rem'}}>
      {showVoteButtons && (
        <div style={{display: 'flex'}}>
            <SpinningIconLabelButton icon={AddIcon} doSpin={false} whiteBackground id={`voteFor${anInlineMarket.id}`}
                                     style={{display: "flex", marginTop: '2rem', marginBottom: '1.5rem'}}
                                     onClick={() => navigate(history,
                                       `${formWizardLink(APPROVAL_WIZARD_TYPE, anInlineMarket.id, 
                                         inlineInvestibleId, undefined, undefined, 
                                         typeObjectId)}&voteFor=true`)}>
              <FormattedMessage id="voteFor" />
            </SpinningIconLabelButton>
            <SpinningIconLabelButton icon={AddIcon} doSpin={false} whiteBackground
                                     id={`voteAgainst${anInlineMarket.id}`}
                                     style={{display: "flex", marginTop: '2rem', marginBottom: '1.5rem'}}
                                     onClick={() => navigate(history, `${formWizardLink(APPROVAL_WIZARD_TYPE, 
                                       anInlineMarket.id, inlineInvestibleId, undefined, undefined, 
                                       typeObjectId)}&voteFor=false`)}>
              <FormattedMessage id="voteAgainst" />
            </SpinningIconLabelButton>
        </div>
      )}
      <h2>
        <FormattedMessage id="initiativeVotingFor"/>
      </h2>
      <Voting
        investibleId={inlineInvestibleId}
        marketPresences={positiveVoters}
        investmentReasons={investmentReasons}
        toggleCompression={() => updateVotingPageState({ useCompression: !useCompression })}
        useCompression={useCompression}
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
        toggleCompression={() => updateVotingPageState({ useCompression: !useCompression })}
        useCompression={useCompression}
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
  removeActions: PropTypes.bool
};

InlineInitiativeBox.defaultProps = {
  removeActions: false
}

export default InlineInitiativeBox;
