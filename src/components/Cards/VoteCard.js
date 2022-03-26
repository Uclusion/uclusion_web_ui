import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types'
import { Grid, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import useFitText from 'use-fit-text';
import CustomChip from '../CustomChip';
import Chart from './Chart';
import { ISSUE_TYPE } from '../../constants/comments';
import { getCommentTypeIcon } from '../../utils/iconFunctions';
import GravatarGroup from '../Avatars/GravatarGroup';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'grid',
    gridTemplateColumns: 'calc(100% - 260px) 130px 132px',
    width: '100%',
    height: '97px',
    padding: '10px 0',
    background: 'white',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'unset',
      display: 'block',
      height: 'unset'
    },
  },
  gravatarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '132px',
    marginLeft: '3px',
    borderLeft: '1px solid #eaeaea',
  },
  gravatarContainerMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gravatarGroup: {
  },
  smallGravatar: {
    width: '48px',
    height: '48px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '77px',
    margin: '3px',
    padding: '0 20px',
    color: '#3e3e3e',
    borderRight: '1px solid #eaeaea'
  },
  chartContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartValue: {
    fontSize: 14,
    lineHeight: '16px',
    color: '#3e3e3e',
    marginTop: '17px',
  },
  iconGrid: {
    flexWrap: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function VoteCard (props) {
  const { title, comments, votes } = props
  const theme = useTheme()
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'))
  const filteredComments = comments.filter((comment) => !comment.resolved && getCommentTypeIcon(comment.comment_type))
  filteredComments.sort(function (a, b) {
    if (a.comment_type === b.comment_type) {
      return 0
    }
    if (a.comment_type === ISSUE_TYPE) {
      return -1
    }
    if (b.comment_type === ISSUE_TYPE) {
      return -1
    }
    return 0;
  });
  const classes = useStyles();
  const intl = useIntl();
  const issuesComment = filteredComments.length > 0 ? filteredComments[0] : undefined;
  const { fontSize, ref } = useFitText({ maxFontSize: 200 });
  return (
    <div className={classes.container}>
      <div
        ref={ref}
        style={{
          fontSize,
        }}
        className={classes.title}
      >
        {title}
      </div>
      {!mobileLayout && issuesComment && (
        <Grid className={classes.iconGrid} container spacing={1}>
          <Grid item key="issue">
            <CustomChip type={issuesComment.comment_type}/>
          </Grid>
        </Grid>
      )}
      {!mobileLayout && !issuesComment && (
        <div className={classes.chartContent}>
          <Chart data={votes}/>
          <span className={classes.chartValue}>
            {intl.formatMessage({ id: 'numVoting' }, { x: votes.length })}
          </span>
        </div>
      )}
      {votes && (
        <div className={mobileLayout ? classes.gravatarContainerMobile : classes.gravatarContainer}>
          <GravatarGroup
            className={classes.gravatarGroup}
            users={votes}
            max={3}
            gravatarClassName={classes.smallGravatar}/>
        </div>
      )}
    </div>
  );
}

VoteCard.propTypes = {
  title: PropTypes.string,
  comments: PropTypes.arrayOf(PropTypes.object),
  votes: PropTypes.arrayOf(PropTypes.object),
};

VoteCard.defaultProps = {
  title: '',
  comments: [],
  votes: null,
};

export default VoteCard;
