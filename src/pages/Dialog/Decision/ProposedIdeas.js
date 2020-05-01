import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { CardContent, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import RaisedCard from '../../../components/Cards/RaisedCard'
import OptionCard from '../../../components/Cards/OptionCard'

const useStyles = makeStyles((theme) => ({
  textData: {
    fontSize: 12,
  },
  noPadding: {
    padding: theme.spacing(0),
    "&:last-child": {
      padding: 0
    }
  },
}));

function ProposedIdeas(props) {
  const history = useHistory();
  const classes = useStyles();
  const { investibles, marketId } = props;
  
  function getInvestibles() {
    return investibles.map((inv) => {
      const { investible } = inv;
      const { id, name } = investible;
      return (
        <Grid
          item
          key={id}
          xs={12}
          sm={6}
        >
          <RaisedCard
            className="raisedcard"
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
          >
            <CardContent className={classes.noPadding}>
              <OptionCard
                title={name}
                latestDate={investible.updated_at} />
            </CardContent>
          </RaisedCard>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={1}>
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