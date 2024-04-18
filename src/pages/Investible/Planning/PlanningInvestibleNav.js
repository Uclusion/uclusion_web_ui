import clsx from 'clsx';
import {
  Checkbox,
  FormControlLabel,
  makeStyles,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { ExpandLess, Group, Inbox, SyncAlt } from '@material-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';
import AttachedFilesList from '../../../components/Files/AttachedFilesList';
import React, { useContext } from 'react';
import { Assignments, useCollaborators, rejectInvestible } from './PlanningInvestible';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils';
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper';
import { getCurrentStageLabelId, getStagesInfo } from '../../../utils/stageUtils';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import PropTypes from 'prop-types';
import { attachFilesToInvestible, deleteAttachedFilesFromInvestible, updateInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { UNASSIGNED_TYPE } from '../../../constants/notifications';
import { getFullStage, isBlockedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import IconButton from '@material-ui/core/IconButton';
import { formMarketLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import {
  JOB_APPROVERS_WIZARD_TYPE,
  JOB_ASSIGNEE_WIZARD_TYPE,
  JOB_COLLABORATOR_WIZARD_TYPE, JOB_STAGE_WIZARD_TYPE
} from '../../../constants/markets';
import { useHistory } from 'react-router';
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants';
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { Menu, MenuItem, ProSidebar, SidebarHeader } from 'react-pro-sidebar';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { useAddressed } from '../../../utils/votingUtils';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';

export default function PlanningInvestibleNav(props) {
  const { name, market, marketInvestible, classes, userId, isAssigned,
    pageState, marketPresences, assigned, isInVoting, investibleComments, marketInfo, marketId,
    updatePageState, investibleId } = props;
  const intl = useIntl();
  const history = useHistory();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [groupState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const { stage, required_approvers:  requiredApprovers, open_for_investment: openForInvestment,
    accepted, group_id: groupId } = marketInfo;
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const addressed = useAddressed(groupPresences, marketPresences, investibleId, marketId);
  const group = getGroup(groupState, marketId, groupId) || {};
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const attachedFiles = marketInvestible.investible && marketInvestible.investible.attached_files;
  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(market.id, investibleId, [path]).then((investible) => {
      addInvestible(investiblesDispatch, diffDispatch, investible);
      setOperationRunning(false);
    });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(market.id, investibleId, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  const stagesInfo = getStagesInfo(market.id, marketStagesState, stage);
  const {
    isFurtherWork,
  } = stagesInfo;
  const addressedIds = (addressed || []).filter((address) => !address.abstain)
    .map((address) => address.id);
  const investibleCollaborators = useCollaborators(marketPresences, investibleComments, marketPresencesState,
    investibleId, market.id);
  const assignedNotAccepted = assigned.filter((assignee) => !(accepted || []).includes(assignee));

  function setReadyToStart(isReadyToStart) {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: isReadyToStart,
    };
    setOperationRunning(`readyToStartCheckbox${investibleId}`);
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, diffDispatch, marketStagesState, [UNASSIGNED_TYPE],
        fullStage);
      setOperationRunning(false);
    });
  }
  const headerPaddingBottom = mobileLayout ? '1rem' : undefined;
  return (
    <>
      {mobileLayout && (
        <ProSidebar width="16rem">
          <SidebarHeader>
            <Menu iconShape="circle">
              <MenuItem icon={<Inbox htmlColor="black" />} key="navBackGroup"
                        onClick={() => navigate(history, getInboxTarget())}>
                <span style={{fontSize: '1rem'}}>{intl.formatMessage({ id: 'inbox' })}</span>
              </MenuItem>
              <MenuItem icon={<Group htmlColor="black" />} key="navBackGroup"
                        onClick={() => navigate(history, formMarketLink(marketId, groupId))}>
                <span style={{fontSize: '1rem'}}>{group.name}</span>
              </MenuItem>
            </Menu>
          </SidebarHeader>
        </ProSidebar>
      )}
      <div style={{maxWidth: '11rem', width: '100%', marginTop: mobileLayout ? '1.5rem': undefined}}>
        {name}
      </div>
      <InvesibleCommentLinker investibleId={investibleId} marketId={marketId} />
      {market.id && marketInvestible.investible && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={assigned}
              unaccceptedList={isInVoting ? assignedNotAccepted : undefined}
              toggleIconButton={() => navigate(history,
                formWizardLink(JOB_ASSIGNEE_WIZARD_TYPE, marketId, investibleId))}
              assignmentColumnMessageId='planningInvestibleAssignments'
              toolTipId='storyAddParticipantsLabel'
            />
          </div>
        </div>
      )}
      {market.id && marketInvestible.investible && isFurtherWork && (
        <div className={classes.assignmentContainer} style={{paddingBottom: headerPaddingBottom}}>
          <Tooltip key='readyToStartCheckboxKey'
                   title={<FormattedMessage id='readyToStartExplanation' />}>
            <FormControlLabel
              id='readyToStartCheckbox'
              control={
                <Checkbox
                  id={`readyToStartCheckbox${investibleId}`}
                  value={openForInvestment}
                  disabled={operationRunning !== false || isBlockedStage(fullStage)}
                  checked={operationRunning === `readyToStartCheckbox${investibleId}` ? !openForInvestment :
                    openForInvestment}
                  onClick={() => setReadyToStart(!openForInvestment)}
                />
              }
              label={intl.formatMessage({ id: 'readyToStartCheckboxExplanation' })}
            />
          </Tooltip>
        </div>
      )}
      <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
        <div className={classes.assignmentContainer}>
          <Tooltip
            title={intl.formatMessage({ id: 'collaboratorsExplanation' })}>
            <b><FormattedMessage id="collaborators"/></b>
          </Tooltip>
          <Assignments
            classes={classes}
            marketPresences={marketPresences}
            assigned={investibleCollaborators}
            toolTipId="collaborators"
          />
        </div>
      </div>
      {market.id && marketInvestible.investible && isInVoting && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={requiredApprovers}
              toolTipId='storyApproversLabel'
              toggleIconButton={() => navigate(history,
                formWizardLink(JOB_APPROVERS_WIZARD_TYPE, marketId, investibleId))}
              assignmentColumnMessageId='requiredApprovers'
            />
          </div>
        </div>
      )}
      {!isEveryoneGroup(groupId, marketId) && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={addressedIds}
              toolTipId='storyAddressedLabel'
              toggleIconButton={() => navigate(history,
                formWizardLink(JOB_COLLABORATOR_WIZARD_TYPE, marketId, investibleId))}
              assignmentColumnMessageId='addressed'
            />
          </div>
        </div>
      )}
      <MarketMetaData
        stagesInfo={stagesInfo}
        investibleId={investibleId}
        market={market}
        marketInvestible={marketInvestible}
        isAssigned={isAssigned}
        pageState={pageState}
        updatePageState={updatePageState}
        accepted={accepted || []}
        myUserId={userId}
      />
      {!mobileLayout && (
        <>
          <div style={{paddingBottom: headerPaddingBottom}} />
          <AttachedFilesList
            marketId={market.id}
            onUpload={onAttachFiles}
            onDeleteClick={onDeleteFile}
            attachedFiles={attachedFiles}
          />
        </>
      )}
    </>
  );
}

