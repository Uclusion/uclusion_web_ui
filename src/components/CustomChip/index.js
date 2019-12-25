import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { getCommentTypeIcon } from '../../components/Comments/commentFunctions';

const useStyles = makeStyles({
    chipItemDisable: {
        background: '#dfdfdf',
        color: '#fff',
        height: '24px',
    },
    chipItemActive: {
        background: '#ca2828',
        color: '#fff',
        height: '24px',
    },
    avatar: {
        width: '13px',
        height: '11px',
    }
});

function CustomChip(props) {
    const { active, title } = props;
    const classes = useStyles();

    return (
        <React.Fragment>
            {title && <Chip
                className={(active) ? classes.chipItemActive : classes.chipItemDisable}
                classes={{avatar: (active) ? `${classes.chipItemActive} ${classes.avatar}` : `${classes.chipItemDisable} ${classes.avatar}`}}
                avatar={getCommentTypeIcon(title)}
                label={title}
            />}
        </React.Fragment>
    );
}

CustomChip.propTypes = {
    active: PropTypes.bool, 
    title: PropTypes.string,
}

CustomChip.defaultProps = {
    active: true,
    title: '',
}

export default CustomChip;