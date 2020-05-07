/**
 * A component that renders a _planning_ dialog
 */
import React, { useContext } from 'react'
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
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { ACTIVE_STAGE } from '../../../constants/markets'
import { getUserInvestibles } from './userUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import InvestibleAddActionButton from './InvestibleAddActionButton'
import DismissableText from '../../../components/Notifications/DismissableText'
import { SECTION_TYPE_SECONDARY } from '../../../constants/global'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import SubSection from '../../../containers/SubSection/SubSection'
import { getInvestiblesInStage } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import clsx from 'clsx'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import ViewArchiveActionButton from './ViewArchivesActionButton'

function PlanningDialog(props) {
  const history = useHistory();
  const {
    market,
    investibles,
    marketPresences,
    marketStages,
    comments,
    hidden,
    myPresence
  } = props;
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();
  const { id: marketId, market_stage: marketStage } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || (myPresence && !myPresence.following);
  const breadCrumbs = inArchives
      ? makeArchiveBreadCrumbs(history)
      : makeBreadCrumbs(history);
  const marketComments = comments.filter(comment => !comment.investible_id);
  const allowedCommentTypes = [QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE];
  const { name: marketName, locked_by: lockedBy } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const acceptedStage = marketStages.find(
    stage => stage.singular_only
  ) || {};
  const inDialogStage = marketStages.find(stage => stage.allows_investment) || {};
  const inReviewStage = marketStages.find(
    stage =>
      !stage.allows_investment && stage.appears_in_context && !stage.singular_only && !stage.allows_issues
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
  const unassignedFull = _.difference(presences, assignedPresences);
  const unassigned = unassignedFull.filter((presence) => !presence.market_banned);

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

  const furtherWorkStage = marketStages.find((stage) => (!stage.appears_in_context && !stage.allows_issues
    && !stage.appears_in_market_summary)) || {};
  const furtherWorkInvestibles = getInvestiblesInStage(investibles, furtherWorkStage.id);
  const presenceMap = getPresenceMap(marketPresencesState, marketId);

  return (
    <Screen
      title={marketName}
      hidden={hidden}
      tabTitle={marketName}
      breadCrumbs={breadCrumbs}
    >
      <Summary market={market} hidden={hidden} unassigned={unassigned} isChannel={isChannel}
               activeMarket={activeMarket} />
      {lockedBy && (
        <Typography>
          {intl.formatMessage({ id: "lockedBy" }, { x: lockedByName })}
        </Typography>
      )}
      <dl className={metaClasses.root}>
        <div className={clsx(metaClasses.group, metaClasses.assignments)}>
          <InvestibleAddActionButton key="investibleadd" onClick={onClick} />
        </div>
        <div className={clsx(metaClasses.group, metaClasses.assignments)}>
          <ViewArchiveActionButton key="archives" marketId={marketId} />
        </div>
      </dl>
      {!isChannel && (
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
        />
      )}
      {!_.isEmpty(furtherWorkInvestibles) && (
        <SubSection
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'readyFurtherWorkHeader' })}
        >
          <ArchiveInvestbiles
            elevation={1}
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
          <Grid item xs={12} style={{ marginTop: '30px' }}>
            {!inArchives && (
              <CommentAddBox
                allowedTypes={allowedCommentTypes}
                marketId={marketId}
              />
            )}
            <CommentBox comments={marketComments} marketId={marketId} allowedTypes={allowedCommentTypes} />
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
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired
};

PlanningDialog.defaultProps = {
  investibles: [],
  marketPresences: [],
  marketStages: [],
  hidden: false,
  comments: []
};

const useInvestiblesByPersonStyles = makeStyles(
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
      }
    };
  },
  { name: "InvestiblesByPerson" }
);

function checkInProgressWarning(investibles, comments, inProgressStageId, userId, marketId) {
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
  const { days_estimate: daysEstimate, updated_at: updatedAt } = marketInfo;
  const useDaysEstimate = daysEstimate || 1;
  if (Date.now() - Date.parse(updatedAt) < 86400000*useDaysEstimate) {
    return false;
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
  } = props;

  const classes = useInvestiblesByPersonStyles();

  return marketPresences.map(presence => {
    const myInvestibles = getUserInvestibles(
      presence.id,
      marketId,
      investibles,
      visibleStages,
    );
    const { id, name } = presence;
    return (
      <Card key={id} className={classes.root}>
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
                acceptedStageId={acceptedStage.id}
                inDialogStageId={inDialogStage.id}
                inReviewStageId={inReviewStage.id}
                inBlockingStageId={inBlockingStage.id}
                comments={comments}
                presenceId={presence.id}
                warnAccepted={checkInProgressWarning(myInvestibles, comments, acceptedStage.id, presence.id, marketId)}
              />
            )}
        </CardContent>
      </Card>
    );
  });
}

export default PlanningDialog;
