import React from 'react';
import { FormattedDate, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Card, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

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
        fontSize: '14px',
        lineHeight: '18px',
        color: '#3e3e3e',
        marginTop: '2px',
        marginBottom: '10px',
    },
    title: {
        fontSize: '20px',
        lineHeight: '26px',
        color: '#3e3e3e',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
});

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
                    {comments}
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