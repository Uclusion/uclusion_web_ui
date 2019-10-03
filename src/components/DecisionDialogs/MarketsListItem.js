import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import {
  ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { formMarketLink } from '../../utils/marketIdPathFunctions';

function MarketsListItem(props) {
  const history = useHistory();
  const { market } = props;
  const { name, id } = market;

  return (
    <ExpansionPanel>
      <ExpansionPanelSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
      >
        <Typography onClick={() => history.push(formMarketLink(id))}>{name}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        Fill this in when we have details for the markets list view
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
}

MarketsListItem.propTypes = {
  market: PropTypes.object.isRequired,
};

export default MarketsListItem;
