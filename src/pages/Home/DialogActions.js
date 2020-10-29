import React from 'react'
import PropTypes from 'prop-types'
import { ACTIVE_STAGE, DECISION_TYPE, INACTIVE_STAGE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { IconButton, makeStyles, Tooltip } from '@material-ui/core'
import {
  decomposeMarketPath,
  formInvestibleEditLink,
  formInvestibleLink,
  formMarketEditLink,
  formMarketLink, formMarketManageLink,
  navigate
} from '../../utils/marketIdPathFunctions'
import { useHistory, useLocation } from 'react-router'
import EditMarketButton from '../Dialog/EditMarketButton'
import ChangeToObserverButton from '../Dialog/ChangeToObserverButton'
import ChangeToParticipantButton from '../Dialog/ChangeToParticipantButton'
import ShareStoryButton from '../Investible/Planning/ShareStoryButton'
import ActivateMarketButton from '../Dialog/Planning/ActivateMarketButton'
import PersonOutlineIcon from '@material-ui/icons/PersonOutline'
import { useIntl } from 'react-intl'
import SettingsIcon from '@material-ui/icons/Settings'
import { ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'

const useStyles = makeStyles(() => {
  return {
    buttonHolder: {
      display: 'flex',
      flexDirection: 'row-reverse',
      '& > button': {
        paddingRight: '15px'
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
    parentMarketId,
    parentInvestibleId,
    isAdmin,
    isFollowing,
    isGuest,
    initiativeId,
    hideEdit,
    beingEdited = false,
    setBeingEdited
  } = props;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || !isFollowing;
  const classes = useStyles();
  const intl = useIntl();

  function goHome() {
    if (action === 'dialog') {
      // If you are on some page that is not in dialog path then stay there
      if (parentMarketId) {
        if (parentInvestibleId) {
          navigate(history, formInvestibleLink(parentMarketId, parentInvestibleId));
        } else {
          navigate(history, formMarketLink(parentMarketId));
        }
      } else {
        navigate(history, '/');
      }
    }
  }


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


  function getActions() {
    const actions = [];
    const editLabel = getEditLabel();
    const editLink = marketType === INITIATIVE_TYPE
      ? formInvestibleEditLink(marketId, initiativeId)
      : formMarketEditLink(marketId);
    const editAction = () => navigate(history, editLink);
    if (isAdmin && !inArchives && !hideEdit) {
      if (!beingEdited) {
        actions.push(
          <EditMarketButton
            labelId="edit"
            marketId={marketId}
            key="editbutton"
            onClick={() => setBeingEdited(true)}
          />);
      }
      if (marketType !== INITIATIVE_TYPE) {
        actions.push(
          <EditMarketButton key="edit" labelId={editLabel} marketId={marketId} onClick={editAction}
                            icon={<SettingsIcon htmlColor={ACTION_BUTTON_COLOR} />}/>
        );
      }
      actions.push(
        <Tooltip
          key="removeParticipantsTooltip"
          title={intl.formatMessage({ id: 'dialogRemoveParticipantsLabel' })}
        >
          <IconButton
            onClick={() => navigate(history, `${formMarketManageLink(marketId)}#removal=true`)}
          >
            <PersonOutlineIcon />
          </IconButton>
        </Tooltip>
      );
    }
    if (marketStage === INACTIVE_STAGE && !isGuest) {
      actions.push(
        <ActivateMarketButton key="activate-market" marketId={marketId} isFollowing={isFollowing}/>,
      );
    }
    if (activeMarket && !isGuest) {
      if (isFollowing) {
        actions.push(
          <ChangeToObserverButton key="change-to-observer" marketId={marketId} onClick={goHome}/>,
        );
      } else {
        actions.push(
          <ChangeToParticipantButton key="change-to-participant" marketId={marketId}/>,
        );
      }
    }
    if (action === 'dialog' && ((marketType === PLANNING_TYPE) || !activeMarket)) {
      actions.push(<ShareStoryButton key="share-story"/>)
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
  isGuest: PropTypes.bool,
};

DialogActions.defaultProps = {
  isAdmin: false,
  isFollowing: true,
  initiativeId: '',
  isGuest: false,
};

export default DialogActions;
