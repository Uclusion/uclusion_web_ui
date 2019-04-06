/* eslint-disable react/forbid-prop-types */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  Typography,
} from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Button from '@material-ui/core/Button';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  link: {
    textDecoration: 'none',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
  },
  email: {
    marginBottom: theme.spacing.unit,
  },
  grantButton: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    marginTop: theme.spacing.unit * 3,
  },
});

function AdminUserItem(props) {
  const {
    classes,
    user,
    intl,
  } = props;
  const [quantity, setQuantity] = useState(undefined);
  const [gatheringInput, setGatheringInput] = useState(true);
  useEffect(() => {
    const {
      marketId,
      teams,
      setTeams,
      users,
      setUsers,
    } = props;
    if (quantity > 0 && !gatheringInput) {
      const clientPromise = getClient();
      let globalClient;
      clientPromise.then((client) => {
        globalClient = client;
        return client.users.grant(user.id, marketId, quantity);
      }).then(() => {
        const newUser = { ...user };
        newUser.quantity += quantity;
        const newUsers = { ...users };
        newUsers[user.id] = newUser;
        setUsers(newUsers);
        return globalClient.users.getPresences(user.id);
      }).then((teamPresences) => {
        const newTeams = [];
        teamPresences.forEach((team) => {
          const oldTeam = teams.find(item => item.id === team.team_id);
          const newTeam = { ...oldTeam };
          newTeam.quantity += quantity;
          newTeams.push(newTeam);
        });
        setTeams(_.unionBy(newTeams, teams, 'id'));
        setQuantity('');
        setGatheringInput(true);
      }).catch((error) => {
        console.log(error);
        setGatheringInput(true);
        sendIntlMessage(ERROR, { id: 'grantFailed' });
      });
    }
    return () => {};
  }, [quantity, gatheringInput]);
  function handleChange(event) {
    const intValue = parseInt(event.target.value, 10);
    if (intValue > 0 && quantity !== intValue) {
      setQuantity(intValue);
    }
  }
  function handleGrant(event) {
    event.preventDefault();
    setGatheringInput(false);
  }
  return (
    <div>
      <br />
      <Typography>
        {intl.formatMessage({ id: 'grantModalText' })}
      </Typography>
      <form className={classes.container} noValidate autoComplete="off">
        <TextField
          id="quantityToGrant"
          label={intl.formatMessage({ id: 'grantModalQuantityLabel' })}
          className={classes.textField}
          margin="normal"
          type="number"
          value={quantity}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment
                style={{ paddingBottom: 4 }}
                position="start"
              >
                Ȗ
              </InputAdornment>
            ),
          }}
        />
        <Button
          className={classes.grantButton}
          variant="contained"
          color="primary"
          disabled={!(quantity > 0 && gatheringInput)}
          onClick={handleGrant}
        >
          {intl.formatMessage({ id: 'grantButton' })}
        </Button>
      </form>
    </div>
  );
}

AdminUserItem.propTypes = {
  marketId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  setTeams: PropTypes.func, //eslint-disable-line
  user: PropTypes.object.isRequired,
  users: PropTypes.object.isRequired, //eslint-disable-line
  setUsers: PropTypes.func, //eslint-disable-line
  intl: PropTypes.object.isRequired,
};

export default withMarketId(injectIntl(withStyles(styles)(withMarketId(AdminUserItem))));
