import React from 'react'
import PropTypes from 'prop-types'
import {
  makeStyles, Tooltip
} from '@material-ui/core'
import { useIntl } from 'react-intl'
import Chip from '@material-ui/core/Chip'
import { ReportOutlined } from '@material-ui/icons';
import Approval from '../../components/CustomChip/Approval'


const useStyles = makeStyles(() => ({
  chipStyle: {
    marginLeft: '0.5rem',
    color: 'black',
    backgroundColor: '#ffffff',
    paddingBottom: '0.3rem'
  },
  iconTodo: {
    color: '#F29100'
  },
}));

function NotificationCountChips(props) {
  const { id, mentions, approvals } = props;
  const classes = useStyles();
  const intl = useIntl();

  return (
    <>
      {mentions?.length > 0 && (
        <Tooltip key={`tipmention${id}`}
                 title={intl.formatMessage({ id: 'mentionsExplanation' })}>
          <Chip component="span" icon={<ReportOutlined className={classes.iconTodo}/>} label={`${mentions.length}`}
                size='small' className={classes.chipStyle}/>
        </Tooltip>
      )}
      {approvals?.length > 0 && (
        <Tooltip key={`tipapprov${id}`}
                 title={intl.formatMessage({ id: 'approvalExplanation' })}>
          <Chip component="span" icon={<Approval className={classes.iconTodo}/>}
                label={`${approvals.length}`} size='small' className={classes.chipStyle}/>
        </Tooltip>
      )}
    </>
  );
}

NotificationCountChips.propTypes = {
  id: PropTypes.string.isRequired,
  presence: PropTypes.object.isRequired
};

export default NotificationCountChips;
