import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import {
  TextField,
  Typography,
  Button,
  Chip,
} from '@material-ui/core';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';
import StageSelectList from './StageSelectList';
import CategorySelectList from './CategorySelectList';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';
import Activity from '../../containers/Activity/Activity';
import { getStages } from '../../store/Markets/reducer';
import { fetchInvestibles } from '../../store/MarketInvestibles/actions';


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
    marketStages,
    dispatch,
    classes,
    intl,
  } = props;
  const { investibleId } = match.params;
  const [investible, setInvestible] = useState({});
  const [saved, setSaved] = useState(undefined);

  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.markets.getMarketInvestibles(marketId, [investibleId]))
      .then((investibles) => {
        const investible = investibles[0];
        // set the current stage on it to keep the save happy
        investible.current_stage_id = investible.stage;
        setInvestible(investibles[0]);
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'investibleEditInvestibleFetchFailed' });
      });
  }, [marketId, investibleId, saved]);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      // if the name is the category list, and none are selected, disallow the change
      if (name === 'category_list' && value.length === 0) {
        return;
      }
      const newInvestible = { ...investible };
      // if we've changed stage, zero out the additional investible to make sure
      // the default value changes in the additional investment field
      if (name === 'stage') {
        delete newInvestible.additional_investment;
      }
      newInvestible[name] = value;
      setInvestible(newInvestible);
    };
  }

  function onSave() {
    // first we sync the name and description to the investments service,
    // then we sync the state information (e.g. stage, etc) off to the markets service
    const clientPromise = getClient();
    const { id, name, description, category_list, market_id, label_list,
      stage, current_stage_id, additional_investment } = investible;
    // store the client so we can use it for second half
    let clientHolder = null;
    return clientPromise.then((client) => {
      clientHolder = client;
      return clientHolder.investibles.updateInMarket(id, market_id, name, description, category_list, label_list);
    }).then((result) => {
      const stateOptions = {
        stage_id: stage,
        current_stage_id,
        next_stage_additional_investment: additional_investment,
      };
      return clientHolder.investibles.stateChange(id, stateOptions);
    }).then((result) => {
      // instead of doing fancy logic to merge stuff, lets just refetch that investible
      dispatch(fetchInvestibles({ idList: [id], marketId: market_id }));
      sendIntlMessage(SUCCESS, { id: 'investibleEditSuccess' })
      setSaved(true);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleEditFailed' });
      setSaved(false);
    });
  }


  const {
    description, stage, name, quantity, label_scratch, category_list, label_list
  } = investible;

  function handleLabelDelete(label){
    const { label_list } = investible;
    const oldList = label_list || [];
    const newLabels = oldList.filter(element => element !== label);
    const newInvestible = { ...investible, label_list: newLabels };
    setInvestible(newInvestible);
  }

  function handleLabelAdd() {
    if (label_scratch) {
      const oldList = label_list || [];
      const newLabels = oldList.includes(label_scratch) ? oldList : [...oldList, label_scratch];
      const newInvestible = { ...investible, label_list: newLabels, label_scratch: '' };
      setInvestible(newInvestible);
    }
  }

  function getLabelChips() {
    const usedList = label_list || [];
    const chips = usedList.map((label, index) => {
      return <Chip key={index} label={label} onDelete={() => handleLabelDelete(label)}/>
    });
    return chips;
  }

  function getNextStageInfo() {
    const currentStages = marketStages && marketStages[marketId];
    const currentStage = currentStages && currentStages.find(element => element.id === stage);
    if (currentStage && currentStage.automatic_transition) {
      const { next_stage, additional_investment } = currentStage.automatic_transition;
      const nextStageData = marketStages[marketId].find((element) => element.id === next_stage);
      if (nextStageData) {
        // use either the value we've saved on the investible, or the default for the stage if it exists
        const investmentFieldValue = investible.additional_investment || (investible.quantity + additional_investment);
        return (
          <div>
            <Typography>{intl.formatMessage({ id: 'investibleEditNextStageLabel' })}</Typography>
            <Typography>{nextStageData.name}</Typography>
            <TextField
              className={classes.textField}
              id="additional_investment"
              label={intl.formatMessage({ id: 'investibleEditNextStageInvestmentLabel' })}
              margin="normal"
              value={investmentFieldValue}
              onChange={handleChange('additional_investment')}
            />
          </div>
        );
      } else {
        // zero  out the additional investment if we have no next stage
        const newInvestible = { ...investible };
        delete newInvestible.additional_investment;
        setInvestible(newInvestible);
      }
    }
    return (<div/>);
  }

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
            onChange={handleChange('name')}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <HtmlRichTextEditor
            style={{ minHeight: 'auto' }}
            value={description}
            onChange={handleChange('description')}
          />
        </div>
        <div>
          <Typography>{intl.formatMessage({ id: 'investibleCategoriesLabel'})}</Typography>
          <CategorySelectList marketId={marketId} value={category_list || []} onChange={handleChange('category_list')}/>
        </div>
        <div>
          <Typography>{intl.formatMessage({ id: 'investibleEditLabelsLabel' })}</Typography>
          <div>
            {getLabelChips()}
          </div>
        </div>
        <div>
          <Typography>{intl.formatMessage({ id: 'investibleEditAddNewLabelLabel' })}</Typography>
          <TextField
            className={classes.textField}
            InputProps={{ className: classes.textInput, maxLength: 255 }}
            margin="normal"
            name="label_scratch"
            onChange={handleChange('label_scratch')}
            value={label_scratch}
          />
          {(!label_list || label_list.length < 5) && <Button onClick={handleLabelAdd}>{intl.formatMessage({ id: 'investibleEditAddNewLabelButton' })}</Button>}
        </div>
        <div className={classes.numSharesText}>
          {intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: quantity })}
        </div>
        <Typography component="div">
          <div className={classNames(classes.flex, classes.row)}>
            <span className={classes.stageLabel}>
              {intl.formatMessage({ id: 'currentStageLabel' })}
            </span>
            <div className={classes.stageContent}>
              <div><StageSelectList onChange={handleChange('stage')} value={stage} marketId={marketId}/></div>
              {getNextStageInfo()}
            </div>
          </div>
        </Typography>
        <Button onClick={() => onSave()}>{intl.formatMessage({ id: 'investibleEditSaveLabel' })}</Button>
      </div>
    </Activity>
  );
}

function mapStateToProps(state) {
  return {
    marketStages: getStages(state.marketsReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

InvestibleEdit.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  marketId: PropTypes.string.isRequired,
  match: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  marketStages: PropTypes.object.isRequired,  //eslint-disable-line
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withMarketId(withStyles(styles)(InvestibleEdit))));
