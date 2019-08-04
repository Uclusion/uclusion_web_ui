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
  Card,
  CardContent,
  CardActions,
} from '@material-ui/core';
import Info from '@material-ui/icons/Info';
import IconButton from '@material-ui/core/IconButton';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getMarketClient } from '../../api/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';
import Activity from '../../containers/Activity/Activity';
import { getMarkets } from '../../store/Markets/reducer';
import { fetchInvestibles } from '../../api/marketInvestibles';
import { fetchMarket } from '../../api/markets';
import HelpMovie from '../../components/ModalMovie/HelpMovie';
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions'

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
  fullFlex: {
    flex: 1,
  },
  leftMargin: {
    marginLeft: theme.spacing.unit * 4,
    maxWidth: 250,
  },
  moreLeftMargin: {
    marginLeft: theme.spacing.unit * 10,
    maxWidth: 250,
  },
  actions: {
    padding: theme.spacing.unit * 2,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: theme.palette.grey[300],
  },
  description: {
    padding: theme.spacing.unit * 1.5,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
  },
  controlLabel: {
    fontSize: '1rem',
    transform: 'translate(0, 1.5px) scale(0.75)',
    transformOrigin: 'top left',
    color: 'rgba(0, 0, 0, 0.54)',
  },
  noLabelsText: {
    lineHeight: '36px',
  },
  labelChips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  labelChip: {
    margin: theme.spacing.unit * 0.25,
  },
  newLabelRow: {
    display: 'flex',
    alignItems: 'flex-end',
    maxWidth: 480,
  },
  newLabelButton: {
    marginLeft: theme.spacing.unit * 2,
  },
  newLabelRowBottom: {
    marginBottom: theme.spacing.unit * 2,
    marginTop: theme.spacing.unit * 4,
  },
  button: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit * 2,
    padding: 0,
  },
  topButton: {
    marginLeft: theme.spacing.unit,
    padding: 0,
  },
});

