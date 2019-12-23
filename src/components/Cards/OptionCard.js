import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Card, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    container: {
        padding: '20px',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
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
    },
});

function OptionCard(props) {
    const { title, latestDate } = props;
    const classes = useStyles();
    return (
       <Card className={classes.container}>
            <Typography className={classes.latestDate} color="textSecondary" gutterBottom>
                {`Last Updated: ${latestDate}`}
            </Typography>
            <Typography className={classes.title} variant="h5" component="h2">
                {title}
            </Typography>
       </Card> 
    );
}

OptionCard.propTypes = {
    title: PropTypes.string, 
    latestDate: PropTypes.string,
}

OptionCard.defaultProps = {
    title: '',
    latestDate: '',
}

export default OptionCard;