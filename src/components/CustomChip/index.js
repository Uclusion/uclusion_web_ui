import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../constants/comments'
import { getCommentTypeIcon } from '../../utils/iconFunctions';

const useStyles = makeStyles({
  chipItem: {
    color: '#fff',
    height: '22px',
    '& .MuiChip-label': {
      fontSize: 12,
    },
    '& .MuiChip-avatar': {
      width: '16px',
      height: '14px',
      color: '#fff',
    },
  },
  chipItemQuestion: {
    background: '#2F80ED',
  },
  chipItemIssue: {
    background: '#E85757',
  },
  chipItemSuggestion: {
    background: '#F29100',
  },
});

function CustomChip(props) {
  const { type } = props;
  const classes = useStyles();
  const intl = useIntl();

  return (
    <Chip
      className={
        type === ISSUE_TYPE
          ? `${classes.chipItem} ${classes.chipItemIssue}`
          : type === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
          : `${classes.chipItem} ${classes.chipItemSuggestion}`
      }
      avatar={getCommentTypeIcon(type)}
      label={intl.formatMessage({ id: `${type.toLowerCase()}Present` })}
    />
  );
}

CustomChip.propTypes = {
  type: PropTypes.string,
};

CustomChip.defaultProps = {
  type: '',
};

export default CustomChip;
