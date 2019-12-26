import React from 'react';
import PropTypes from 'prop-types';
import {Paper, Typography} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
        container: {
            padding: '3px 89px 42px 21px',
            boxShadow: 'none',
            [theme.breakpoints.down('sm')]: {
                padding: '3px 21px 42px 21px',
            }
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            lineHeight: '42px',
            paddingBottom: '9px',
            [theme.breakpoints.down('xs')]: {
                fontSize: 25,
            },
        },
        content: {
            fontSize: 15,
            lineHeight: '175%',
            color: '#414141',
            [theme.breakpoints.down('xs')]: {
                fontSize: 13,
            },
        }
}));

function ArticleCard(props) {
    const { title, content } = props;

    const classes = useStyles();

    return (
        <Paper className={classes.container}>
            <Typography className={classes.title} variant='h3' component='h1'>
                {title}
            </Typography>
            <Typography className={classes.content} component='p'>
                {content}
            </Typography>
        </Paper>
    );
}

ArticleCard.propTypes = {
    title: PropTypes.string,
    content: PropTypes.string,
};

ArticleCard.defaultProps = {
    title: '',
    content: '',
}

export default ArticleCard;