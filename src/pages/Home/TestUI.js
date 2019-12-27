import React from 'react';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/core';
import ArticleContainer from '../../containers/ArticleContainer';
import VotesContainer from '../../containers/VotesContainer';
import OptionsContainer from '../../containers/OptionsContainer';
import DiscussionsContainer from '../../containers/DiscussionsContainer';
import { BACKGROUND, VOTES, OPTIONS, DISCUSSIONS } from '../../constants/TestData';

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
    const intl = useIntl();

    return (
        <>
            <div className={classes.offset_30}>
                <ArticleContainer 
                    header={intl.formatMessage({id: 'decisionDialogSummaryLabel'})} 
                    title={BACKGROUND.title} 
                    content={BACKGROUND.content} />
            </div>
            <div className={classes.offset_30}>
                <VotesContainer 
                    header={intl.formatMessage({id: 'decisionDialogCurrentVotingLabel'})}
                    data={VOTES}/>
            </div>
            <div className={classes.offset_56}>
                <OptionsContainer 
                    header={intl.formatMessage({id: 'decisionDialogProposedOptionsLabel'})}
                    data={OPTIONS} />
            </div>
            <div className={classes.offset_71}>
                <DiscussionsContainer 
                    header={intl.formatMessage({id: 'decisionDialogDiscussionLabel'})}
                    data={DISCUSSIONS} />
            </div>
        </>
    );
}

export default TestUI;
