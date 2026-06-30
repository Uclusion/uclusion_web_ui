import React, { useContext, useReducer } from 'react';
import { useIntl } from 'react-intl';
import { formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { JOB_WIZARD_TYPE } from '../../../constants/markets';
import { useInlineWizardLaunch } from '../../../components/InlineWizard/InlineWizardContext';
import _ from 'lodash';
import DismissableText from '../../../components/Notifications/DismissableText';
import BacklogListItem from '../../../components/Cards/BacklogListItem';
import { stripHTML } from '../../../utils/stringFunctions';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import getReducer, { PAGE_SIZE, setPage, setTab } from '../../../components/Comments/BugListContext';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import Chip from '@material-ui/core/Chip';
import { todoClasses } from './MarketTodos';
import { getPaginatedItems } from '../../../utils/messageUtils';
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { Box, IconButton, Typography } from '@material-ui/core';
import { Block, KeyboardArrowLeft } from '@material-ui/icons';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { getNewMessages, isNew } from '../../../components/Comments/Options';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { useCollaborators } from '../../Investible/Planning/PlanningInvestible';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';

function Backlog(props) {
  const {
    group,
    furtherWorkReadyToStart,
    furtherWorkInvestibles,
    notDoingInvestibles = [],
    comments,
    marketPresences,
    singleUser,
    hidden,
    myGroupPresence,
    acceptedStageId,
    inDialogStageId,
    notDoingStageId,
    furtherWorkStageId,
    mobileLayout
  } = props;
  const { market_id: marketId, id: groupId} = group || {};
  const intl = useIntl();
  const wizardClasses = wizardStyles();
  const { openInlineWizard } = useInlineWizardLaunch();
  const history = useHistory();
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = todoClasses();
  const [searchResults] = useContext(SearchResultsContext);
  const { search } = searchResults;
  const isSearchActive = !_.isEmpty(search);
  const [backlogState, backlogDispatch] = useReducer(getReducer(),
    {page: 1, tabIndex: 0, pageState: {}, defaultPage: 1});
  const { tabIndex, page } = backlogState;
  // During search collapse sub-tabs and show all matching backlog items combined - including
  // Not Doing, so the displayed list matches the backlog tab's search count which counts them
  // too (T-all-2233); otherwise a matching Not Doing job is counted but never shown.
  const tabInvestiblesRaw = isSearchActive
    ? [...(furtherWorkReadyToStart || []), ...(furtherWorkInvestibles || []), ...(notDoingInvestibles || [])]
    : (tabIndex === 0 ? furtherWorkReadyToStart
        : (tabIndex === 1 ? furtherWorkInvestibles : notDoingInvestibles));
  const tabInvestibles = _.orderBy(tabInvestiblesRaw, [(inv) => inv.investible.created_at],
    ['desc']);
  const { first, last, data, hasMore, hasLess } = getPaginatedItems(tabInvestibles,
    page, PAGE_SIZE);
  const market = getMarket(marketsState, marketId) || {};
  const isEmptyBacklog = _.isEmpty(furtherWorkInvestibles) && _.isEmpty(furtherWorkReadyToStart)
    && _.isEmpty(notDoingInvestibles);
  const yellowChip = <Chip color="primary" size='small' className={classes.chipStyleYellow} />;
  const blueChip = <Chip color="primary" size='small' className={classes.chipStyleBlue} />;
  const yellowCount = _.size(furtherWorkReadyToStart);
  const unreadYellowCount = _.size(furtherWorkReadyToStart.filter((inv) => isNew(inv, messagesState)));
  const unreadBlueCount = _.size(furtherWorkInvestibles);

  function moveToBacklogState(investibleId, targetOpenForInvestment) {
    // Drop on Ready/Not Ready: if source is currently in further-work stage just toggle open;
    // otherwise (e.g. dragging from Not Doing) stage-change back to further-work.
    const marketInvestible = data.find((inv) => inv.investible.id === investibleId);
    if (!marketInvestible) {
      return;
    }
    const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
    const { stage: currentStageId, open_for_investment: currentOpen } = marketInfo;
    const currentFullStage = getFullStage(marketStagesState, marketId, currentStageId) || {};
    setOperationRunning('readyToStart');
    if (furtherWorkStageId && currentStageId !== furtherWorkStageId) {
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: currentStageId,
          stage_id: furtherWorkStageId,
          open_for_investment: targetOpenForInvestment,
        },
      };
      return stageChangeInvestible(moveInfo).then((fullInvestible) => {
        onInvestibleStageChange(furtherWorkStageId, fullInvestible, investibleId, marketId, undefined,
          undefined, investiblesDispatch, () => {}, marketStagesState,
          undefined, currentFullStage);
        setOperationRunning(false);
      });
    }
    return updateInvestible({
      marketId,
      investibleId,
      openForInvestment: targetOpenForInvestment !== undefined ? targetOpenForInvestment : !currentOpen,
    }).then((fullInvestible) => {
      onInvestibleStageChange(currentStageId, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, () => {}, marketStagesState,
        undefined, currentFullStage);
      setOperationRunning(false);
    });
  }

  function moveToNotDoing(investibleId) {
    if (!notDoingStageId) {
      return;
    }
    const marketInvestible = data.find((inv) => inv.investible.id === investibleId);
    if (!marketInvestible) {
      return;
    }
    const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
    const { stage: currentStageId } = marketInfo;
    if (currentStageId === notDoingStageId) {
      return;
    }
    const currentFullStage = getFullStage(marketStagesState, marketId, currentStageId) || {};
    setOperationRunning('readyToStart');
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: notDoingStageId,
        open_for_investment: false,
      },
    };
    return stageChangeInvestible(moveInfo).then((fullInvestible) => {
      onInvestibleStageChange(notDoingStageId, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, () => {}, marketStagesState,
        undefined, currentFullStage);
      setOperationRunning(false);
    });
  }

  function onDropAble(event) {
    const investibleId = event.dataTransfer.getData('text');
    moveToBacklogState(investibleId, true);
  }

  function onDropConvenient(event) {
    const investibleId = event.dataTransfer.getData('text');
    moveToBacklogState(investibleId, false);
  }

  function onDropNotDoing(event) {
    const investibleId = event.dataTransfer.getData('text');
    moveToNotDoing(investibleId);
  }

  function changePage(byNum) {
    backlogDispatch(setPage(page + byNum));
  }

  if (hidden) {
    return <React.Fragment/>
  }

  return (
    <div id="insideBacklogSection" style={{paddingTop: '1rem', paddingBottom: '5rem'}}>
      <SpinningButton id="addBacklogJob"
                      className={wizardClasses.actionNext}
                      icon={AddIcon} iconColor="black"
                      style={{marginBottom: isEmptyBacklog ? undefined : '1rem', 
                        marginLeft: mobileLayout ? undefined : '0.5rem'}}
                      variant="text" doSpin={false} toolTipId='hotKeyJob'
                      onClick={() => openInlineWizard
                        ? openInlineWizard({ wizardType: JOB_WIZARD_TYPE, marketId, groupId, jobType: tabIndex })
                        : navigate(history, formMarketAddInvestibleLink(marketId, groupId, tabIndex))}>
        {intl.formatMessage({ id: 'addStoryLabel'})}
      </SpinningButton>
      <div style={{paddingBottom: isEmptyBacklog ? '1rem' : undefined}} />
      <DismissableText textId="backlogHelp" isLeft
                       display={isEmptyBacklog}
                       text={market?.market_sub_type === 'SUPPORT' ?
                         <div>
                           No need for backlog - just assign the job to support.
                         </div>
                         :
                         <div>
                           Use the "Add job" button above to create backlog. "Ready to Assign" also displays on the
                           job status page.
                         </div>
                       }/>
      {!isSearchActive && (
        <GmailTabs
          value={tabIndex}
          onChange={(event, value) => {
            backlogDispatch(setTab(value));
          }}
          indicatorColors={['#e6e969', '#2F80ED', '#bdbdbd']}
          style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
          <GmailTabItem icon={yellowChip} label={intl.formatMessage({id: 'readyToStartHeader'})}
                        color='black' tagColor={unreadYellowCount > 0 ? '#E85757' : undefined}
                        tag={unreadYellowCount > 0 ? `${unreadYellowCount}` :
                          (yellowCount > 0 ? `${yellowCount}` : undefined)}
                        tagLabel={unreadYellowCount > 0 ? intl.formatMessage({id: 'new'}) : undefined}
                        onDrop={onDropAble} toolTipId='assignReadyJobsToolTip'
                        onDragOver={(event)=>event.preventDefault()} />
          <GmailTabItem icon={blueChip} label={intl.formatMessage({id: 'notReadyToStartHeader'})}
                        color='black'
                        tag={unreadBlueCount > 0 ? `${unreadBlueCount}` : undefined}
                        onDrop={onDropConvenient} toolTipId='notReadyToolTip'
                        onDragOver={(event)=>event.preventDefault()} />
          <GmailTabItem icon={<Block />} label={intl.formatMessage({id: 'notDoingHeader'})}
                        color='black'
                        onDrop={onDropNotDoing} toolTipId='notDoingBacklogToolTip'
                        onDragOver={(event)=>event.preventDefault()} />
        </GmailTabs>
      )}
      {!_.isEmpty(data) && (
        <div style={{paddingBottom: '0.25rem'}}>
          <div style={{display: 'flex', width: '80%'}}>
            <div style={{flexGrow: 1}}/>
            <Box fontSize={14} color="text.secondary">
              {first} - {last} of {_.size(tabInvestibles)}
              <IconButton disabled={!hasLess} onClick={() => changePage(-1)} >
                <KeyboardArrowLeft />
              </IconButton>
              <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
                <KeyboardArrowRight />
              </IconButton>
            </Box>
          </div>
        </div>
      )}
      {_.isEmpty(data) && !isSearchActive && tabIndex === 0 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'readyToStartHeader'})} is empty.<br/><br/>
          Jobs that need assignment display here.
        </Typography>
      )}
      {_.isEmpty(data) && !isSearchActive && tabIndex === 1 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'notReadyToStartHeader'})} is empty.<br/><br/>
          Jobs that are not ready for assignment display here.
        </Typography>
      )}
      {_.isEmpty(data) && !isSearchActive && tabIndex === 2 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'notDoingHeader'})} is empty.<br/><br/>
          Jobs marked as not doing display here.
        </Typography>
      )}
      {data.map((inv) => {
        return (
          <BacklogItem key={inv.investible.id} inv={inv} comments={comments} marketPresences={marketPresences} marketId={marketId}
                       singleUser={singleUser} myGroupPresence={myGroupPresence} acceptedStageId={acceptedStageId}
                       inDialogStageId={inDialogStageId} notDoingStageId={notDoingStageId}
                       furtherWorkStageId={furtherWorkStageId} />
        );
      })}
    </div>
  )
}

