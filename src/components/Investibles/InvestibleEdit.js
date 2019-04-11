import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton } from '@material-ui/core';
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions';
import { withRouter } from 'react-router';

function InvestibleEdit(props){

  const { investibleId, history } = props;

  function handleClick() {
    const subpath = `investibleEdit/${investibleId}`;
    const editPage = formCurrentMarketLink(subpath);
    history.push(editPage);
  }

  return (
    <IconButton onClick={handleClick}><EditIcon/></IconButton>
  );
}

InvestibleEdit.propTypes = {
  investibleId: PropTypes.string.isRequired,
};

export default withRouter(InvestibleEdit)