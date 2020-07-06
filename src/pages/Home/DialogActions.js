import React from 'react'
import PropTypes from 'prop-types'
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { makeStyles } from '@material-ui/core'
import {
  decomposeMarketPath,
  formInvestibleEditLink,
  formInvestibleLink,
  formMarketEditLink,
  formMarketLink,
  navigate
} from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import EditMarketButton from '../Dialog/EditMarketButton'
import ChangeToObserverButton from '../Dialog/ChangeToObserverButton'
import ChangeToParticipantButton from '../Dialog/ChangeToParticipantButton'
import ShareStoryButton from '../Investible/Planning/ShareStoryButton'

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
  const { location } = history;
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
    hideEdit
  } = props;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const inArchives = !activeMarket || !isFollowing;
  const classes = useStyles();

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
      case INITIATIVE_TYPE:
        return 'editMarketButtonInitiative';
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
    if (isAdmin) {
      if (!inArchives && !hideEdit) {
        actions.push(
          <EditMarketButton key="edit" labelId={editLabel} marketId={marketId} onClick={editAction} />
        );
      }
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

    actions.push(<ShareStoryButton />)

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
  isGuest: PropTypes.bool.isRequired,
};

DialogActions.defaultProps = {
  isAdmin: false,
  isFollowing: true,
  initiativeId: '',
};

export default DialogActions;
