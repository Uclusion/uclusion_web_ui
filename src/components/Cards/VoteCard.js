import React from 'react';
import clsx from 'clsx';
import { Textfit } from 'react-textfit';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CustomChip from '../CustomChip';
import { MAX_FONTSIZE } from '../../constants/global';

const useStyles = makeStyles(theme => ({
    container: {
        display: 'grid',
        gridTemplateColumns: 'calc(100% - 96px) 96px',
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
        overflow: 'hidden',
    },
    title: {
        fontWeight: 'bold',
        color: '#3e3e3e',
        margin: '3px',
        maxHeight: '50px',
        minHeight: '50px',
        justifySelf: 'stretch',
        display: 'flex',
        alignItems: 'center',
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
    iconGrid: {
        flexWrap: 'nowrap',
        overflow: 'hidden',
    },
}));

function VoteCard(props) {
    const { title, comments, issuesExist, voteNum, chart } = props;
    const classes = useStyles();
    
    return (
       <div className={classes.container}>
           <div className={classes.content}>
                <Grid className={classes.iconGrid} container spacing={1}>
                    {comments.map((item, index) => (
                        <Grid item key={index} >
                            <CustomChip title={item.comment_type} />
                        </Grid>
                    ))}
                </Grid>
                <Textfit className={clsx(classes.title, {[classes.largeTitle]:!issuesExist})} max={MAX_FONTSIZE} >{title}</Textfit>
           </div>
           <div className={classes.chartContent}>
                <div className={classes.chart}>
                    {chart}
                </div>
                <span className={classes.chartValue}>{voteNum}</span>
           </div>
       </div> 
    );
}

VoteCard.propTypes = {
    title: PropTypes.string, 
    comments: PropTypes.arrayOf(PropTypes.object),
    issuesExist: PropTypes.bool,
    voteNum: PropTypes.number,
    chart: PropTypes.object,
}

VoteCard.defaultProps = {
    title: '',
    comments: [],
    issuesExist: false,
    voteNum: 0,
    chart: null,
}

export default VoteCard;