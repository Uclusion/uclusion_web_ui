import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import SubSection from '../../containers/SubSection/SubSection';
import { SECTION_TYPE_SECONDARY } from '../../constants/global';
import DiscussionCard from '../../components/Cards/DiscussionCard';

const useStyles = makeStyles((theme) => ({
   cardGridLayout: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridGap: '6px',
        marginTop: '6px',
    },
}));

function DiscussionContainer(props) {
    const classes = useStyles();
    const { header, data } = props;

    return (
        <SubSection type={SECTION_TYPE_SECONDARY} title={header}>
            <div className={classes.cardGridLayout}>
                {data.map((item, index) => {
                return (
                    <DiscussionCard 
                    key={index}
                    status={item.status} 
                    warning={item.warning} 
                    content={item.content}/>
                    );
                })}
            </div>
        </SubSection>
    );
}

DiscussionContainer.propTypes = {
    header: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object),
};

DiscussionContainer.defaultProps = {
    header: '',
    data: [],
};

export default DiscussionContainer;
