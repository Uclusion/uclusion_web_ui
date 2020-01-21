import React from 'react';
import PropTypes from 'prop-types';
import DismissMarketButton from './DismissMarketButton';
import HideMarketButton from './HideMarketButton';
import ShowMarketButton from './ShowMarketButton';
import { PLANNING_TYPE } from '../../constants/markets';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => {
  return {
    buttonHolder: {
      display: 'flex',
      flexDirection: 'row',
    },
  };
});

function DialogActions(props) {

  const {
    marketId,
    marketStage,
    marketType,
    isAdmin,
    inArchives,
  } = props;

  const classes = useStyles();

  function getActions() {
    const actions = [];
    if (isAdmin) {
      if (marketStage === 'Active') {
        actions.push(
          <DismissMarketButton key="archive" marketId={marketId}/>,
        );
      }
      if (!inArchives && (marketType === PLANNING_TYPE || marketStage !== 'Active')) {
        actions.push(
          <HideMarketButton key="leave" marketId={marketId}/>,
        );
      } else if (inArchives) {
        actions.push(
          <ShowMarketButton key="enter" marketId={marketId}/>,
        );
      }
    } else if (!inArchives) {
      actions.push(
        <HideMarketButton key="leave" marketId={marketId}/>,
      );
    } else {
      actions.push(
        <ShowMarketButton key="enter" marketId={marketId}/>
      );
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
  isAdmin: PropTypes.bool.isRequired,
  inArchives: PropTypes.bool.isRequired,
};

export default DialogActions;
