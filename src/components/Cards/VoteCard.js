import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import CustomChip from '../CustomChip';

const useStyles = makeStyles(theme => ({
    container: {
        display: 'grid',
        gridTemplateColumns: '1fr 96px',
        width: '100%',
        padding: '10px 0',
        background: 'white',
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        borderRight: '1px solid #eaeaea',
        padding: '0 20px',
    },
    title: {
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'bold',
        lineHeight: '23px',
        color: '#3e3e3e',
        [theme.breakpoints.down('xs')]: {
            fontSize: '15px',
        },
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
}));

function VoteCard(props) {
    const { title, warning, isWarningActive, voteNum, chart } = props;
    const classes = useStyles();
    
    return (
       <div className={classes.container}>
           <div className={classes.content}>
                <CustomChip active={isWarningActive} title={warning} />
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