import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Grid, Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import ReadOnlyQuillEditor from '../../components/TextEditors/ReadOnlyQuillEditor';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';

const useStyles = makeStyles(theme => ({
  container: {
      padding: '3px 89px 21px 21px',
      marginTop: '-6px',
      boxShadow: 'none',
      [theme.breakpoints.down('sm')]: {
          padding: '3px 21px 42px 21px',
      }
  },
  title: {
      fontSize: '32px',
      fontWeight: 'bold',
      lineHeight: '42px',
      paddingBottom: '9px',
      [theme.breakpoints.down('xs')]: {
          fontSize: '25px',
      },
  },
  content: {
      fontSize: '15px !important',
      lineHeight: '175%',
      color: '#414141',
      [theme.breakpoints.down('xs')]: {
          fontSize: '13px',
      },
      '& > .ql-container': {
        fontSize: '15px !important',
      }
  }
}));

function Summary(props) {
  const { market, showObservers } = props;
  const intl = useIntl();
  const classes = useStyles();
  const { id, name, description, market_type: marketType } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const marketPresencesObserving = marketPresences.filter((presence) => !presence.following);
  const marketPresencesModerating = marketPresences.filter((presence) => presence.is_admin);

  function displayUserList(presencesList) {
    return presencesList.map((presence) => {
      const { id: presenceId, name } = presence;
      return (
        <Grid
          item
          key={presenceId}
        >
          <Typography>{name}</Typography>
        </Grid>
      )
    });
  }
  return (
    <Paper className={classes.container}>
      <Typography className={classes.title} variant='h3' component='h1'>
        {name}
      </Typography>
      {marketType !== INITIATIVE_TYPE && (
        <ReadOnlyQuillEditor className={classes.content} marketId={id} value={description} />
      )}
      {marketType !== PLANNING_TYPE && Array.isArray(marketPresencesModerating) && (
        <Grid
          container
        >
          <Grid
            item
            xs={2}
            key="createdBy"
          >
            <Typography>
              {intl.formatMessage({ id: 'created_by' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={10}
          >
            {displayUserList(marketPresencesModerating)}
          </Grid>
        </Grid>
      )}
      {showObservers && Array.isArray(marketPresencesObserving) && (
        <Grid
          container
        >
          <Grid
            item
            xs={2}
            key="observers"
          >
            <Typography>
              {intl.formatMessage({ id: 'observers' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={10}
            key="userList"
          >
            {displayUserList(marketPresencesObserving)}
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  showObservers: PropTypes.bool,
};

Summary.defaultProps = {
  showObservers: true,
};

export default Summary;
