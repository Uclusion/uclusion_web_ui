import React from 'react';
import { FormattedDate, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Card, Typography, Badge } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import RateReviewIcon from '@material-ui/icons/RateReview';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';

const useStyles = makeStyles({
    container: {
        padding: '20px',
        display: 'grid',
        gridTemplateRows: 'auto 1fr 30px',
        boxShadow: 'none',
    },
    containerNoComments: {
        padding: '20px',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        boxShadow: 'none',
    },
    latestDate: {
        fontSize: 14,
        lineHeight: '18px',
        color: '#3e3e3e',
        marginTop: '2px',
        marginBottom: '10px',
    },
    title: {
        fontSize: 20,
        lineHeight: '26px',
        color: '#3e3e3e',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
});

function getCommentIcons(comments) {
    if (!Array.isArray(comments)) {
      return;
    }
    const issues = comments.filter((comment) => comment.type === ISSUE_TYPE);
    const questions = comments.filter((comment) => comment.type === QUESTION_TYPE);
    const suggestions = comments.filter((comment) => comment.type === SUGGEST_CHANGE_TYPE);
    const icons = [];
    if (Array.isArray(issues) && issues.length > 0) {
      icons.push(
        <Badge badgeContent={issues.length} color="primary" id="issues">
          <AnnouncementIcon />
        </Badge>
      );
    }
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      icons.push(
        <Badge badgeContent={suggestions.length} color="primary" id="suggestions">
          <RateReviewIcon />
        </Badge>
      );
    }
    if (Array.isArray(questions) && questions.length > 0) {
      icons.push(
        <Badge badgeContent={questions.length} color="primary" id="questions">
          <LiveHelpIcon />
        </Badge>
      );
    }
  }

function OptionCard(props) {
    const { title, comments, latestDate } = props;
    const classes = useStyles();
    const intl = useIntl();
    const updatedText = intl.formatMessage(({ id: 'decisionDialogInvestiblesUpdatedAt' }));
    
    return (
       <Card className={comments.length? classes.container : classes.containerNoComments }>
            <Typography className={classes.latestDate} color="textSecondary" gutterBottom>
                {updatedText}<FormattedDate value={latestDate} />
            </Typography>
            <Typography className={classes.title} variant="h5" component="h2">
                {title}
            </Typography>
            {comments.length > 0 && (
                <React.Fragment>
                    {getCommentIcons(comments)}
                </React.Fragment>
            )}
       </Card> 
    );
}

OptionCard.propTypes = {
    title: PropTypes.string, 
    latestDate: PropTypes.instanceOf(Date),
    comments: PropTypes.arrayOf(PropTypes.object),
}

OptionCard.defaultProps = {
    title: '',
    latestDate: '',
    comments: [],
}

export default OptionCard;