export function BacklogItem(props) {
  const { inv, comments, marketPresences, marketId, singleUser, myGroupPresence, acceptedStageId,
    inDialogStageId, notDoingStageId, furtherWorkStageId, suppressNotifications } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const intl = useIntl();
  const { investible } = inv;
  const investibleComments = comments.filter((comment) => comment.investible_id === investible.id) || [];
  const collaboratorsForInvestibleRaw = useCollaborators(marketPresences, investibleComments, marketPresencesState,
    investible.id, marketId, true);
  const collaboratorsForInvestible = singleUser && _.size(collaboratorsForInvestibleRaw) === 1 ?
    collaboratorsForInvestibleRaw.filter((collaborator) => collaborator.id !== singleUser.id) :
    collaboratorsForInvestibleRaw;
  const marketInfo = getMarketInfo(inv, marketId);
  const { open_for_investment: openForInvestment, stage } = marketInfo || {}
  return (
    <BacklogListItem id={investible.id} title={investible.name} date={intl.formatDate(investible.created_at)}
                     description={stripHTML(investible.description)} openForInvestment={openForInvestment}
                     newMessages={suppressNotifications ? [] : getNewMessages(inv, messagesState)} stage={stage} myGroupPresence={myGroupPresence}
                     acceptedStageId={acceptedStageId} inDialogStageId={inDialogStageId} notDoingStageId={notDoingStageId}
                     furtherWorkStageId={furtherWorkStageId}
                     isSingleUser={!_.isEmpty(singleUser)} marketId={marketId} people={collaboratorsForInvestible} />
  );
}

export default Backlog;