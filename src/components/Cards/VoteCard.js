import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Chip } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    container: {
        display: 'grid',
        gridTemplateColumns: '1fr 96px',
        width: '100%',
        padding: '10px 0 10px 20px',
        background: 'white',
        height: '97px',

    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderRight: '1px solid #eaeaea',
    },
    title: {
        fontSize: '10px',
        fontWeight: 'bold',
        lineHeight: '23px',
        color: '#3e3e3e',
    },
    chartContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
    },
    chartValue: {
        fontSize: '14px',
        lineHeight: '16px',
        color: '#3e3e3e',
    },
    chipItemDisable: {
        background: '#dfdfdf',
        color: '#fff',
        opacity: '1',
    },
    chipItemActive: {
        background: '#ca2828',
        color: '#fff',
    },
});

function VoteCard(props) {
    const { title, warning, isWarningActive, voteNum, chart } = props;
    const classes = useStyles();
    
    return (
       <div className={classes.container}>
           <div className={classes.content}>
                {warning && <Chip
                    className={(isWarningActive) ? classes.chipItemActive : classes.chipItemDisable}
                    classes={{avatar: (isWarningActive) ? classes.chipItemActive : classes.chipItemDisable}}
                    avatar={<WarningIcon />}
                    label={warning}
                    size="small"
                />}
                <p className={classes.title}>{title}</p>
           </div>
           <div className={classes.chartContent}>
                <div className={classes.chart}>
                    <img alt='chart' src={chart} />
                </div>
                <span className={classes.chartValue}>{`${voteNum} Votes`}</span>
           </div>
       </div> 
    );
}

VoteCard.propTypes = {
    title: PropTypes.string, 
    warning: PropTypes.string,
    isWarningActive: PropTypes.bool,
    voteNum: PropTypes.number,
    chart: PropTypes.string,
}

VoteCard.defaultProps = {
    title: '',
    warning: '',
    isWarningActive: true,
    voteNum: 0,
    chart: 'images/Uclusion_Vote_Chart1.svg',
}

export default VoteCard;