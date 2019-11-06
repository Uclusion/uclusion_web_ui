import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { Grid, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import SubSection from '../../containers/SubSection/SubSection';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
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
        <Grid item key={id}>
          <Paper
            className={classes.paper}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <Typography>
              {name}
            </Typography>
            <QuillEditor
              readOnly
              defaultValue={description}
            />
          </Paper>
        </Grid>
      );
    });
  }

  return (
    <SubSection title="Investibles">
      <Grid container spacing={2}>
        {getInvestibles()}
      </Grid>
    </SubSection>
  );

}

Investibles.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

export default Investibles;