export const useMetaDataStyles = makeStyles(
  theme => {
    return {
      root: {
        alignItems: "flex-start",
        display: "flex",
        flexDirection: 'column',
        width: '100%',
        '& > div': {
          borderRadius: '6px',
          marginBottom: '1rem'
        }
      },
      flexRow: {
        flexDirection: 'row'
      },
      archivedColor: {
        color: '#ffC000',
      },
      normalColor: {
      },
      archived: {
        color: '#ffC000',
        fontSize: 12,
      },
      highlighted: {
        color: 'red',
        fontSize: 12,
      },
      normal: {
        fontSize: 14,
        wordBreak: 'break-word',
      },
      group: {
        backgroundColor: '#ecf0f1',
        borderRadius: 6,
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(1, 1),
        "&:first-child": {
          marginLeft: 0
        },
        [theme.breakpoints.down("sm")]: {
          backgroundColor: '#fff',
        }
      },
      expiration: {
        "& dd": {
          alignItems: "center",
          display: "flex",
          flex: "1 auto",
          flexDirection: "row",
          fontWeight: "bold",
          [theme.breakpoints.down('sm')]: {
            margin: 0,
          },

        }
      },
      blue: {
        backgroundColor: '#2d9cdb',
      },
      expansionControl: {
        backgroundColor: '#ecf0f1',
        width: '100%'
      },
      fontControl: {
        alignItems: "center",
        textTransform: 'capitalize',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      expirationProgress: {
        marginRight: theme.spacing(1)
      },
      assignments: {
        padding: 0,
        "& ul": {
          flex: 4,
          margin: 0,
          padding: 0
        },
        "& li": {
          display: "inline-flex",
          fontWeight: "bold",
          marginLeft: theme.spacing(1)
        }
      },
      assignmentContainer: {
        width: '100%',
        textTransform: 'capitalize'
      },
      assignIconContainer: {
        display: 'flex',
        justifyContent: 'center'
      },
      assignmentFlexRow: {
        width: '100%',
        display: 'flex',
        padding: '8px'
      },
      flex1: {
        flex: 1
      },
      noPad: {
        padding: 0
      },
      menuButton: {
        width: '100%',
        padding: '12px'
      },
      linkContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      },
      scrollContainer: {
        maxHeight: '210px',
        overflow: 'auto',
      },
      outerBorder: {
        border: '1px solid black',
        borderRadius: '6px 6px 0 0'
      },
      actionPrimary: {
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#e0e0e0'
        },
        '&:disabled': {
          color: 'white',
          backgroundColor: 'rgba(45, 156, 219, .6)'
        }
      },
      actionSecondary: {
        backgroundColor: '#e0e0e0',
        textTransform: 'unset',
        '&:hover': {
          backgroundColor: "#F1F1F1"
        }
      },
    }
  },
  { name: "MetaData" }
);

