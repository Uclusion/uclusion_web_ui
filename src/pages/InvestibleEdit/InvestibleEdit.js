import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import {
  TextField,
  Typography,
} from '@material-ui/core';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';
import StageSelectList from './StageSelectList';

import { withMarketId } from '../../components/PathProps/MarketId';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import Activity from '../TeamMemberships/UserMemberships';

const styles = theme => ({
  flex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  row: {
    marginBottom: theme.spacing.unit,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  textField: {
    margin: 0,
    marginBottom: theme.spacing.unit,
  },
  stageLabel: {
    minWidth: 100,
  },
  stageContent: {
    flex: 1,
  },
  numSharesText: {
    fontSize: 12,
  },

});

function InvestibleEdit(props) {
  const {
    match,
    marketId,
    classes,
    intl,
  } = props;
  const { investibleId } = match.params;
  const [investible, setInvestible] = useState({});

  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.markets.getMarketInvestibles(marketId, [investibleId]))
      .then((investibles) => {
        setInvestible(investibles[0]);
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'investibleEditInvestibleFetchFailed' });
      });
  }, [marketId, investibleId]);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      const newInvestible = { ...investible };
      newInvestible[name] = value;
      setInvestible(newInvestible);
    };
  }

  const {
    description, stage, name, quantity,
  } = investible;
  return (
    <Activity
      isLoading={investible === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={intl.formatMessage({ id: 'investibleEditHeader' })}
    >
      <div>
        <div className={classes.flex}>
          <TextField
            className={classes.textField}
            InputProps={{ className: classes.textInput, maxLength: 255 }}
            id="name"
            label={intl.formatMessage({ id: 'titleLabel' })}
            margin="normal"
            fullWidth
            value={name}
            onChange={() => handleChange('name')}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <HtmlRichTextEditor
            style={{ minHeight: 'auto' }}
            value={description}
            onChange={() => handleChange('description')}
          />
        </div>
        <Typography component="div">
          <div className={classNames(classes.flex, classes.row)}>
            <span className={classes.stageLabel}>
              {intl.formatMessage({ id: 'currentStageLabel' })}
            </span>
            <div className={classes.stageContent}>
              <div><StageSelectList onChange={() => handleChange('stage')} value={stage} marketId={marketId} /></div>
              <div className={classes.numSharesText}>
                {intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: quantity })}
              </div>
            </div>
          </div>

        </Typography>


      </div>
    </Activity>
  );
}

InvestibleEdit.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  marketId: PropTypes.string.isRequired,
  match: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
};

export default injectIntl(withMarketId(withStyles(styles)(InvestibleEdit)));
