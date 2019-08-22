import React from 'react';
import PropTypes from 'prop-types';
import { ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Typography } from '@material-ui/core';
import { ExpandMoreIcon } from '@material-ui/icons/ExpandMore';

import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';

function MarketsListItem(props) {

  const { market } = props;
  const { name, description } = market;

  return (
    <ExpansionPanel>
      <ExpansionPanelSummary>
        <Typography>{name}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
}

MarketsListItem.propTypes = {
  market: PropTypes.object.isRequired,
};

export default MarketsListItem;
