import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { Grid, Paper, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import SubSection from '../../containers/SubSection/SubSection';

const useStyles = makeStyles(theme => ({
  investibleCard: {
    padding: theme.spacing(2),
    textAlign: 'left',
    height: '8vh',
  },
}));

function Investibles(props) {
  const history = useHistory();
  const classes = useStyles();
  const { investibles, marketId } = props;

  function getInvestibles() {
    return investibles.map((inv) => {
      const { investible } = inv;
      const { id, name, description } = investible;
      return (
        <Grid
          item
          key={id}
          xs={12}
          s={6}
          md={4}
        >
          <Paper
            className={classes.investibleCard}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <Typography
              noWrap
            >
              {name}
            </Typography>
            <Box
              color="text.secondary"
              className={classes.description}
              height="60%"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              <QuillEditor
                readOnly
                defaultValue={description}
              />
            </Box>
          </Paper>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={4}>
      {getInvestibles()}
    </Grid>
  );

}

Investibles.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

export default Investibles;