function InvestibleAddEdit (props) {
  const {
    match,
    marketId,
    dispatch,
    classes,
    intl,
    history
  } = props;
  const { investibleId } = match.params;
  const addMode = !investibleId;
  const [investible, setInvestible] = useState({});
  const [saved, setSaved] = useState(undefined);
  const [dirty, setDirty] = useState(false);
  const [showInvestibleEditHelp, setShowInvestibleEditHelp] = useState(false);
  useEffect(() => {
    if (!addMode) {
      getMarketClient(marketId).then(client => client.markets.getMarketInvestibles([investibleId]))
        .then((investibles) => {
          const investible = investibles[0];
          setInvestible(investible);
          fetchMarket(dispatch);
        }).catch((error) => {
          console.log(error);
          sendIntlMessage(ERROR, { id: 'investibleEditInvestibleFetchFailed' });
        });
    }
  }, [marketId, addMode, investibleId, saved, dispatch]);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      // if the name is the category list, and none are selected, disallow the change
      const newInvestible = { ...investible };
      const isDirty = newInvestible[name] !== value;
      newInvestible[name] = value;
      setInvestible(newInvestible);
      if (!dirty && isDirty) {
        setDirty(true);
      }
    };
  }

  function saveEdits(){
    const { id, name, description, label_list } = investible;
    return getMarketClient(marketId).then(client => client.investibles.update(id, name, description, label_list))
      .then(() => fetchInvestibles([id], marketId, dispatch))
      .then(() => {
        sendIntlMessage(SUCCESS, { id: 'investibleEditSuccess' });
        setSaved(true);
      })
      .catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'investibleEditFailed' });
        setSaved(false);
        setDirty(true);
      });
  }

  function saveNew() {
    const { name, description } = investible;
    return getMarketClient(marketId).then(client => client.investibles.create(name, description))
      .then((investible) => {
        setSaved(true);
        setDirty(false);
        const { id } = investible;
        sendIntlMessage(SUCCESS, { id: 'investibleAddSucceeded'});
        history.push(formCurrentMarketLink(`investibles/#investible:${id}`));
      })
      .catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'investibleAddFailed' });
        setSaved(false);
        setDirty(true);
      });
  }

  function onSave() {
    setDirty(false);
    // first we sync the name and description to the investments service,
    // then we sync the state information (e.g. stage, etc) off to the markets service
    if (addMode) {
      return saveNew();
    }
    return saveEdits();
  }




  function onCancel() {
    const { match: { params }, history } = props;
    const { marketId, investibleId } = params;
    history.push(`/${marketId}/investibles#investible:${investibleId}`);
  }

  const { description, name, label_scratch,  label_list } = investible;

  function handleLabelDelete(label) {
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

  function renderLabelEditor() {
    if (addMode) {
      return <div />;
    }
    const { label_list } = investible;
    return (
      <div className={classNames(classes.row, classes.newLabelRow)}>
        <TextField
          className={classes.fullFlex}
          inputProps={{ maxLength: 255 }}
          label={intl.formatMessage({ id: 'investibleEditAddNewLabelLabel' })}
          InputLabelProps={{ shrink: true }}
          name="label_scratch"
          onChange={handleChange('label_scratch')}
          value={label_scratch}
        />
        {(!label_list || label_list.length < 5) && (
          <Button
            className={classes.newLabelButton}
            variant="contained"
            onClick={handleLabelAdd}
          >
            {intl.formatMessage({ id: 'investibleEditAddNewLabelButton' })}
          </Button>
        )}
      </div>
    );
  }

  function renderCloseButtonLabel() {
    if (addMode) {
      return intl.formatMessage({ id: 'investibleEditCancelLabel' });
    }
    if (dirty) {
      return intl.formatMessage({ id: 'investibleEditCancelLabel' });
    }
    return intl.formatMessage({ id: 'investibleEditCloseLabel' });
  }

  function renderLabelChips() {
    const usedList = label_list || [];
    if (addMode) {
      return <div />;
    }
    return (
      <div className={classes.row}>
        <div>
          <Typography className={classes.controlLabel}>
            {intl.formatMessage({ id: 'investibleEditLabelsLabel' })}
          </Typography>
          {usedList.length > 0 ? (
            <div className={classes.labelChips}>
              {usedList.map((label, index) => (
                <Chip
                  className={classes.labelChip}
                  key={index}
                  label={label}
                  onDelete={() => handleLabelDelete(label)}
                />
              ))}
            </div>
          ) : (
            <div/>
          )}
        </div>
      </div>
    );
  }

  return (
    <Activity
      isLoading={!addMode && Object.keys(investible).length === 0}
      containerStyle={{ overflow: 'auto' }}
      title={addMode? intl.formatMessage({ id: 'investibleAddHeader' }) : intl.formatMessage({ id: 'investibleEditHeader' })}
    >
      <div className={classes.root}>
        <HelpMovie name="investibleEditIntro" />
        <Card>
          <CardContent>
            <HelpMovie name="investibleEditHelp" open={showInvestibleEditHelp} onClose={() => setShowInvestibleEditHelp(false)} dontAutoOpen />
            <IconButton
              name="stageinfo"
              aria-label="Edit Investible Help"
              className={classes.topButton}
              color="primary"
              onClick={(event) => {
                event.preventDefault();
                setShowInvestibleEditHelp(true);
              }}
            >
              <Info />
            </IconButton>
            <TextField
              className={classes.row}
              inputProps={{ maxLength: 255 }}
              InputLabelProps={{ shrink: true }}
              id="name"
              label={intl.formatMessage({ id: 'titleLabel' })}
              margin="normal"
              fullWidth
              value={name}
              onChange={handleChange('name')}
            />
            <div className={classNames(classes.description, classes.row)}>
              <HtmlRichTextEditor
                value={description}
                placeHolder={intl.formatMessage({ id: 'description_hint' })}
                onChange={handleChange('description')}
              />
            </div>
            {renderLabelChips()}
            {renderLabelEditor()}
          </CardContent>
          <CardActions className={classes.actions}>
            <Button onClick={() => onCancel()}>
              {renderCloseButtonLabel()}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!dirty}
              onClick={() => onSave()}
            >
              {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
            </Button>
          </CardActions>
        </Card>
      </div>
    </Activity>
  )
}

function mapStateToProps(state) {
  return {
    markets: getMarkets(state.marketsReducer),
  };
}

function mapDispatchToProps (dispatch) {
  return { dispatch };
}

InvestibleAddEdit.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  marketId: PropTypes.string.isRequired,
  match: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  marketStages: PropTypes.object.isRequired,  //eslint-disable-line
  markets: PropTypes.object.isRequired,  //eslint-disable-line
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,  //eslint-disable-line
};

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withMarketId(withStyles(styles)(InvestibleAddEdit))));
