import { makeStyles } from '@material-ui/core/styles'
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import { useHistory } from 'react-router'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import React, { useContext } from 'react'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { PLACEHOLDER } from '../../../constants/global'
import { getUserInvestibles, getUserSwimlaneInvestiblesHash } from './userUtils'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { navigate } from '../../../utils/marketIdPathFunctions'
import PlanningInvestibleAdd from './PlanningInvestibleAdd'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import { Typography } from '@material-ui/core'
import NotificationCountChips from '../NotificationCountChips'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import Gravatar from '../../../components/Avatars/Gravatar'
import CardContent from '@material-ui/core/CardContent'
import PlanningIdeas from './PlanningIdeas'

export const useInvestiblesByPersonStyles = makeStyles(
  theme => {
    return {
      root: {
        margin: theme.spacing(1, 0)
      },
      content: {
        padding: 0,
        "&:last-child": {
          paddingBottom: "inherit"
        }
      },
      smallGravatar: {
        width: '30px',
        height: '30px',
      },
      header: {
        paddingLeft: theme.spacing(1),
        paddingBottom: 0,
        paddingTop: 0,
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
      fontControl: {
        alignItems: "center",
        textTransform: 'none',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      rightSpace: {
        paddingRight: theme.spacing(1),
      },
      chipStyle: {
        marginRight: '5px',
        backgroundColor: '#E85757'
      },
      chipStyleYellow: {
        marginRight: '5px',
        color: 'black',
        backgroundColor: '#e6e969'
      },
      chipStyleBlue: {
        marginRight: '5px',
        color: 'white',
        backgroundColor: '#2F80ED'
      },
      titleContainer: {
        width: 'auto',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem'
      },
      title: {
        marginLeft: '1rem'
      }
    };
  },
  { name: "InvestiblesByPerson" }
);

function checkInvestibleWarning(investibles, myPresence, warningFunction) {
  const warnHash = {};
  if (!myPresence.id) {
    return warnHash;
  }
  investibles.forEach((fullInvestible) => {
    const { investible } = fullInvestible;
    const { id } = investible;
    if (warningFunction(id)) {
      warnHash[id] = true;
    }
  });
  return warnHash;
}

export function checkInProgressWarning(investibles, myPresence, messagesState) {
  return checkInvestibleWarning(investibles, myPresence,
    (id) => findMessageOfTypeAndId(id, messagesState, 'REPORT')
      || findMessageOfType('REPORT_REQUIRED', id, messagesState));
}

export function checkInApprovalWarning(investibles, myPresence, messagesState) {
  return checkInvestibleWarning(investibles, myPresence,
    (id) => findMessageOfType('NOT_FULLY_VOTED', id, messagesState));
}

export function checkInReviewWarning(investibles, myPresence, messagesState) {
  return checkInvestibleWarning(investibles, myPresence,
    (id) => findMessageOfType('REPORT_REQUIRED', id, messagesState));
}

export function countByType(investible, comments, commentTypes) {
  const { id } = investible;
  if (_.isEmpty(comments)) {
    return 0;
  }
  const openComments = comments.filter((comment) => {
    const { investible_id: investibleId, comment_type: commentType, resolved } = comment;
    return !resolved && id === investibleId && commentTypes.includes(commentType);
  });
  return _.size(openComments);
}

function InvestiblesByPerson(props) {
  const {
    comments,
    investibles,
    visibleStages,
    acceptedStage,
    inDialogStage,
    inBlockingStage,
    inReviewStage,
    requiresInputStage,
    inVerifiedStage,
    group,
    isAdmin,
    mobileLayout,
    pageState, updatePageState
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const metaClasses = useMetaDataStyles();
  const classes = useInvestiblesByPersonStyles();
  const planningInvestibleAddClasses = usePlanFormStyles();
  const { storyAssignee } = pageState;
  const { created_at: createdAt, budget_unit: budgetUnit, use_budget: useBudget, votes_required: votesRequired,
    market_id: marketId} = group;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const marketPresencesSortedAlmost = _.sortBy(presences, 'name');
  const marketPresencesSorted = _.sortBy(marketPresencesSortedAlmost, function (presence) {
    return !presence.current_user;
  });
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);

  function onClick(id) {
    updatePageState({storyAssignee: id});
  }
  return marketPresencesSorted.map(presence => {
        const { id, email, placeholder_type: placeholderType } = presence;
        const name = (presence.name || '').replace('@', ' ');
        const showAsPlaceholder = placeholderType === PLACEHOLDER;
        const myInvestibles = getUserInvestibles(
          id,
          marketId,
          investibles,
          visibleStages
        );

        const myInvestiblesStageHash = getUserSwimlaneInvestiblesHash(myInvestibles, visibleStages, marketId);

        function onInvestibleSave (investible) {
          addInvestible(investiblesDispatch, diffDispatch, investible);
        }

        function onDone (destinationLink) {
          if (destinationLink) {
            navigate(history, destinationLink);
          }
        }

        const myClassName = showAsPlaceholder ? metaClasses.archivedColor : metaClasses.normalColor;
        const { mentioned_notifications: mentions, approve_notifications: approvals, review_notifications: reviews }
          = presence || {};
        if (_.isEmpty(myInvestiblesStageHash) && _.isEmpty(mentions) && _.isEmpty(approvals) && _.isEmpty(reviews)) {
          return <React.Fragment/>
        }
        return (
          <React.Fragment key={`fragsl${id}`}>
            {storyAssignee === id && (
              <PlanningInvestibleAdd
                marketId={marketId}
                groupId={group.id}
                onCancel={() => updatePageState({ storyAssignee: undefined })}
                onSave={onInvestibleSave}
                onSpinComplete={(destinationLink) => {
                  updatePageState({ storyAssignee: undefined });
                  onDone(destinationLink);
                }}
                createdAt={createdAt}
                classes={planningInvestibleAddClasses}
                maxBudgetUnit={budgetUnit}
                useBudget={useBudget ? useBudget : false}
                votesRequired={votesRequired}
                storyAssignee={storyAssignee}
              />
            )}
            <Card id={`sl${id}`} key={id} className={classes.root} elevation={3}>
              <CardHeader
                className={classes.header}
                id={`u${id}`}
                title={
                  <div style={{ alignItems: "center", display: "flex", flexDirection: 'row' }}>
                    <Typography variant="body1" className={myClassName}>
                      {name}
                      {!mobileLayout && (
                        <NotificationCountChips id={id} presence={presence || {}}/>
                      )}
                    </Typography>
                    <div style={{ flexGrow: 1 }}/>
                    <ExpandableAction
                      icon={<AddIcon htmlColor="black"/>}
                      label={intl.formatMessage({ id: 'createAssignmentExplanation' })}
                      openLabel={intl.formatMessage({ id: 'createAssignment' })}
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
                      myInvestiblesStageHash={myInvestiblesStageHash}
                      allInvestibles={investibles}
                      marketId={marketId}
                      acceptedStage={acceptedStage}
                      inDialogStageId={inDialogStage.id}
                      inReviewStageId={inReviewStage.id}
                      inBlockingStageId={inBlockingStage.id}
                      inRequiresInputStageId={requiresInputStage.id}
                      inVerifiedStageId={inVerifiedStage.id}
                      comments={comments}
                      presenceId={presence.id}
                    />
                  )}
              </CardContent>
            </Card>
          </React.Fragment>
        );
      }
  );
}

export default InvestiblesByPerson;