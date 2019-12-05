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
import CurrentVoting from './CurrentVoting';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import Screen from '../../../containers/Screen/Screen';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import InvestibleAddActionButton from './InvestibleAddActionButton';
import DialogEdit from '../DialogEdit';
import DialogEditSidebarActionButton from '../DialogEditSidebarActionButton';

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
  const proposedStage = marketStages.find((stage) => !stage.allows_investment);
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const [dialogEditMode, setDialogEditMode] = useState(false);
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

  function toggleEditMode() {
    setDialogEditMode(!dialogEditMode);
  }

  function toggleInvestibleAddMode() {
    setAddInvestibleMode(!addInvestibleMode);
  }

  function closeCommentAddBox() {
    setCommentAddHidden(true);
  }

  if (dialogEditMode) {
    return (
      <Screen
        title={market.name}
        hidden={hidden}
        breadCrumbs={breadCrumbs}
      >
        <DialogEdit
          editToggle={toggleEditMode}
          market={market}
          onCancel={toggleEditMode}
        />
      </Screen>
    );
  }

  // if we're adding an investible, just render it with the screen
  if (addInvestibleMode) {
    return (
      <Screen
        title={market.name}
        hidden={hidden}
        breadCrumbs={breadCrumbs}
      >
        <InvestibleAdd
          marketId={marketId}
          onCancel={toggleInvestibleAddMode}
          onSave={toggleInvestibleAddMode}
          isAdmin={isAdmin}
        />
      </Screen>
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
    const userActions = [
      <InvestibleAddActionButton key="addInvestible" onClick={toggleInvestibleAddMode} />,
      <RaiseIssue key="issue" onClick={commentButtonOnClick} />,
      <AskQuestions key="question" onClick={commentButtonOnClick} />
    ];

    if (isAdmin) {
      const adminActions = [<DialogEditSidebarActionButton key="edit" onClick={toggleEditMode} />];
      return adminActions.concat(userActions);
    }
    return userActions;

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
            title={intl.formatMessage({ id: 'decisionDialogSummaryLabel' })}
          >
            <Summary market={market} />
          </SubSection>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
          >
            <CurrentVoting
              marketPresences={marketPresences}
              investibles={underConsideration}
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
  hidden: PropTypes.bool,

};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  marketStages: [],
  hidden: false,
};

export default DecisionDialog;
