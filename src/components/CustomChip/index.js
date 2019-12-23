import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    chipItemDisable: {
        background: '#dfdfdf',
        color: '#fff',
    },
    chipItemActive: {
        background: '#ca2828',
        color: '#fff',
    },
});

function CustomChip(props) {
    const { active, title } = props;
    const classes = useStyles();
    return (
        <React.Fragment>
            {title && <Chip
                className={(active) ? classes.chipItemActive : classes.chipItemDisable}
                classes={{avatar: (active) ? classes.chipItemActive : classes.chipItemDisable}}
                avatar={<WarningIcon />}
                label={title}
                size="small"
            />}
        </React.Fragment>
    );
}

CustomChip.propTypes = {
    active: PropTypes.bool, 
    title: PropTypes.string,
}

CustomChip.defaultProps = {
    active: false,
    title: '',
}

export default CustomChip;