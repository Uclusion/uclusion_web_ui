import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton, Tooltip } from '@material-ui/core';
import { injectIntl } from "react-intl";
import { withRouter } from 'react-router';
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions';


function InvestibleEdit(props){

  const { investibleId, history, intl } = props;

  function handleClick() {
    const subpath = `investibleEdit/${investibleId}`;
    const editPage = formCurrentMarketLink(subpath);
    history.push(editPage);
  }

  return (
    <Tooltip title={intl.formatMessage({ id: 'investiblesEditTooltip' })}><IconButton onClick={handleClick}><EditIcon/></IconButton></Tooltip>
  );
}

InvestibleEdit.propTypes = {
  investibleId: PropTypes.string.isRequired,
};

export default injectIntl(withRouter(InvestibleEdit));