function MarketMetaData(props) {
  const {
    market,
    marketInvestible,
    investibleId,
    stagesInfo,
    isAssigned,
    accepted,
    myUserId,
    pageState, updatePageState
  } = props;
  const intl = useIntl()
  const {
    showDiff
  } = pageState
  const history = useHistory();
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const classes = useMetaDataStyles();
  const unacceptedAssignment = findMessageOfType('UNACCEPTED_ASSIGNMENT', investibleId, messagesState);
  const unaccepted = unacceptedAssignment && isAssigned && !accepted.includes(myUserId);
  const stageLabelId = getCurrentStageLabelId(stagesInfo);

  function myRejectInvestible() {
    return rejectInvestible(market.id, investibleId, marketInvestible, commentsState, commentsDispatch, invDispatch,
      diffDispatch, marketStagesState, marketPresencesDispatch);
  }

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }

  return (
    <div>
      <div style={{maxWidth: '15rem', marginRight: '1rem'}}>
        <div style={{marginBottom: '0.5rem', display: 'flex', flexDirection: 'row'}}>
          <b><FormattedMessage id={'allowedStagesDropdownLabel'}/></b>
          <Tooltip
            title={intl.formatMessage({ id: 'investibleEditStageHelper' })}
          >
            <IconButton
              style={{paddingTop: 0, marginBottom: 0, paddingBottom: 0, marginTop: '-0.25rem'}}
              onClick={() => navigate(history,
                formWizardLink(JOB_STAGE_WIZARD_TYPE, market.id, investibleId))}
            >
              <SyncAlt htmlColor={ACTION_BUTTON_COLOR}/>
            </IconButton>
          </Tooltip>
        </div>
          {intl.formatMessage({id: stageLabelId})}
      </div>
      {unaccepted && (
        <div style={{display: 'flex', paddingTop: '1rem', marginBottom: 0}}>
          <SpinningButton onClick={myRejectInvestible} className={classes.actionSecondary} id='reject'>
            {intl.formatMessage({ id: 'saveReject' })}
          </SpinningButton>
        </div>
      )}
      {myMessageDescription && diff && (
        <>
          <div style={{paddingTop: '0.5rem'}} />
          <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                   onClick={toggleDiffShow} doSpin={false}>
            <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
          </SpinningIconLabelButton>
        </>
      )}
    </div>
  );
}

MarketMetaData.propTypes = {
  investibleId: PropTypes.string.isRequired,
  market: PropTypes.object.isRequired,
  marketInvestible: PropTypes.object.isRequired,
  stageActions: PropTypes.func,
}