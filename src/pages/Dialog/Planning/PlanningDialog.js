/**
 * A component that renders a _decision_ dialog
 */
import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import ListSubheader from '@material-ui/core/ListSubheader';
import Summary from '../Summary';
import PlanningIdeas from './PlanningIdeas';
import { getMarketInfo } from '../../../utils/userFunctions';
import Screen from '../../../containers/Screen/Screen';
import { makeBreadCrumbs } from '../../../utils/marketIdPathFunctions';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import RaiseIssue from '../../../components/SidebarActions/RaiseIssue';
import AskQuestions from '../../../components/SidebarActions/AskQuestion';
import SubSection from '../../../containers/SubSection/SubSection';
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import InvestibleAdd from './InvestibleAdd';
import InvestibleAddActionButton from './InvestibleAddActionButton';
import DialogEditSidebarActionButton from '../DialogEditSidebarActionButton';
import DialogEdit from '../DialogEdit';
import { unlockPlanningMarketForEdit } from '../../../api/markets';
import ViewArchiveActionButton from './ViewArchivesActionButton';

function PlanningDialog(props) {
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history);
  const {
    market,
    investibles,
    marketPresences,
    myPresence,
    marketStages,
    comments,
    hidden,
  } = props;

  const intl = useIntl();
  const { is_admin: isAdmin } = myPresence;
  const commentAddRef = useRef(null);
  const { id: marketId } = market;
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const [commentAddType, setCommentAddType] = useState(ISSUE_TYPE);
  const [commentAddHidden, setCommentAddHidden] = useState(true);
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const [dialogEditMode, setDialogEditMode] = useState(false);
  const allowedCommentTypes = [ISSUE_TYPE, QUESTION_TYPE];

  function toggleAddInvestibleMode() {
    setAddInvestibleMode(!addInvestibleMode);
  }

  function toggleEditMode() {
    setDialogEditMode(!dialogEditMode);
  }

  function onDialogEditCancel() {
    return unlockPlanningMarketForEdit(marketId)
      .then(() => {
        toggleEditMode();
      });
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
          onCancel={onDialogEditCancel}
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
          onCancel={toggleAddInvestibleMode}
          onSave={toggleAddInvestibleMode}
          marketPresences={marketPresences}
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
    const acceptedStage = marketStages.find((stage) => (!stage.allows_investment && stage.singular_only));
    const inDialogStage = marketStages.find((stage) => (stage.allows_investment));
    // eslint-disable-next-line max-len
    const inReviewStage = marketStages.find((stage) => (stage.appears_in_context && !stage.singular_only));
    return (
      <GridList key="toppresencelist" cellHeight="auto" cols={3}>
        <GridListTile key="Subheader1" cols={1} style={{ height: 'auto', width: '33%' }}>
          <ListSubheader component="div">{intl.formatMessage({ id: 'planningVotingStageLabel' })}</ListSubheader>
        </GridListTile>
        <GridListTile key="Subheader2" cols={1} style={{ height: 'auto', width: '33%' }}>
          <ListSubheader component="div">{intl.formatMessage({ id: 'planningAcceptedStageLabel' })}</ListSubheader>
        </GridListTile>
        <GridListTile key="Subheader3" cols={1} style={{ height: 'auto', width: '33%' }}>
          <ListSubheader component="div">{intl.formatMessage({ id: 'planningReviewStageLabel' })}</ListSubheader>
        </GridListTile>
        {
          followingPresences.map((presence) => {
            const myInvestibles = investibles.filter((investible) => {
              const marketInfo = getMarketInfo(investible, marketId);
              return marketInfo.assigned.includes(presence.id);
            });
            const { id, name } = presence;
            return (

                <GridList key={`topof${id}`} cellHeight="auto" cols={3}>
                  <GridListTile key={`namecolumn${id}`} cols={3} style={{ height: 'auto', width: '100%' }}>
                    <ListSubheader component="div"><div id={id}>{name}</div></ListSubheader>
                  </GridListTile>
                  {marketId && acceptedStage && inDialogStage && inReviewStage && (
                    <PlanningIdeas
                      investibles={myInvestibles}
                      marketId={marketId}
                      acceptedStageId={acceptedStage.id}
                      inDialogStageId={inDialogStage.id}
                      inReviewStageId={inReviewStage.id}
                      comments={comments}
                      presenceId={presence.id}
                    />
                  )}
                </GridList>
            );
          })
        }
      </GridList>
    );
  }

  function getSidebarActions() {
    if (addInvestibleMode) {
      return [];
    }
    const userActions = [
      <InvestibleAddActionButton key="investibleadd" onClick={toggleAddInvestibleMode} />,
      <ViewArchiveActionButton key="archives" />,
      <RaiseIssue key="issue" onClick={commentButtonOnClick} />,
      <AskQuestions key="question" onClick={commentButtonOnClick} />,
    ];
    if (isAdmin) {
      const adminActions = [<DialogEditSidebarActionButton key="edit" onClick={toggleEditMode}
                                                           onCancel={onDialogEditCancel} />];
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
            title={intl.formatMessage({ id: 'planningDialogSummaryLabel' })}
          >
            <Summary market={market} />
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
            <div ref={commentAddRef} key="commentsadd">
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
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: [],
};

export default PlanningDialog;
