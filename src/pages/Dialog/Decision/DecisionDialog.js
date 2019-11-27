/**
 * A component that renders a _decision_ dialog
 */
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { Grid } from '@material-ui/core';
import Summary from '../Summary';
import InvestibleAdd from './InvestibleAdd';
import ProposedIdeas from './ProposedIdeas';
import SubSection from '../../../containers/SubSection/SubSection';
import Voting from './Voting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import Screen from '../../../containers/Screen/Screen';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';

function DecisionDialog(props) {
  const {
    market,
    hidden,
    investibles,
    comments,
    marketStages,
    marketPresences,
    myPresence,
  } = props;

  const commentAddRef = useRef(null);
  const intl = useIntl();

  const { is_admin: isAdmin } = myPresence;
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment && !stage.appears_in_market_summary);
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];

  function getInvestiblesForStage(stage) {
    if (stage) {
      return investibles.reduce((acc, inv) => {
        const { market_infos } = inv;
        for (let x = 0; x < market_infos.length; x += 1) {
          if (market_infos[x].stage === stage.id) {
            return [...acc, inv];
          }
        }
        return acc;
      }, []);
    }
    return [];
  }

  const underConsideration = getInvestiblesForStage(underConsiderationStage);
  const proposed = getInvestiblesForStage(proposedStage);

  const { id: marketId } = market;

  function toggleAddMode() {
    setAddInvestibleMode(!addInvestibleMode);
  }

  function closeCommentAddBox() {
    setCommentAddHidden(true);
  }

  // if we're adding an investible, just render it
  if (addInvestibleMode) {
    return (
      <InvestibleAdd
        marketId={marketId}
        onCancel={toggleAddMode}
        onSave={toggleAddMode}
        isAdmin={isAdmin}
      />
    );
  }

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
    // TODO: This doens't actually scroll. Not sure why.
    const top = commentAddRef.current.offsetTop;
    console.log(top);
    window.scrollTo(0, top);
  }

  function getSidebarActions() {
    if (addInvestibleMode) {
      return [];
    }
    return [
      <RaiseIssue key="issue" onClick={commentButtonOnClick}/>,
      <AskQuestions key="question" onClick={commentButtonOnClick}/>
    ];
  }

  const sidebarActions = getSidebarActions();
  return (
    <Screen
      title={market.name}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      sidebarActions={sidebarActions}
    >
      <Grid
        container
        spacing={2}
      >
        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogSummaryLabel'})}
          >
            <Summary market={market}/>
          </SubSection>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel'})}
          >
            <Voting
              marketPresences={marketPresences}
              investibles={underConsideration}
              marketId={marketId}
            />
          </SubSection>
        </Grid>

        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
          >
            <ProposedIdeas
              investibles={proposed}
              marketId={marketId}
              comments={investibleComments}
            />
          </SubSection>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogDiscussionLabel' })}
          >
            <div ref={commentAddRef}>
              <CommentAddBox
                hidden={commentAddHidden}
                type={commentAddType}
                allowedTypes={allowedCommentTypes}
                marketId={marketId}
                onSave={closeCommentAddBox}
                onCancel={closeCommentAddBox}
              />
            </div>
            <CommentBox
              comments={marketComments}
              marketId={marketId}
            />
          </SubSection>
        </Grid>
      </Grid>
    </Screen>
  );
}

DecisionDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired,
  addInvestibleMode: PropTypes.bool,
  setAddInvestibleMode: PropTypes.func,
  hidden: PropTypes.bool,

};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  marketStages: [],
  isAdmin: false,
  addInvestibleMode: false,
  hidden: false,
  setAddInvestibleMode: () => {
  },
};

export default DecisionDialog;
