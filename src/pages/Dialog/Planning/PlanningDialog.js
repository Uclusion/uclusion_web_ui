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
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { ACTIVE_STAGE, STORIES_SUB_TYPE } from '../../../constants/markets'
import { getUserInvestibles } from './userUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import InvestibleAddActionButton from './InvestibleAddActionButton'
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
import { inviteRequirementsWorkspaceSteps } from '../../../components/Tours/InviteTours/requirementsWorkspace'
import moment from 'moment'
import {
  INVITE_REQ_WORKSPACE_FIRST_VIEW,
  INVITE_STORIES_WORKSPACE_FIRST_VIEW
} from '../../../contexts/TourContext/tourContextHelper'
import { getVoteTotalsForUser } from '../../../utils/userFunctions'

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
  } = props;
  const cognitoUser = useContext(CognitoUserContext);
  const [, tourDispatch] = useContext(TourContext);
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();
  const { id: marketId, market_stage: marketStage } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || (myPresence && !myPresence.following);
  const isAdmin = myPresence.is_admin;
  const breadCrumbs = inArchives
      ? makeArchiveBreadCrumbs(history)
      : makeBreadCrumbs(history);
  const marketComments = comments.filter(comment => !comment.investible_id);
  const allowedCommentTypes = [QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, ISSUE_TYPE];
  const { name: marketName, locked_by: lockedBy } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const acceptedStage = marketStages.find(
    stage => stage.assignee_enter_only
  ) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(
    stage =>
      !stage.allows_investment && stage.appears_in_context && !stage.assignee_enter_only && !stage.allows_issues
  ) || {};
  const inBlockingStage = marketStages.find(
    stage => stage.appears_in_context && stage.allows_issues
  ) || {};
  const visibleStages = [
    inDialogStage.id,
    acceptedStage.id,
    inReviewStage.id,
    inBlockingStage.id
  ];
  const assignedPresences = presences.filter(presence => {
    const assignedInvestibles = getUserInvestibles(
      presence.id,
      marketId,
      investibles,
      visibleStages
    );
    return !_.isEmpty(assignedInvestibles);
  });
  const isChannel = _.isEmpty(assignedPresences);

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

  function onClick() {
    const link = formMarketAddInvestibleLink(marketId);
    navigate(history, link);
  }

  function isStoryWorkspace() {
    const startedAsStory = market && (!market.market_sub_type || market.market_sub_type === STORIES_SUB_TYPE);
    const hasStoriesNow = !_.isEmpty((investibles));
    return startedAsStory || hasStoriesNow;
  }

  const furtherWorkStage = marketStages.find((stage) => (!stage.appears_in_context && !stage.allows_issues
    && !stage.appears_in_market_summary)) || {};
  const requiresInputStage = marketStages.find((stage) => (!stage.appears_in_context && stage.allows_issues
    && stage.allows_todos && !stage.appears_in_market_summary)) || {};
  const furtherWorkInvestibles = getInvestiblesInStage(investibles, furtherWorkStage.id);
  const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id);
  const presenceMap = getPresenceMap(marketPresencesState, marketId);
  const storyWorkspace = isStoryWorkspace();
  const tourName = storyWorkspace ? INVITE_STORIES_WORKSPACE_FIRST_VIEW : INVITE_REQ_WORKSPACE_FIRST_VIEW;
  const tourSteps = storyWorkspace ? inviteStoriesWorkspaceSteps(cognitoUser)
    : inviteRequirementsWorkspaceSteps(cognitoUser);
  useEffect(() => {
    tourDispatch(startTour(tourName));
  }, [tourDispatch, tourName]);

  return (
    <Screen
      title={marketName}
      hidden={hidden}
      tabTitle={marketName}
      breadCrumbs={breadCrumbs}
    >
      <UclusionTour
        name={tourName}
        hidden={hidden}
        steps={tourSteps}
        />
      <div id="workspaceMain">
        <Summary market={market} hidden={hidden} activeMarket={activeMarket} inArchives={inArchives} />
      </div>
      {lockedBy && (
        <Typography>
          {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
        </Typography>
      )}
      <dl className={clsx(metaClasses.root, metaClasses.flexRow)}>
        {!inArchives && isAdmin && (
          <div id="addStory" className={clsx(metaClasses.group, metaClasses.assignments)}>
            <InvestibleAddActionButton key="investibleadd" onClick={onClick} />
          </div>
        )}
        <div id="viewArchive" className={clsx(metaClasses.group, metaClasses.assignments)}>
          <ViewArchiveActionButton key="archives" marketId={marketId} />
        </div>
      </dl>
      {!isChannel && (
        <DismissableText textId='stageHelp' textId1='stageHelp1' textId2='stageHelp2' textId3='stageHelp3'
                         textId4='stageHelp4'/>
      )}
      {!_.isEmpty(requiresInputInvestibles) && (
        <SubSection
          type={SECTION_TYPE_SECONDARY_WARNING}
          title={intl.formatMessage({ id: 'requiresInputHeader' })}
        >
          <ArchiveInvestbiles
            elevation={0}
            marketId={marketId}
            presenceMap={presenceMap}
            investibles={requiresInputInvestibles}
          />
        </SubSection>
      )}
      {!isChannel && (
        <div id="swimLanes">
          <InvestiblesByPerson
            comments={comments}
            investibles={investibles}
            marketId={marketId}
            marketPresences={assignedPresences}
            visibleStages={visibleStages}
            acceptedStage={acceptedStage}
            inDialogStage={inDialogStage}
            inBlockingStage={inBlockingStage}
            inReviewStage={inReviewStage}
            activeMarket={activeMarket}
          />
        </div>
      )}
      {!_.isEmpty(furtherWorkInvestibles) && (
        <SubSection
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'readyFurtherWorkHeader' })}
        >
          <ArchiveInvestbiles
            elevation={0}
            marketId={marketId}
            presenceMap={presenceMap}
            investibles={furtherWorkInvestibles}
          />
        </SubSection>
      )}
      {isChannel && (
        <DismissableText textId='storyHelp' />
      )}
      <Grid container spacing={2}>
          <Grid item id="commentAddArea"  xs={12} style={{ marginTop: '30px' }}>
            {!inArchives && (
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                marketId={marketId}
                isPlanning
              />
            )}
            <CommentBox comments={marketComments} marketId={marketId} allowedTypes={allowedCommentTypes} />
          </Grid>
      </Grid>
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
  hash: PropTypes.string.isRequired,
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

