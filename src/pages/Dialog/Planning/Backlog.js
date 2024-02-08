import React, { useContext, useReducer } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import _ from 'lodash';
import DismissableText from '../../../components/Notifications/DismissableText';
import BacklogListItem from '../../../components/Cards/BacklogListItem';
import { stripHTML } from '../../../utils/stringFunctions';
import { calculateInvestibleVoters } from '../../../utils/votingUtils';
import { getCollaboratorsForInvestible, onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import getReducer, { PAGE_SIZE, setPage, setTab } from '../../../components/Comments/BugListContext';
import { GmailTabItem, GmailTabs } from '../../../containers/Tab/Inbox';
import Chip from '@material-ui/core/Chip';
import { todoClasses } from './MarketTodos';
import { getPaginatedItems } from '../../../utils/messageUtils';
import { updateInvestible } from '../../../api/investibles';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { Box, IconButton, Typography } from '@material-ui/core';
import { KeyboardArrowLeft } from '@material-ui/icons';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import { isNew } from '../../../components/Comments/Options';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import AddIcon from '@material-ui/icons/Add';

function Backlog(props) {
  const {
    group,
    furtherWorkReadyToStart,
    furtherWorkInvestibles,
    comments,
    marketPresences
  } = props;
  const { market_id: marketId, id: groupId} = group || {};
  const intl = useIntl();
  const wizardClasses = wizardStyles();
  const history = useHistory();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = todoClasses();
  const [backlogState, backlogDispatch] = useReducer(getReducer(),
    {page: 1, tabIndex: 0, pageState: {}, defaultPage: 1});
  const { tabIndex, page } = backlogState;
  const tabInvestiblesRaw = tabIndex === 0 ? furtherWorkReadyToStart : furtherWorkInvestibles;
  const tabInvestibles = _.orderBy(tabInvestiblesRaw, [(inv) => inv.investible.created_at],
    ['desc']);
  const { first, last, data, hasMore, hasLess } = getPaginatedItems(tabInvestibles,
    page, PAGE_SIZE);
  const isEmptyBacklog = _.isEmpty(furtherWorkInvestibles) && _.isEmpty(furtherWorkReadyToStart);
  const yellowChip = <Chip color="primary" size='small' className={classes.chipStyleYellow} />;
  const blueChip = <Chip color="primary" size='small' className={classes.chipStyleBlue} />;
  const unreadYellowCount = _.size(furtherWorkReadyToStart);
  const unreadBlueCount = _.size(furtherWorkInvestibles);

  function onDrop(investibleId) {
    const marketInvestible = data.find((inv) => inv.investible.id === investibleId);
    const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
    const { stage, open_for_investment: openForInvestment } = marketInfo;
    const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: !openForInvestment,
    };
    setOperationRunning('readyToStart');
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, () => {}, marketStagesState,
        undefined, fullStage);
      setOperationRunning(false);
    });
  }
  function onDropAble(event) {
    const investibleId = event.dataTransfer.getData('text');
    onDrop(investibleId);
  }

  function onDropConvenient(event) {
    const investibleId = event.dataTransfer.getData('text');
    onDrop(investibleId);
  }

  function changePage(byNum) {
    backlogDispatch(setPage(page + byNum));
  }

  return (
    <>
    <div style={{paddingTop: '1rem'}} />
      <SpinningButton id="addBacklogJob"
                      className={wizardClasses.actionNext}
                      icon={AddIcon} iconColor="black"
                      style={{marginBottom: isEmptyBacklog ? undefined : '1rem'}}
                      variant="text" doSpin={false}
                      onClick={() => {
                        navigate(history, formMarketAddInvestibleLink(marketId, groupId, tabIndex));
                      }}>
        <FormattedMessage id='addStoryLabel'/>
      </SpinningButton>
      <DismissableText textId="backlogHelp" noPad={true}
                       display={isEmptyBacklog}
                       text={
                           <div>
                             Use the "Add job" button above to create backlog. "Ready to Start" sends notifications to
                             this group.
                           </div>
                       }/>
      <GmailTabs
        value={tabIndex}
        onChange={(event, value) => {
          backlogDispatch(setTab(value));
        }}
        indicatorColors={['#e6e969', '#2F80ED']}
        style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
        <GmailTabItem icon={yellowChip} label={intl.formatMessage({id: 'readyToStartHeader'})}
                      color='black'
                      tag={unreadYellowCount > 0 ? `${unreadYellowCount}` : undefined}
                      onDrop={onDropAble} toolTipId='readyToStartToolTip'
                      onDragOver={(event)=>event.preventDefault()} />
        <GmailTabItem icon={blueChip} label={intl.formatMessage({id: 'notReadyToStartHeader'})}
                      color='black'
                      tag={unreadBlueCount > 0 ? `${unreadBlueCount}` : undefined}
                      onDrop={onDropConvenient} toolTipId='notReadyToolTip'
                      onDragOver={(event)=>event.preventDefault()} />
      </GmailTabs>
      {!_.isEmpty(data) && (
        <div style={{paddingBottom: '0.25rem', backgroundColor: 'white'}}>
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
      {_.isEmpty(data) && tabIndex === 0 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'readyToStartHeader'})} is empty.<br/><br/>
          Jobs that need assignment display here.
        </Typography>
      )}
      {_.isEmpty(data) && tabIndex === 1 && (
        <Typography style={{marginTop: '2rem', maxWidth: '40rem', marginLeft: 'auto', marginRight: 'auto'}}
                    variant="body1">
          {intl.formatMessage({id: 'notReadyToStartHeader'})} is empty.<br/><br/>
          Jobs that need discussion before assignment display here.
        </Typography>
      )}
      {data.map((inv) => {
        const { investible } = inv;
        const votersForInvestible = calculateInvestibleVoters(investible.id, marketId, marketsState,
          investiblesState, marketPresences);
        const collaboratorsForInvestible = getCollaboratorsForInvestible(investible.id, marketId, comments,
          votersForInvestible, marketPresences, marketPresencesState);
        return (
          <BacklogListItem id={investible.id} title={investible.name} date={intl.formatDate(investible.created_at)}
                           description={stripHTML(investible.description)}
                           isNew={isNew(inv, messagesState)}
                           marketId={marketId} people={collaboratorsForInvestible} />
        );
      })}
    </>
  )
}

export default Backlog;