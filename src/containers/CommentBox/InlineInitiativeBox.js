import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
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
import { useHistory } from 'react-router';
import { APPROVAL_WIZARD_TYPE } from '../../constants/markets';
import SpinningButton from '../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../components/AddNewWizards/WizardStylesContext';
import { Typography } from '@material-ui/core';

function InlineInitiativeBox(props) {
  const { anInlineMarket, removeActions, isTaskDisplay, typeObjectId, isInbox, createdBy } = props;
  const history = useHistory();
  const intl = useIntl();
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [votingPageState, updateVotingPageState] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, anInlineMarket.id,
      {useCompressionFor: true, useCompressionAgainst: true});
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const wizardClasses = wizardStyles();
  const { useCompressionFor, useCompressionAgainst } = votingPageState;
  const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
  const myInlinePresence = anInlineMarketPresences.find((presence) => presence.current_user) || {};
  const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id) || [];
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
  const showVoteButtons = !isCreator && !yourVote && inlineInvestibleId && !removeActions && !isTaskDisplay;
  if (isTaskDisplay && _.isEmpty(positiveVoters) && _.isEmpty(negativeVoters)) {
    return React.Fragment;
  }
  return (
    <div style={{paddingLeft: '1rem', paddingRight: '1rem'}}>
      <h2 style={{marginBottom: '0.5rem'}}>
        <FormattedMessage id="initiativeVotingFor"/>
      </h2>
      {showVoteButtons && (
        <SpinningButton icon={AddIcon} doSpin={false} className={wizardClasses.actionNext} iconColor="black"
                        variant="text" focus={isInbox}
                        id={`voteFor${anInlineMarket.id}`} style={{display: "flex", marginBottom: '1rem'}}
                        onClick={() => navigate(history,
                          `${formWizardLink(APPROVAL_WIZARD_TYPE, anInlineMarket.id, inlineInvestibleId, 
                            undefined, undefined, typeObjectId)}&voteFor=true`)}>
          {intl.formatMessage({ id: 'voteFor'})}
        </SpinningButton>
      )}
      {!showVoteButtons && _.isEmpty(positiveVoters) && (
        <Typography style={{marginLeft: 'auto', marginRight: 'auto'}} variant="body1">
          No for votes.
        </Typography>
      )}
      <Voting
        investibleId={inlineInvestibleId}
        marketPresences={positiveVoters}
        investmentReasons={investmentReasons}
        toggleCompression={() => updateVotingPageState({ useCompressionFor: !useCompressionFor })}
        useCompression={useCompressionFor}
        market={anInlineMarket}
        groupId={anInlineMarket.id}
        yourPresence={myInlinePresence}
      />
      <h2 style={{marginTop: '1.75rem', marginBottom: '0.5rem'}}>
        <FormattedMessage id="initiativeVotingAgainst" />
      </h2>
      {showVoteButtons && (
        <SpinningButton icon={AddIcon} doSpin={false} className={wizardClasses.actionNext} iconColor="black"
                        variant="text"
                        id={`voteAgainst${anInlineMarket.id}`} style={{display: "flex", marginBottom: '1rem'}}
                        onClick={() => navigate(history,
                          `${formWizardLink(APPROVAL_WIZARD_TYPE, anInlineMarket.id, inlineInvestibleId,
                            undefined, undefined, typeObjectId)}&voteFor=false`)}>
          {intl.formatMessage({ id: 'voteAgainst'})}
        </SpinningButton>
      )}
      {!showVoteButtons && _.isEmpty(negativeVoters) && (
        <Typography style={{marginLeft: 'auto', marginRight: 'auto'}} variant="body1">
          No against votes.
        </Typography>
      )}
      <Voting
        investibleId={inlineInvestibleId}
        marketPresences={negativeVoters}
        investmentReasons={investmentReasons}
        toggleCompression={() => updateVotingPageState({ useCompressionAgainst: !useCompressionAgainst })}
        useCompression={useCompressionAgainst}
        market={anInlineMarket}
        groupId={anInlineMarket.id}
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