export function checkInProgressWarning(investibles, comments, inProgressStageId, marketId) {
  const inProgressInvestible = investibles.find((investible) => {
    const { market_infos: marketInfos } = investible;
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    return marketInfo !== undefined && marketInfo.stage === inProgressStageId;
  });
  if (!inProgressInvestible) {
    return false;
  }
  const { investible, market_infos: marketInfos } = inProgressInvestible;
  const { id } = investible;
  const marketInfo = marketInfos.find(info => info.market_id === marketId);
  const { days_estimate: daysEstimate, last_stage_change_date: stageEntry, created_at: createdAt } = marketInfo;
  if (Date.now() - Date.parse(stageEntry) < 86400000) {
    // Never any point bothering if less than a day in progress
    return false;
  }
  if (daysEstimate) {
    const dayEstimated = moment(createdAt).add(daysEstimate, 'days').toDate();
    const today = new Date();
    if (today <= dayEstimated) {
      // Also do not bother if we are before the date chosen for completion
      return false;
    }
  }
  if (!comments) {
    return true;
  }
  const progressReportCommentIn24 = comments.find((comment) => {
    const { investible_id: investibleId, comment_type: commentType, created_at: createdAtComment } = comment;
    return id === investibleId && commentType === REPORT_TYPE && (Date.now() - Date.parse(createdAtComment) < 86400000);
  });
  return _.isEmpty(progressReportCommentIn24);
}

export function checkReviewWarning(investible, comments) {
  const { id } = investible;
  if (_.isEmpty(comments)) {
    return false;
  }
  const openComments = comments.find((comment) => {
    const { investible_id: investibleId, comment_type: commentType, resolved } = comment;
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
    activeMarket,
  } = props;
  const classes = useInvestiblesByPersonStyles();
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const marketPresencesSortedAlmost = _.sortBy(marketPresences, 'name');
  const marketPresencesSorted = _.sortBy(marketPresencesSortedAlmost, function (presence) {
    return !presence.current_user;
  });
  return marketPresencesSorted.map(presence => {
    const myInvestibles = getUserInvestibles(
      presence.id,
      marketId,
      investibles,
      visibleStages,
    );
    const { id, name } = presence;
    return (
      <Card key={id} elevation={0} className={classes.root}>
        {/* TODO avatar */}
        <CardHeader
          className={classes.header}
          id={`u${id}`}
          title={name}
          titleTypographyProps={{ variant: "subtitle2" }}
        />
        <CardContent className={classes.content}>
          {marketId &&
            acceptedStage &&
            inDialogStage &&
            inReviewStage &&
            inBlockingStage && (
              <PlanningIdeas
                investibles={myInvestibles}
                marketId={marketId}
                acceptedStage={acceptedStage}
                inDialogStageId={inDialogStage.id}
                inReviewStageId={inReviewStage.id}
                inBlockingStageId={inBlockingStage.id}
                activeMarket={activeMarket}
                comments={comments}
                presenceId={presence.id}
                beingDraggedHack={beingDraggedHack}
                setBeingDraggedHack={setBeingDraggedHack}
              />
            )}
        </CardContent>
      </Card>
    );
  });
}

export default PlanningDialog;
