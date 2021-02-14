/**
 * A component that renders a _planning_ dialog
 */
import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { Grid, Typography } from '@material-ui/core'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import { makeStyles } from '@material-ui/core/styles'
import Summary from './Summary'
import PlanningIdeas from './PlanningIdeas'
import Screen from '../../../containers/Screen/Screen'
import {
  formMarketAddInvestibleLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate
} from '../../../utils/marketIdPathFunctions'
import {
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { ACTIVE_STAGE } from '../../../constants/markets'
import { getUserInvestibles, sumNotificationCounts } from './userUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import DismissableText from '../../../components/Notifications/DismissableText'
import { SECTION_TYPE_SECONDARY, SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import SubSection from '../../../containers/SubSection/SubSection'
import { getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import clsx from 'clsx'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import ViewArchiveActionButton from './ViewArchivesActionButton'
import { TourContext } from '../../../contexts/TourContext/TourContext'
import { startTour } from '../../../contexts/TourContext/tourContextReducer'
import { CognitoUserContext } from '../../../contexts/CognitoUserContext/CongitoUserContext'
import UclusionTour from '../../../components/Tours/UclusionTour'
import { inviteStoriesWorkspaceSteps } from '../../../components/Tours/InviteTours/storyWorkspace'
import {
  INVITE_STORIES_WORKSPACE_FIRST_VIEW
} from '../../../contexts/TourContext/tourContextHelper'
import { getVoteTotalsForUser, hasNotVoted } from '../../../utils/userFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import MarketLinks from '../MarketLinks'
import MarketTodos from './MarketTodos'
import Gravatar from '../../../components/Avatars/Gravatar';
import { LocalPlanningDragContext } from './InvestiblesByWorkspace'
import { isInReviewStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils'
import NotificationCountChips from '../NotificationCountChips'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'

function PlanningDialog(props) {
  const history = useHistory();
  const {
    market,
    investibles,
    marketPresences,
    marketStages,
    comments,
    hidden,
    myPresence,
    banner
  } = props;
  const cognitoUser = useContext(CognitoUserContext);
  const [, tourDispatch] = useContext(TourContext);
  const [marketsState] = useContext(MarketsContext);
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();
  const { id: marketId, market_stage: marketStage, children } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || (myPresence && !myPresence.following);
  const isAdmin = myPresence.is_admin;
  const breadCrumbs = inArchives
      ? makeArchiveBreadCrumbs(history)
      : makeBreadCrumbs(history);
  const unResolvedMarketComments = comments.filter(comment => !comment.investible_id && !comment.resolved) || [];
  const notTodoComments = unResolvedMarketComments.filter(comment => comment.comment_type !== TODO_TYPE);
  const allowedCommentTypes = [QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE];
  const { name: marketName, locked_by: lockedBy, market_sub_type: marketSubType, created_by: marketCreatedBy } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const [startTourNow, setStartTourNow] = useState(undefined);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const acceptedStage = marketStages.find(stage => stage.assignee_enter_only) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(stage => isInReviewStage(stage)) || {};
  const inBlockingStage = marketStages.find(stage => stage.move_on_comment && stage.allows_issues) || {};
  const inVerifiedStage = marketStages.find(stage => stage.appears_in_market_summary) || {};
  const visibleStages = marketStages.filter((stage) => stage.appears_in_context) || [];
  const visibleStageIds = visibleStages.map((stage) => stage.id);
  const assignablePresences = presences.filter((presence) => !presence.market_banned && presence.following);
  const isChannel = _.isEmpty(investibles);

  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find(
      presence => presence.id === lockedBy
    );
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }

  const furtherWorkStage = marketStages.find((stage) => (!stage.allows_assignment && !stage.close_comments_on_entrance)) || {};
  const requiresInputStage = marketStages.find((stage) => (!stage.allows_issues && stage.move_on_comment)) || {};
  const furtherWorkInvestibles = getInvestiblesInStage(investibles, furtherWorkStage.id);
  const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id);
  const blockedInvestibles = getInvestiblesInStage(investibles, inBlockingStage.id);
  const highlightMap = {};
  requiresInputInvestibles.forEach((investible) => {
    if (hasNotVoted(investible, marketPresencesState, marketsState, comments, marketId, myPresence.external_id)) {
      highlightMap[investible.investible.id] = true;
    }
  });
  const presenceMap = getPresenceMap(marketPresencesState, marketId);
  const tourSteps = inviteStoriesWorkspaceSteps(cognitoUser);
  const isMarketOwner = marketCreatedBy === myPresence.id;

  useEffect(() => {
    if (startTourNow === true) {
      tourDispatch(startTour(INVITE_STORIES_WORKSPACE_FIRST_VIEW));
    }
  }, [startTourNow, tourDispatch]);

  useEffect(() => {
    function hasMarketTodo() {
      return !_.isEmpty(unResolvedMarketComments.find(comment => comment.comment_type === TODO_TYPE));
    }
    if (startTourNow === undefined && !_.isEmpty(marketSubType) && isMarketOwner && !isChannel && hasMarketTodo()) {
      setStartTourNow(true);
    }
  }, [marketSubType, isMarketOwner, unResolvedMarketComments, isChannel, startTourNow]);

  function onClickFurther() {
    const link = formMarketAddInvestibleLink(marketId);
    navigate(history, link);
  }
  return (
    <Screen
      title={marketName}
      hidden={hidden}
      tabTitle={marketName}
      breadCrumbs={breadCrumbs}
      banner={banner}
    >
      <UclusionTour
        name={INVITE_STORIES_WORKSPACE_FIRST_VIEW}
        hidden={hidden}
        steps={tourSteps}
      />
      <DismissableText textId='planningEditHelp' />
      <div id="workspaceMain">
        <Summary market={market} hidden={hidden} activeMarket={activeMarket} inArchives={inArchives} />
      </div>
      {lockedBy && myPresence.id !== lockedBy && isAdmin && !inArchives && (
        <Typography>
          {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
        </Typography>
      )}
      <dl className={clsx(metaClasses.root, metaClasses.flexRow)}>
        <div id="viewArchive" className={clsx(metaClasses.group, metaClasses.assignments)}>
          <ViewArchiveActionButton key="archives" marketId={marketId} />
        </div>
      </dl>
      {!isChannel && (
        <DismissableText textId='stageHelp' textId1='stageHelp1' textId2='stageHelp2' textId3='stageHelp3'
                         textId4='stageHelp4'/>
      )}
      <LocalPlanningDragContext.Provider value={[beingDraggedHack, setBeingDraggedHack]}>
        {!_.isEmpty(blockedInvestibles) && (
          <SubSection
            type={SECTION_TYPE_SECONDARY_WARNING}
            title={intl.formatMessage({ id: 'blockedHeader' })}
            helpTextId="blockedSectionHelp"
          >
            <ArchiveInvestbiles
              elevation={0}
              marketId={market.id}
              presenceMap={getPresenceMap(marketPresencesState, market.id)}
              investibles={blockedInvestibles}
              presenceId={myPresence.id}
              stage={inBlockingStage}
              allowDragDrop
              comments={comments}
            />
            <hr/>
          </SubSection>
        )}
        {!_.isEmpty(requiresInputInvestibles) && (
          <SubSection
            type={SECTION_TYPE_SECONDARY_WARNING}
            title={intl.formatMessage({ id: 'requiresInputHeader' })}
            helpTextId="requiresInputSectionHelp"
          >
            <ArchiveInvestbiles
              comments={comments}
              elevation={0}
              marketId={marketId}
              presenceMap={presenceMap}
              investibles={requiresInputInvestibles}
              highlightMap={highlightMap}
              stage={requiresInputStage}
              presenceId={myPresence.id}
              allowDragDrop
            />
          </SubSection>
        )}
        {!isChannel && (
          <div id="swimLanes">
            <InvestiblesByPerson
              comments={comments}
              investibles={investibles}
              marketId={marketId}
              marketPresences={assignablePresences}
              visibleStages={visibleStageIds}
              acceptedStage={acceptedStage}
              inDialogStage={inDialogStage}
              inBlockingStage={inBlockingStage}
              inReviewStage={inReviewStage}
              inVerifiedStage={inVerifiedStage}
              requiresInputStage={requiresInputStage}
              activeMarket={activeMarket}
              isAdmin={isAdmin}
            />
          </div>
        )}
        <SubSection
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'readyFurtherWorkHeader' })}
          actionButton={
            <ExpandableAction
              icon={<AddIcon htmlColor="white"/>}
              label={intl.formatMessage({ id: 'createFurtherWorkExplanation' })}
              openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel'})}
              onClick={onClickFurther}
              useWhiteText
              disabled={!isAdmin}
              tipPlacement="top-end"
            />
          }
        >
          <ArchiveInvestbiles
            comments={comments}
            elevation={0}
            marketId={marketId}
            presenceMap={presenceMap}
            investibles={furtherWorkInvestibles}
            stage={furtherWorkStage}
            presenceId={myPresence.id}
            allowDragDrop
          />
        </SubSection>
        {isChannel && (
          <DismissableText textId='storyHelp' />
        )}
        <MarketTodos comments={unResolvedMarketComments} marketId={marketId} />
      </LocalPlanningDragContext.Provider>
      <Grid container spacing={2}>
          <Grid item id="commentAddArea"  xs={12}>
            {!inArchives && (
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                marketId={marketId}
                hidden={hidden}
              />
            )}
            <CommentBox comments={notTodoComments} marketId={marketId} allowedTypes={allowedCommentTypes} />
          </Grid>
      </Grid>
      <MarketLinks links={children|| []} />
    </Screen>
  );
}

