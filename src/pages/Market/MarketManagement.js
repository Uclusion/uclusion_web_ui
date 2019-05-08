/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import {
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardActions,
} from '@material-ui/core';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import Activity from '../../containers/Activity/Activity';
import { receiveMarket } from '../../store/Markets/actions';

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
  row: {
    marginBottom: theme.spacing.unit * 2,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  actions: {
    padding: theme.spacing.unit * 2,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: theme.palette.grey[300],
  },
  textarea: {
    minHeight: 160,
  },
  fullWidth: {
    width: '100%',
  },
});

function MarketManagement(props) {
  const {
    intl,
    classes,
    marketId,
    dispatch,
  } = props;
  const [market, setMarket] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.markets.get(marketId))
      .then((m) => {
        setMarket(m);
        dispatch(receiveMarket(m));
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
      });
  }, [marketId]);

  function handleChange(name) {
    return (event) => {
      const { value, checked } = event.target;
      const checkboxNames = [
        'is_public_signup',
      ];
      if (checkboxNames.includes(name)) {
        setMarket({
          ...market,
          [name]: checked,
        });
      } else {
        setMarket({
          ...market,
          [name]: value,
        });
      }
      setDirty(true);
    };
  }

  function onSave() {
    setDirty(false);

    const { name, description, is_public_signup } = market;
    const updateOptions = {
      name,
      description,
      is_public_signup,
    };

    const clientPromise = getClient();
    clientPromise.then(client => client.markets.updateMarket(marketId, updateOptions))
      .then(() => {
        dispatch(receiveMarket({ ...market, ...updateOptions }));
        sendIntlMessage(SUCCESS, { id: 'marketEditSuccess' });
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'marketEditFailed' });
      });
  }

  return (
    <Activity
      isLoading={Object.keys(market).length === 0}
      containerStyle={{ overflow: 'hidden' }}
      title={intl.formatMessage({ id: 'marketEditHeader' })}
    >
      <div className={classes.root}>
        <Card>
          <CardContent>
            <TextField
              className={classes.row}
              inputProps={{ maxLength: 255 }}
              InputLabelProps={{ shrink: true }}
              id="name"
              label={intl.formatMessage({ id: 'titleLabel' })}
              margin="normal"
              fullWidth
              value={market.name}
              onChange={handleChange('name')}
            />
            <TextField
              className={classes.row}
              InputLabelProps={{ shrink: true }}
              id="description"
              label={intl.formatMessage({ id: 'descriptionLabel' })}
              margin="normal"
              fullWidth
              multiline
              rows={5}
              value={market.description}
              onChange={handleChange('description')}
            />
            <FormControlLabel
              className={classes.fullWidth}
              control={(
                <Checkbox
                  checked={market.is_public_signup}
                  onChange={handleChange('is_public_signup')}
                  value="is_public_signup"
                  color="primary"
                />
              )}
              label="Login modal shows sign up"
              fullWidth
            />
            <FormControlLabel
              className={classes.fullWidth}
              control={(
                <Checkbox
                  checked={false}
                  value="allow_anonymous"
                  color="primary"
                />
              )}
              label="Turn on anonymous access"
            />
          </CardContent>
          <CardActions className={classes.actions}>
            <Button
              variant="contained"
              color="primary"
              disabled={!dirty}
              onClick={onSave}
            >
              {intl.formatMessage({ id: 'save' })}
            </Button>
          </CardActions>
        </Card>
      </div>
    </Activity>
  );
}

MarketManagement.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  //
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(injectIntl(withMarketId(MarketManagement))));
