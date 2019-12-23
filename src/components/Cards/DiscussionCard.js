import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Card, CardActions, CardContent, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import CustomChip from '../CustomChip';

const useStyles = makeStyles({
    container: {
        padding: '21px 21px 8px',
        background: 'white',
        boxShadow: 'none',
    },
    chip: {
        marginTop: '12px',
    },
    content: {
        marginTop: '12px',
        fontSize: '15px',
        lineHeight: '175%',
    },
    actions: {
        marginTop: '25px',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    action: {
        width: '89px',
        height: '36px',
        color: 'rgba(0,0,0,0.38)',
        fontWeight: '700',
        fontSize: '14px',
        lineHeight: '18px',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        '&:hover': {
            color: '#ca2828',
            background: 'white',
        }
    },
});

function DiscussionCard(props) {
    const { status, warning, content, onReply, onResolve } = props;
    const classes = useStyles();
    const intl = useIntl();

    return (
        <Card className={classes.container}>
            <CardContent>
                <CustomChip className={classes.chip} active={status} title={warning} />
                <Typography className={classes.content}>
                    {content}
                </Typography>
            </CardContent>
            <CardActions className={classes.actions}>
                <Button className={classes.action} onClick={onReply}>{intl.formatMessage({id: 'issueReplyLabel'})}</Button>
                <Button className={classes.action} onClick={onResolve}>{intl.formatMessage({id: 'issueResolveLabel'})}</Button>
            </CardActions>
        </Card>
    );
}

DiscussionCard.propTypes = {
    status: PropTypes.bool,
    warning: PropTypes.string,
    content: PropTypes.string,
    onReply: PropTypes.func,
    onResolve: PropTypes.func
}

DiscussionCard.defaultProps = {
    status: false,
    warning: '',
    content: '',
    onReplay: () => {},
    onResolve: () => {},
}

export default DiscussionCard;