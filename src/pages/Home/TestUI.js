import React from 'react';
import { makeStyles } from '@material-ui/core';
import ArticleContainer from '../../containers/ArticleContainer';
import VotesContainer from '../../containers/VotesContainer';
import OptionsContainer from '../../containers/OptionsContainer';
import DiscussionsContainer from '../../containers/DiscussionsContainer';
import { VOTES, OPTIONS, DISCUSSIONS } from '../../constants/TestData';

const useStyles = makeStyles({
    offset_6: {
        marginTop: '30px',
    },
    offset_30: {
        marginTop: '30px',
    },
    offset_56: {
        marginTop: '56px',
    },
    offset_71: {
        marginTop: '71px',
    },
});

function TestUI() {
    const classes = useStyles();

    return (
        <>
            <div className={classes.offset_30}>
                <ArticleContainer />
            </div>
            <div className={classes.offset_30}>
                <VotesContainer data={VOTES}/>
            </div>
            <div className={classes.offset_56}>
                <OptionsContainer data={OPTIONS} />
            </div>
            <div className={classes.offset_71}>
                <DiscussionsContainer data={DISCUSSIONS} />
            </div>
        </>
    );
}

export default TestUI;
