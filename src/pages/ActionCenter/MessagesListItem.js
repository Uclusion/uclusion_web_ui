import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router';
import { Button } from '@material-ui/core';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';

function MessagesListItem(props) {
  const history = useHistory();
  const { message } = props;
  const {
    marketId, aType, level, investibleId,
  } = message;
  let linkDest = 'context';
  if (investibleId) {
    // Currently comments come in as investibles so below will be investible
    linkDest = investibleId;
  }
  const link = formInvestibleLink(marketId, linkDest);
  function handleClickItem() {
    navigate(history, link);
  }
  return (
    <ExpansionPanelDetails>
      { `${level}` }
      <Button onClick={handleClickItem}>
        {`${aType}`}
      </Button>
    </ExpansionPanelDetails>
  );
}

MessagesListItem.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  message: PropTypes.object.isRequired,
};

export default MessagesListItem;
