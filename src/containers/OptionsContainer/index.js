import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import SubSection from '../../containers/SubSection/SubSection';
import { SECTION_TYPE_SECONDARY } from '../../constants/global';
import OptionCard from '../../components/Cards/OptionCard';

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

function OptionsContainer(props) {
    const classes = useStyles();
    const { header, data } = props;

    return (
        <SubSection type={SECTION_TYPE_SECONDARY} title={header}>
            <div className={classes.cardGridLayout}>
            {data.map((item, index) => {
                return (
                <OptionCard 
                    key={index}
                    title={item.title} 
                    latestDate={item.latestDate} />
                );
            })}
            </div>
        </SubSection>
    );
}

OptionsContainer.propTypes = {
    header: PropTypes.string,
    data: PropTypes.arrayOf(PropTypes.object),
};

OptionsContainer.defaultProps = {
    header: '',
    data: [],
};

export default OptionsContainer;
