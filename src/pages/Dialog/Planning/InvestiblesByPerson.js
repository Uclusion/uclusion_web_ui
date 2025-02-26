import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import { useHistory } from 'react-router';
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestibleNav';
import React, { useContext } from 'react';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getGroupPresences,
  getMarketPresences, isAutonomousGroup
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { PLACEHOLDER } from '../../../constants/global';
import { getUserInvestibles, getUserSwimlaneInvestiblesHash } from './userUtils';
import { formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import { Link, Typography, useTheme } from '@material-ui/core';
import NotificationCountChips from '../NotificationCountChips';
import Gravatar from '../../../components/Avatars/Gravatar';
import CardContent from '@material-ui/core/CardContent';
import PlanningIdeas, { usePlanningIdStyles } from './PlanningIdeas';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

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

export function countByType(investible, comments, commentTypes, stageId) {
  const { id } = investible;
  if (_.isEmpty(comments)) {
    return 0;
  }
  const openComments = comments.filter((comment) => {
    const { investible_id: investibleId, comment_type: commentType, resolved, deleted,
      creation_stage_id: creationStageId } = comment;
    if (stageId && creationStageId !== stageId ) {
      return false;
    }
    return !resolved && !deleted && id === investibleId && commentTypes.includes(commentType);
  });
  return _.size(openComments);
}

export const DARKER_LINK_COLOR = '#00468b';

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
    group,
    mobileLayout
  } = props;
  const theme = useTheme();
  const history = useHistory();
  const metaClasses = useMetaDataStyles();
  const classes = useInvestiblesByPersonStyles();
  const swimClasses = usePlanningIdStyles();
  const wizardClasses = wizardStyles();
  const { market_id: marketId, id: groupId } = group || {};
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [messagesState] = useContext(NotificationsContext);
  const { search } = searchResults;
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(presences, groupPresencesState, marketId, groupId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const myGroupPresence = groupPresences.find((presence) => presence.id === myPresence.id);
  const isAutonomous = isAutonomousGroup(groupPresences, group);
  const groupPresencesSortedAlmost = _.sortBy(groupPresences, 'name');
  const groupPresencesSorted = _.sortBy(groupPresencesSortedAlmost, function (presence) {
    return !presence.current_user;
  });

  return (
    <React.Fragment key="investiblesByPerson">
      {(!isAutonomous || !_.isEmpty(myGroupPresence)) && (
        <SpinningButton id="addJob"
                        className={wizardClasses.actionNext}
                        icon={AddIcon} iconColor="black"
                        variant="text" doSpin={false}
                        style={{marginTop: '1rem', marginBottom: '1rem'}}
                        toolTipId='hotKeyTODO'
                        onClick={() => navigate(history, formMarketAddInvestibleLink(marketId, groupId))}>
          <FormattedMessage id='addStoryLabel'/>
        </SpinningButton>
      )}
      {!mobileLayout && (
        <dl className={swimClasses.stages} style={{background: theme.palette.grey['100'], marginTop: '0.5rem'}}>
          {!isAutonomous && (
            <div>
              <Link href="https://documentation.uclusion.com/views/jobs/stages/#assigned" target="_blank"
                    style={{ color: DARKER_LINK_COLOR }}>
                <b><FormattedMessage id="planningVotingStageLabel"/></b>
              </Link>
            </div>
          )}
          <div>
            <Link href="https://documentation.uclusion.com/views/jobs/stages/#approved"
                  target="_blank" style={{ color: DARKER_LINK_COLOR }}>
              <b><FormattedMessage id="planningAcceptedStageLabel"/></b>
            </Link>
          </div>
          <div style={{ flex: '2 1 50%' }}>
            <Link href="https://documentation.uclusion.com/views/jobs/stages/#tasks-complete"
                  target="_blank" style={{color: DARKER_LINK_COLOR}}>
              <b><FormattedMessage id="planningReviewStageLabel"/></b>
            </Link>
          </div>
        </dl>
      )}
      {groupPresencesSorted.map(presence => {
        const { id, email, placeholder_type: placeholderType } = presence;
        const name = (presence.name || '').replace('@', ' ');
        const showAsPlaceholder = placeholderType === PLACEHOLDER;
        const myInvestibles = getUserInvestibles(id, marketId, investibles);
        const myInvestiblesStageHash = getUserSwimlaneInvestiblesHash(myInvestibles, visibleStages, marketId,
          comments, messagesState);
        const myClassName = showAsPlaceholder ? metaClasses.archivedColor : metaClasses.normalColor;
        const { mentioned_notifications: mentions, approve_notifications: approvals } = presence;
        if (_.isEmpty(myInvestiblesStageHash) &&
          ((_.isEmpty(mentions) && _.isEmpty(approvals))||!_.isEmpty(search))) {
          return <React.Fragment key={`investiblesByPerson${id}`}/>
        }
        return (
            <Card id={`sl${id}`} key={id} className={classes.root} elevation={3} style={{marginBottom: '1rem'}}>
              <CardHeader
                className={classes.header}
                id={`u${id}`}
                title={
                  <div style={{ alignItems: "center", display: "flex", flexDirection: 'row' }}>
                    <Typography variant="body1" className={myClassName}>
                      {name}
                      {!mobileLayout && (
                        <NotificationCountChips id={id} presence={presence}/>
                      )}
                    </Typography>
                  </div>}
                avatar={<Gravatar className={classes.smallGravatar} email={email} name={name}/>}
                titleTypographyProps={{ variant: "subtitle2" }}
              />
              <CardContent className={classes.content}>
                {marketId &&
                  acceptedStage &&
                  inDialogStage &&
                  inReviewStage &&
                  inBlockingStage && (
                    <PlanningIdeas
                      myInvestiblesStageHash={myInvestiblesStageHash}
                      marketId={marketId}
                      groupId={groupId}
                      acceptedStage={acceptedStage}
                      inDialogStageId={inDialogStage.id}
                      inReviewStageId={inReviewStage.id}
                      inBlockingStageId={inBlockingStage.id}
                      inRequiresInputStageId={requiresInputStage.id}
                      comments={comments}
                      presenceId={presence.id}
                    />
                  )}
              </CardContent>
            </Card>
        );
      })
    }
    </React.Fragment>
  );
}

export default InvestiblesByPerson;