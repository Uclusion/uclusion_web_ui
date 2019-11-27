/**
 * A component that renders a _decision_ dialog
 */
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import PlanningIdeas from './PlanningIdeas';
import { useIntl } from 'react-intl';
import { Grid, Typography } from '@material-ui/core';
import { getMarketInfo } from '../../../utils/userFunctions';
import Screen from '../../../containers/Screen/Screen';
import { useHistory } from 'react-router';
import { makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import SubSection from '../../../containers/SubSection/SubSection';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import InvestibleAdd from './InvestibleAdd';
import InvestibleAddActionButton from './InvestibleAddActionButton';

function PlanningDialog(props) {
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history);

  const {
    market,
    investibles,
    marketPresences,
    marketStages,
    comments,
    hidden,
  } = props;

  const intl = useIntl();
  const commentAddRef = useRef(null);
  const { id: marketId } = market;
  const marketComments = comments.filter((comment) => !comment.investible_id);

  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];

  function toggleAddMode() {
    setAddInvestibleMode(!addInvestibleMode);
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
          onCancel={toggleAddMode}
          onSave={toggleAddMode}
        />
      </Screen>
    );
  }

  function commentButtonOnClick(type) {
    setCommentAddType(type);
    setCommentAddHidden(false);
  }

  function closeCommentAddBox() {
    setCommentAddHidden(true);
  }

  function getInvestiblesByPerson(investibles, marketPresences) {
    const followingPresences = marketPresences.filter((presence) => presence.following);
    // eslint-disable-next-line max-len
    const acceptedStage = marketStages.find((stage) => (!stage.allows_investment && stage.allows_refunds));
    const archivedStage = marketStages.find((stage) => (!stage.allows_investment && !stage.allows_refunds));
    return (
      <>
        {
          followingPresences.map((presence) => {
            const myInvestibles = investibles.filter((investible) => {
              const marketInfo = getMarketInfo(investible, marketId);
              return marketInfo.assigned.includes(presence.id);
            });
            return (
              <>
                <br/>
                <Typography
                  noWrap
                >
                  {presence.name}
                </Typography>
                <br/>
                {marketId && acceptedStage && archivedStage && (
                  <PlanningIdeas
                    investibles={myInvestibles}
                    marketId={marketId}
                    acceptedStageId={acceptedStage.id}
                    archivedStageId={archivedStage.id}
                  />
                )}
              </>
            );
          })
        }
      </>
    );
  }

  function getSidebarActions() {
    if (addInvestibleMode) {
      return [];
    }
    return [
      <InvestibleAddActionButton onClick={toggleAddMode} />,
      <RaiseIssue key="issue" onClick={commentButtonOnClick} />,
      <AskQuestions key="question" onClick={commentButtonOnClick} />,
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
            title={intl.formatMessage({ id: 'planningDialogSummaryLabel' })}
          >
            <Summary market={market}/>
          </SubSection>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'planningDialogPeopleLabel' })}
          >
            {getInvestiblesByPerson(investibles, marketPresences)}
          </SubSection>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <SubSection
            title={intl.formatMessage({ id: 'planningDialogDiscussionLabel' })}
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

PlanningDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
};

export default PlanningDialog;
