import React, { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import PlanningIdeas from './PlanningIdeas';
import { useInvestiblesByPersonStyles } from './PlanningDialog'
import { sumNotificationCounts } from './userUtils'
import PropTypes from 'prop-types';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences, getPresenceMap } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import {
  getInvestiblesInStage,
  getMarketInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { ACTIVE_STAGE } from '../../../constants/markets';
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
  getInReviewStage,
  getRequiredInputStage, getVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { Button, Menu, MenuItem, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { FormattedMessage, useIntl } from 'react-intl'
import { extractUsersList, hasNotVoted } from '../../../utils/userFunctions'
import SubSection from '../../../containers/SubSection/SubSection';
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global';
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles';
import Link from '@material-ui/core/Link';
import {
  formMarketAddInvestibleLink,
  formMarketLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import Gravatar from '../../../components/Avatars/Gravatar';
import NotificationCountChips from '../NotificationCountChips'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import Chip from '@material-ui/core/Chip'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import MenuBookIcon from '@material-ui/icons/MenuBook'
export const LocalPlanningDragContext = React.createContext([]);

function InvestiblesByWorkspace (props) {
  const {
    workspaces, setChosenPerson, chosenPerson, workspacesData, setWizardActive, showAddNew, showArchives
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'))
  const midLayout = useMediaQuery(theme.breakpoints.down('md'))
  const classes = useInvestiblesByPersonStyles()
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketsState] = useContext(MarketsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const people = Object.entries(extractUsersList(marketPresencesState, undefined, workspaces, false));
  const sortedPeople = _.sortBy(people, [function (o) {
    const {
      current_user: currentUser
    } = o[1];
    return currentUser;
  }]);
  const processed = {};
  sortedPeople.forEach((entry) => {
    const { name } = entry[1];
    if (processed[name]) {
      processed[name] += 1;
    } else {
      processed[name] = 1;
    }
  });
  const peopleChoices = [sortedPeople.map((entry) => renderParticipantEntry(entry, processed))];
  useEffect(() => {
    if ((!chosenPerson || chosenPerson.external_id === '') && !_.isEmpty(sortedPeople)) {
      setChosenPerson(sortedPeople[0][1]);
    }
    return () => {};
  }, [chosenPerson, setChosenPerson, sortedPeople]);

  function handleClick (event) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose () {
    setAnchorEl(null);
  }

  function renderParticipantEntry(presenceEntry, processed) {
    const {
      name, email, external_id: externalId
    } = presenceEntry[1];
    const itemName = processed[name] > 1 ? `${name} ${email}` : name;
    return (
      <MenuItem key={externalId} onClick={() => {
        setChosenPerson(presenceEntry[1]);
        handleClose();
      }}>
        <div className={classes.rightSpace}>
          <Gravatar
            email={email}
            useBlank
          />
        </div>
        {itemName}
      </MenuItem>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {_.size(peopleChoices) > 0 && _.size(peopleChoices[0]) > 1 && (
          <Button
            endIcon={<ExpandMoreIcon htmlColor={ACTION_BUTTON_COLOR}/>}
            aria-controls="stages-content"
            id="stages-header"
            onClick={handleClick}
          >
            <div className={classes.fontControl}>
              {processed[chosenPerson.name] > 1 ?
                intl.formatMessage({ id: 'displaying' }, { x: chosenPerson.name, y: chosenPerson.email })
                : intl.formatMessage({ id: 'displayingNoEmail' }, { x: chosenPerson.name })}
            </div>
          </Button>
        )}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}>
          {peopleChoices}
        </Menu>

        {showArchives && midLayout && (
          <SpinningIconLabelButton icon={MenuBookIcon} onClick={() => navigate(history, '/archives')}
                                   doSpin={false}>
            <FormattedMessage id={'homeViewArchives'}/>
          </SpinningIconLabelButton>
        )}

        {showAddNew && midLayout && (
          <SpinningIconLabelButton icon={AddIcon} onClick={() => setWizardActive(true)} doSpin={false}>
            <FormattedMessage id={'addNew'}/>
          </SpinningIconLabelButton>
        )}
      </div>
      <LocalPlanningDragContext.Provider value={[beingDraggedHack, setBeingDraggedHack]}>
        {workspacesData.map((data) => {
          const { market, presence, myInvestibles } = data

          function onClick (id) {
            const link = formMarketAddInvestibleLink(market.id)
            navigate(history, `${link}#assignee=${id}`)
          }

          const marketPresences = getMarketPresences(marketPresencesState, market.id)
          const assigningPresenceRaw = marketPresences && marketPresences.find((presence) => presence.current_user)
          const assigningPresence = assigningPresenceRaw || {}
          const comments = getMarketComments(commentsState, market.id);
          const investibles = getMarketInvestibles(investiblesState, market.id, searchResults);
          const acceptedStage = getAcceptedStage(marketStagesState, market.id) || {};
          const inDialogStage = getInCurrentVotingStage(marketStagesState, market.id) || {};
          const inReviewStage = getInReviewStage(marketStagesState, market.id) || {};
          const inBlockingStage = getBlockedStage(marketStagesState, market.id) || {};
          const inVerifiedStage = getVerifiedStage(marketStagesState, market.id) || {};
          const requiresInputStage = getRequiredInputStage(marketStagesState, market.id) || {};
          const { criticalNotificationCount, delayableNotificationCount } = sumNotificationCounts(presence, comments,
            marketPresencesState, messagesState, market.id);
          const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id) || [];
          const blockedInvestibles = getInvestiblesInStage(investibles, inBlockingStage.id) || [];
          const highlightMap = {};
          requiresInputInvestibles.forEach((investible) => {
            if (hasNotVoted(investible, marketPresencesState, marketsState, comments, market.id, chosenPerson.external_id)) {
              highlightMap[investible.investible.id] = true;
            }
          });
          if (_.isEmpty(myInvestibles) && _.isEmpty(requiresInputInvestibles) && _.isEmpty(blockedInvestibles)) {
            return React.Fragment;
          }
          return (
            <Card key={market.id} className={classes.root} elevation={3}>
              <CardHeader
                className={classes.header}
                id={`m${market.id}`}
                title={
                  <div style={{alignItems: "center", display: "flex", flexDirection: 'row'}}>
                    <Typography variant='h6'>
                      <Link color="inherit" id={market.id} key={market.id} href={formMarketLink(market.id)}
                                 onClick={(e) => {
                                   preventDefaultAndProp(e);
                                   navigate(history, formMarketLink(market.id));
                                 }
                                 }>{market.name}</Link>
                      {!mobileLayout && (
                        <NotificationCountChips id={market.id} criticalNotifications={criticalNotificationCount}
                                                delayableNotifications={delayableNotificationCount} />
                      )}
                    </Typography>
                    <div style={{flexGrow: 1}} />
                    <ExpandableAction
                      icon={<AddIcon htmlColor="black"/>}
                      label={intl.formatMessage({ id: 'createAssignmentExplanation' })}
                      openLabel={intl.formatMessage({ id: 'createAssignment'})}
                      onClick={() => onClick(presence.id)}
                      disabled={!assigningPresence.is_admin}
                      tipPlacement="top-end"
                    />
                  </div>
                }
                titleTypographyProps={{ variant: 'subtitle2' }}
              />
              <CardContent className={classes.content}>
                {market.id && !_.isEmpty(myInvestibles) &&
                acceptedStage &&
                inDialogStage &&
                inReviewStage &&
                inVerifiedStage &&
                inBlockingStage && (
                  <PlanningIdeas
                    investibles={myInvestibles}
                    marketId={market.id}
                    acceptedStage={acceptedStage}
                    inDialogStageId={inDialogStage.id}
                    inReviewStageId={inReviewStage.id}
                    inBlockingStageId={inBlockingStage.id}
                    inVerifiedStageId={inVerifiedStage.id}
                    inRequiresInputStageId={requiresInputStage.id}
                    activeMarket={market.market_stage === ACTIVE_STAGE}
                    comments={comments}
                    presenceId={presence.id}
                  />
                )}
                { !_.isEmpty(blockedInvestibles) && (<div style={{ paddingBottom: '15px' }}/>)}
                {!_.isEmpty(blockedInvestibles) && (
                  <SubSection
                    type={SECTION_TYPE_SECONDARY_WARNING}
                    titleIcon={blockedInvestibles.length > 0 && <Chip label={`${blockedInvestibles.length}`}
                                                                      color="primary" size='small'
                                                                      className={classes.chipStyle} />}
                    title={intl.formatMessage({ id: 'blockedHeader' })}
                    helpTextId="blockedSectionHelp"
                  >
                    <ArchiveInvestbiles
                      elevation={0}
                      marketId={market.id}
                      presenceMap={getPresenceMap(marketPresencesState, market.id)}
                      investibles={blockedInvestibles}
                      presenceId={presence.id}
                      stage={inBlockingStage}
                      allowDragDrop
                      comments={comments}
                    />
                  </SubSection>
                )}
                { !_.isEmpty(requiresInputInvestibles) && (<div style={{ paddingBottom: '15px' }}/>)}
                {!_.isEmpty(requiresInputInvestibles) && (
                  <SubSection
                    type={SECTION_TYPE_SECONDARY_WARNING}
                    titleIcon={requiresInputInvestibles.length > 0 && <Chip label={`${requiresInputInvestibles.length}`}
                                                                            color="primary" size='small'
                                                                            className={classes.chipStyle} />}
                    title={intl.formatMessage({ id: 'requiresInputHeader' })}
                    helpTextId="requiresInputSectionHelp"
                  >
                    <ArchiveInvestbiles
                      elevation={0}
                      marketId={market.id}
                      presenceMap={getPresenceMap(marketPresencesState, market.id)}
                      investibles={requiresInputInvestibles}
                      highlightMap={highlightMap}
                      presenceId={presence.id}
                      stage={requiresInputStage}
                      allowDragDrop
                      comments={comments}
                    />
                  </SubSection>
                )}
              </CardContent>
            </Card>
          );
        })}
      </LocalPlanningDragContext.Provider>
    </>
  );
}

InvestiblesByWorkspace.propTypes = {
  workspaces: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InvestiblesByWorkspace;
