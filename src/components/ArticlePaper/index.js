import React from 'react';
import PropTypes from 'prop-types';
import {Paper, Typography} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
        container: {
            padding: '3px 89px 23px 21px',
            boxShadow: 'none',
        },
        title: {
            fontSize: '32px',
            fontWeight: 'bold',
            lineHeight: '42px',
            paddingBottom: '9px',
        },
        content: {
            fontSize: '15px',
            lineHeight: '175%',
            color: '#414141',
        }
});

function ArticlePaper(props) {
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

ArticlePaper.propTypes = {
    title: PropTypes.string,
    content: PropTypes.string,
};

ArticlePaper.defaultProps = {
    title: 'Test Decision for UI',
    content: 'Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris. Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris.',
}

export default ArticlePaper;