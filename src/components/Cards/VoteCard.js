import React from 'react';
import clsx from 'clsx';
import { Textfit } from 'react-textfit';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import CustomChip from '../CustomChip';

const useStyles = makeStyles(theme => ({
    container: {
        display: 'grid',
        gridTemplateColumns: '1fr 96px',
        width: '100%',
        height: '97px',
        padding: '10px 0',
        background: 'white',
    },
    content: {
        display: 'grid',
        gridTemplateRows: 'max-content 1fr',
        borderRight: '1px solid #eaeaea',
        padding: '0 20px',
        maxHeight: '100%',
        minHeight: '100%',
        alignItems: 'center',
        justifyItems: 'start',
    },
    title: {
        fontWeight: 'bold',
        color: '#3e3e3e',
        margin: '3px',
        maxHeight: '50px',
        minHeight: '50px',
        justifySelf: 'stretch',
    },
    largeTitle: {
        gridRowStart: '1',
        gridRowEnd: '3',
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
                <Textfit className={clsx(classes.title, {[classes.largeTitle]:!warning})} >{title}</Textfit>
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