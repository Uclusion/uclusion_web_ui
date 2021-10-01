import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { ACTIVE_STAGE, DECISION_TYPE, INACTIVE_STAGE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { IconButton, makeStyles, Tooltip, useMediaQuery, useTheme } from '@material-ui/core'
import {
  decomposeMarketPath,
  formInvestibleEditLink,
  formMarketEditLink, formMarketManageLink,
  navigate
} from '../../utils/marketIdPathFunctions'
import { useHistory, useLocation } from 'react-router'
import EditMarketButton from '../Dialog/EditMarketButton'
import ChangeToObserverButton from '../Dialog/ChangeToObserverButton'
import ChangeToParticipantButton from '../Dialog/ChangeToParticipantButton'
import ShareStoryButton from '../Investible/Planning/ShareStoryButton'
import ActivateMarketButton from '../Dialog/Planning/ActivateMarketButton'
import SettingsIcon from '@material-ui/icons/Settings'
import { ACTION_BUTTON_COLOR, HIGHLIGHTED_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'
import AlarmAddIcon from '@material-ui/icons/AlarmAdd'
import { useIntl } from 'react-intl'
import PersonAddIcon from '@material-ui/icons/PersonAdd'
import { NotInterested, TrackChanges } from '@material-ui/icons'
import { getInCurrentVotingStage, getInReviewStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { followStages, unFollowStages } from '../../api/markets'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { changeMyPresence } from '../../contexts/MarketPresencesContext/marketPresencesHelper'

const useStyles = makeStyles(() => {
  return {
    buttonHolder: {
      display: 'flex',
      flexDirection: 'row-reverse',
      '& > button': {
        paddingRight: '10px',
        paddingLeft: '10px'
      }
    },
  };
});

function DialogActions(props) {
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const { action } = decomposeMarketPath(pathname);
  const {
    marketId,
    marketStage,
    marketType,
    marketPresences,
    isAdmin,
    isFollowing,
    initiativeId,
    hideEdit,
    beingEdited,
    mySetBeingEdited
  } = props;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || !isFollowing;
  const classes = useStyles();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const { subscribed } = myPresence;
  const isSubscribedToMarket = inVotingStage.id && (subscribed || []).includes(inVotingStage.id) && inReviewStage.id &&
    (subscribed || []).includes(inReviewStage.id);

  function getEditLabel(){
    switch (marketType) {
      case PLANNING_TYPE:
        return 'editMarketButtonPlan';
      case DECISION_TYPE:
        return 'editMarketButtonDecision';
      default:
        return 'editMarketButtonDecision';
    }
  }

  function subscribe() {
    setOperationRunning(true);
    return followStages(marketId, [inVotingStage.id, inReviewStage.id]).then((response) =>{
      setOperationRunning(false);
      const { subscribed } = response;
      const newValues = { subscribed };
      changeMyPresence(mpState, mpDispatch, marketId, newValues);
    });
  }

  function unSubscribe() {
    setOperationRunning(true);
    return unFollowStages(marketId, [inVotingStage.id, inReviewStage.id]).then((response) =>{
      setOperationRunning(false);
      const { subscribed } = response;
      const newValues = { subscribed };
      changeMyPresence(mpState, mpDispatch, marketId, newValues);
    });
  }


  function getActions() {
    const actions = [];
    const editLabel = getEditLabel();
    const editLink = marketType === INITIATIVE_TYPE
      ? formInvestibleEditLink(marketId, initiativeId)
      : formMarketEditLink(marketId);
    const editAction = () => navigate(history, editLink);
    if (!inArchives && !hideEdit) {
      if (isAdmin) {
        if (marketType !== PLANNING_TYPE) {
          actions.push(<Tooltip
            key="adminEditExpiration"
            title={intl.formatMessage({ id: 'dialogEditExpiresLabel' })}
          >
            <IconButton
              id="adminEditExpiration"
              onClick={() => navigate(history, `${formMarketManageLink(marketId)}#expires=true`)}
            >
              <AlarmAddIcon htmlColor={ACTION_BUTTON_COLOR}/>
            </IconButton>
          </Tooltip>)
        }
        if (marketType !== INITIATIVE_TYPE) {
          actions.push(
            <EditMarketButton key="edit" labelId={editLabel} marketId={marketId} onClick={editAction}
                              icon={<SettingsIcon htmlColor={ACTION_BUTTON_COLOR} />}/>
          );
        }
      } else if (marketType === PLANNING_TYPE) {
        if (isSubscribedToMarket) {
          actions.push(<Tooltip
            key="marketGuestUnSubscribe"
            title={intl.formatMessage({ id: 'planningMarketUnSubscribeExplanation' })}
          >
            <IconButton
              id="marketGuestUnSubscribe"
              onClick={unSubscribe}
            >
              <NotInterested htmlColor={ACTION_BUTTON_COLOR} />
            </IconButton>
          </Tooltip>)
        } else {
          actions.push(<Tooltip
            key="marketGuestSubscribe"
            title={intl.formatMessage({ id: 'planningMarketSubscribeExplanation' })}
          >
            <IconButton
              id="marketGuestSubscribe"
              onClick={subscribe}
            >
              <TrackChanges htmlColor={ACTION_BUTTON_COLOR} />
            </IconButton>
          </Tooltip>)
        }
      }
    }
    if (marketStage === INACTIVE_STAGE && isAdmin) {
      actions.push(
        <ActivateMarketButton key="activate-market" marketId={marketId} isFollowing={isFollowing}/>,
      );
    }
    if (activeMarket && (hideEdit || marketType !== PLANNING_TYPE)) {
      if (isFollowing) {
        actions.push(
          <ChangeToObserverButton key="change-to-observer" marketId={marketId} />,
        );
      } else {
        actions.push(
          <ChangeToParticipantButton key="change-to-participant" marketId={marketId}/>,
        );
      }
    }
    if (action === 'dialog' && marketType !== PLANNING_TYPE && !activeMarket) {
      actions.push(<ShareStoryButton key="share-story" marketId={marketId}/>)
    }
    if (!hideEdit) {
      actions.push(<Tooltip
        key="adminManageCollaborators"
        title={intl.formatMessage({ id: 'dialogAddParticipantsLabel' })}
      >
        <IconButton
          id="adminManageCollaborators"
          onClick={() => navigate(history, `${formMarketManageLink(marketId)}#participation=true`)}
        >
          <PersonAddIcon
            htmlColor={marketPresences.length < 2 ? HIGHLIGHTED_BUTTON_COLOR : ACTION_BUTTON_COLOR}/>
        </IconButton>
      </Tooltip>)
    }
    if (!hideEdit && mobileLayout && !beingEdited) {
      actions.push(
        <EditMarketButton
          labelId="edit"
          marketId={marketId}
          onClick={(event) => mySetBeingEdited(true, event)}
        />);
    }
    return actions;
  }

  return (
    <div className={classes.buttonHolder}>
      {getActions()}
    </div>
  );

}

DialogActions.propTypes = {
  marketStage: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  marketType: PropTypes.string.isRequired,
  initiativeId: PropTypes.string,
  isAdmin: PropTypes.bool,
  isFollowing: PropTypes.bool,
  beingEdited: PropTypes.string,
  mySetBeingEdited: PropTypes.func
};

DialogActions.defaultProps = {
  isAdmin: false,
  isFollowing: true,
  initiativeId: '',
  beingEdited: undefined,
  mySetBeingEdited: () => {}
};

export default DialogActions;
