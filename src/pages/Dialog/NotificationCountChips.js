import React from 'react'
import {
  makeStyles, Tooltip
} from '@material-ui/core'
import { useIntl } from 'react-intl'
import Chip from '@material-ui/core/Chip'
import { ReportOutlined } from '@material-ui/icons';
import Approval from '../../components/CustomChip/Approval'
import { INFO_COLOR, WARNING_COLOR } from '../../components/Buttons/ButtonConstants'


const useStyles = makeStyles(() => ({
  chipStyle: {
    marginLeft: '0.5rem',
    color: 'black',
    backgroundColor: '#ffffff',
    paddingBottom: '0.3rem'
  },
  numChipStyle: {
    paddingRight: '6px',
    paddingLeft: '6px',
    fontSize: '0.75rem'
  },
  oneChipStyle: {
    fontSize: '0.75rem'
  },
  iconTodo: {
    color: '#F29100'
  },
}));

function NotificationCountChips(props) {
  const { id, mentions, approvals,  num, numSuffix } = props;
  const classes = useStyles();
  const intl = useIntl();

  if (num > 0 && numSuffix) {
    const isNew = numSuffix === 'new';
    return <Tooltip key={`countExplanation${numSuffix}`}
    title={intl.formatMessage({ id: numSuffix })}>
      <Chip label={`${num}`} size="small" classes={{labelSmall: num === 1 ? classes.oneChipStyle : classes.numChipStyle}}
      style={{ marginLeft: '5px', backgroundClip: 'padding-box', height: '20px',
      backgroundColor: isNew? WARNING_COLOR : INFO_COLOR, color: isNew ? 'white' : 'black' }}/>
    </Tooltip>;
  }

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

export default NotificationCountChips;
