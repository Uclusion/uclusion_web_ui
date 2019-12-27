import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import RaisedCard from '../../../components/Cards/RaisedCard';
import OptionCard from '../../../components/Cards/OptionCard';

const useStyles = makeStyles(theme => ({
  investibleCard: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },
}));

function ProposedIdeas(props) {
  const history = useHistory();
  const classes = useStyles();
  const { investibles, marketId, comments } = props;
  
  function getInvestibles() {
    return investibles.map((inv) => {
      const { investible } = inv;
      const { id, name } = investible;
      const investibleComments = Array.isArray(comments)
        && comments.filter((comment) => comment.investible_id === id);
      return (
        <Grid
          item
          key={id}
          xs={12}
          sm={6}
        >
          <RaisedCard
            className={classes.investibleCard}
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <OptionCard 
              title={name} 
              latestDate={investible.updated_at}
              comments={investibleComments} />
          </RaisedCard>
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

ProposedIdeas.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

export default ProposedIdeas;