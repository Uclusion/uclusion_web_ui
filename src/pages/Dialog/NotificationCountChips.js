import React from 'react'
import PropTypes from 'prop-types'
import {
  makeStyles, Tooltip
} from '@material-ui/core'
import { useIntl } from 'react-intl'
import Chip from '@material-ui/core/Chip'
import { AssignmentInd, RateReview } from '@material-ui/icons'
import Approval from '../../components/CustomChip/Approval'


const useStyles = makeStyles(() => ({
  chipStyle: {
    marginLeft: '0.5rem',
    color: 'black',
    backgroundColor: '#ffffff',
    paddingBottom: '0.3rem'
  },
  chipStyleNoMargin: {
    color: 'black',
    backgroundColor: '#ffffff',
    paddingBottom: '0.3rem'
  },
  iconTodo: {
    color: '#F29100'
  },
}));

function NotificationCountChips(props) {
  const {
    id,
    presence
  } = props;
  const { mentioned_notifications: mentions, approve_notifications: approvals,
    review_notifications: reviews } = presence;
  const classes = useStyles();
  const intl = useIntl();

  return (
    <>
      {mentions && mentions.length > 0 && (
        <Tooltip key={`tipmention${id}`}
                 title={intl.formatMessage({ id: 'mentionsExplanation' })}>
          <Chip component="span" icon={<AssignmentInd className={classes.iconTodo}/>} label={`${mentions.length}`}
                size='small' className={classes.chipStyle}/>
        </Tooltip>
      )}
      {approvals && approvals.length > 0 && (
        <Tooltip key={`tipapprov${id}`}
                 title={intl.formatMessage({ id: 'approvalExplanation' })}>
          <Chip component="span" icon={<Approval className={classes.iconTodo}/>}
                label={`${approvals.length}`} size='small' className={classes.chipStyle}/>
        </Tooltip>
      )}
      {reviews && reviews.length > 0 && (
        <Tooltip key={`tipreview${id}`}
                 title={intl.formatMessage({ id: 'reviewExplanation' })}>
          <Chip component="span" icon={<RateReview className={classes.iconTodo}/>}
                label={`${reviews.length}`} size='small' className={classes.chipStyleNoMargin}/>
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