PlanningDialog.propTypes = {
  market: PropTypes.object.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketStages: PropTypes.arrayOf(PropTypes.object),
  hidden: PropTypes.bool,
  comments: PropTypes.arrayOf(PropTypes.object),
  myPresence: PropTypes.object.isRequired,
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: []
};

export const useInvestiblesByPersonStyles = makeStyles(
  theme => {
    return {
      root: {
        margin: theme.spacing(1, 0)
      },
      content: {
        padding: theme.spacing(0, 1),
        "&:last-child": {
          paddingBottom: "inherit"
        }
      },
      smallGravatar: {
      },
      header: {
        backgroundColor: theme.palette.grey["300"],
        padding: theme.spacing(1)
      },
      menuButton: {
        width: '100%',
        padding: '12px'
      },
      expansionControl: {
        backgroundColor: '#ecf0f1',
        width: '30%',
        [theme.breakpoints.down('sm')]: {
          width: 'auto'
        }
      },
      expansionControlHome: {
        backgroundColor: '#ecf0f1',
        width: '40%',
        [theme.breakpoints.down('sm')]: {
          width: 'auto'
        }
      },
      fontControl: {
        alignItems: "center",
        textTransform: 'none',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      rightSpace: {
        paddingRight: theme.spacing(1),
      }
    };
  },
  { name: "InvestiblesByPerson" }
);

export function checkInProgressWarning(investibles, myPresence, messagesState) {
  const warnHash = {};
  if (!myPresence.id) {
    return warnHash;
  }
  investibles.forEach((fullInvestible) => {
    const { investible } = fullInvestible;
    const { id } = investible;
    if (findMessageOfTypeAndId(id, messagesState, 'REPORT')
      || findMessageOfType('REPORT_REQUIRED', id, messagesState)) {
      warnHash[id] = true;
    }
  });
  return warnHash;
}

export function checkReviewWarning(investible, comments, excludeTodos) {
  const { id } = investible;
  if (_.isEmpty(comments)) {
    return false;
  }
  const openComments = comments.find((comment) => {
    const { investible_id: investibleId, comment_type: commentType, resolved } = comment;
    if (excludeTodos && commentType === TODO_TYPE) {
      return false;
    }
    return !resolved && id === investibleId && commentType !== REPORT_TYPE && commentType !== REPLY_TYPE
      && commentType !== JUSTIFY_TYPE;
  });
  return !_.isEmpty(openComments);
}

export function checkVotingWarning(investibleId, marketPresences) {
  let count = 0;
  marketPresences.forEach(presence => {
    const userInvestments = getVoteTotalsForUser(presence);
    Object.keys(userInvestments).forEach((investible_id) => {
      if (investible_id === investibleId) {
        count++;
      }
    });
  });
  return count < 1;
}

function InvestiblesByPerson(props) {
  const {
    comments,
    investibles,
    marketId,
    marketPresences,
    visibleStages,
    acceptedStage,
    inDialogStage,
    inBlockingStage,
    inReviewStage,
    requiresInputStage,
    inVerifiedStage,
    activeMarket,
    isAdmin
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const classes = useInvestiblesByPersonStyles();
  const marketPresencesSortedAlmost = _.sortBy(marketPresences, 'name');
  const marketPresencesSorted = _.sortBy(marketPresencesSortedAlmost, function (presence) {
    return !presence.current_user;
  });

  function onClick(id) {
    const link = formMarketAddInvestibleLink(marketId);
    navigate(history, `${link}#assignee=${id}`);
  }

  return marketPresencesSorted.map(presence => {
    const { id, name, email } = presence;
    const { criticalNotificationCount, delayableNotificationCount } = sumNotificationCounts(presence, comments,
      marketPresencesState);
    const myInvestibles = getUserInvestibles(
      id,
      marketId,
      investibles,
      visibleStages,
    );

    return (
      <Card key={id} elevation={0} className={classes.root}>
        <CardHeader
          className={classes.header}
          id={`u${id}`}
          title={
          <div style={{alignItems: "center", display: "flex", flexDirection: 'row'}}>
            <Typography>
              {name}
              <NotificationCountChips id={id} criticalNotifications={criticalNotificationCount}
                                      delayableNotifications={delayableNotificationCount} />
            </Typography>
            <div style={{flexGrow: 1}} />
            <ExpandableAction
              icon={<AddIcon htmlColor="black"/>}
              label={intl.formatMessage({ id: 'createAssignmentExplanation' })}
              openLabel={intl.formatMessage({ id: 'createAssignment'})}
              onClick={() => onClick(id)}
              disabled={!isAdmin}
              tipPlacement="top-end"
            />
          </div>}
          avatar={<Gravatar className={classes.smallGravatar} email={email} name={name}/>}
          titleTypographyProps={{ variant: "subtitle2" }}
        />
        <CardContent className={classes.content}>
          {marketId &&
            acceptedStage &&
            inDialogStage &&
            inReviewStage &&
            inVerifiedStage &&
            inBlockingStage && (
              <PlanningIdeas
                investibles={myInvestibles}
                marketId={marketId}
                acceptedStage={acceptedStage}
                inDialogStageId={inDialogStage.id}
                inReviewStageId={inReviewStage.id}
                inBlockingStageId={inBlockingStage.id}
                inRequiresInputStageId={requiresInputStage.id}
                inVerifiedStageId={inVerifiedStage.id}
                activeMarket={activeMarket}
                comments={comments}
                presenceId={presence.id}
              />
            )}
        </CardContent>
      </Card>
    );
  });
}

export default PlanningDialog;
