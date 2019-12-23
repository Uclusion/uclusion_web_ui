import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import SubSection from '../../containers/SubSection/SubSection';
import { SECTION_TYPE_SECONDARY } from '../../constants/global';
import VoteCard from '../../components/Cards/VoteCard';

const useStyles = makeStyles((theme) => ({
    cardGridLayout: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridGap: '6px',
        marginTop: '6px',
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: '1fr',
        },
    },
}));

function VotesContainer(props) {
    const classes = useStyles();
    const { header, data } = props;

    return (
        <SubSection type={SECTION_TYPE_SECONDARY} title={header}>
            <div className={classes.cardGridLayout}>
                {data.map((item, index) => {
                return (
                    <VoteCard 
                        key={index}
                        title={item.title} 
                        warning={item.warning} i
                        isWarningActive={item.isWarningActive} 
                        voteNum={item.voteNum} c
                        chart={item.chart} />
                    );
                })}
            </div>
        </SubSection>
    );
}

VotesContainer.propTypes = {
    header: PropTypes.string,
    data: PropTypes.array,
};

VotesContainer.defaultProps = {
    header: 'Currently Voting',
    data: [],
};

export default VotesContainer;
