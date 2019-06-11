import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import {
  IconButton,
  Typography,
  Chip, Tooltip,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Info from '@material-ui/icons/Info';
import InvestibleListItemTabs from './InvestibleListItemTabs';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import InvestibleFollowUnfollow from './InvestibleFollowUnfollow';
import InvestibleDelete from './InvestibleDelete';
import InvestibleEdit from './InvestibleEdit';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import { fetchInvestibles } from '../../store/MarketInvestibles/actions';
import { fetchSelf } from '../../api/users';
import { getCurrentUser } from '../../store/Users/reducer';
import HelpMovie from '../ModalMovie/HelpMovie';

const styles = theme => ({
  root: {
    position: 'fixed',
    width: '100%',
    height: '100%',
    overflow: 'auto',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    zIndex: 999,
    padding: theme.spacing.unit * 2,
    paddingTop: 64 + theme.spacing.unit * 2,
    boxSizing: 'border-box',
    transition: theme.transitions.create(['right'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.up('sm')]: {
      width: 400,
    },
  },
  content: {
    //
  },
  lastInvestmentDate: {
    paddingBottom: theme.spacing.unit * 1,
  },
  detailOpen: {
    right: 0,
  },
  detailClose: {
    right: '-100%',
  },
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
  stageLabel: {
    minWidth: 100,
  },
  stageContent: {
    flex: 1,
  },
  numSharesText: {
    fontSize: 12,
  },
  bottomActions: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  investibleName: {
    paddingTop: theme.spacing.unit * 1.25,
    paddingBottom: theme.spacing.unit,
    fontWeight: 'bold',
    maxWidth: 380,
    wordWrap: 'break-word',
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
  button: {
    marginLeft: theme.spacing.unit,
    padding: 0,
  },
});

function InvestibleDetail(props) {
  const [lastInvestible, setLastInvestible] = useState({});
  const [showStagesHelp, setShowStagesHelp] = useState(false);
  const {
    investible, intl, classes, onClose, userPermissions, dispatch, user,
  } = props;
  useEffect(() => {
    if (investible.id !== lastInvestible.id) {
      setLastInvestible(investible);
      dispatch(fetchInvestibles({ idList: [investible.id], marketId: investible.market_id }));
      // Required if someone on team has spent shared uShares or there was a grant
      fetchSelf(dispatch);
    }
  }, [investible]);

  function getNextStageContent(investible) {
    if (investible.next_stage_name) {
      return (
        <Typography component="div" className={classNames(classes.flex, classes.row)}>
          <span className={classes.stageLabel}>
            {intl.formatMessage({ id: 'nextStageLabel' })}
          </span>
          <div className={classes.stageContent}>
            <div>{investible.next_stage_name}</div>
            <div className={classes.numSharesText}>
              {investible.next_stage_threshold && intl.formatMessage({ id: 'investmentForNextStageChip' },
                { shares: investible.next_stage_threshold - investible.quantity })}
            </div>
          </div>
        </Typography>
      );
    }
    return (<div />);
  }

  function renderLabelChips() {
    const { label_list = [] } = investible || lastInvestible;

    return (
      <div className={classes.row}>
        {/* <Typography className={classes.controlLabel}>Labels</Typography> */}
        {label_list.length > 0 ? (
          <div className={classes.labelChips}>
            {label_list.map((label, index) => (
              <Chip
                className={classes.labelChip}
                key={index}
                label={label}
              />
            ))}
          </div>
        ) : (
          <Typography className={classes.noLabelsText}>
            No labels
          </Typography>
        )}
      </div>
    );
  }
  const show = !!investible;
  const myInvestible = investible || lastInvestible;
  const { canDeleteMarketInvestible, canEditMarketInvestible, isGuest } = userPermissions;
  const dateFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };
  const lastInvestDate = intl.formatDate(myInvestible.updated_at, dateFormatOptions);
  return (
    <div
      className={classNames(classes.root, {
        [classes.detailOpen]: show,
        [classes.detailClose]: !show,
      })}
    >
      <div className={classNames(classes.bottomActions)}>
        {!isGuest && (<InvestibleFollowUnfollow investible={myInvestible} />)}
        {canDeleteMarketInvestible
        && <InvestibleDelete investible={myInvestible} onCloseDetail={onClose} />}
        {canEditMarketInvestible && <InvestibleEdit investibleId={myInvestible.id} />}
        <Tooltip title={intl.formatMessage({ id: 'investibleDetailClose' })}>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </div>
      <div className={classes.content}>
        <div className={classes.flex}>
          <Typography variant="h6" className={classes.investibleName}>
            {myInvestible.name}
          </Typography>

        </div>
        <Typography className={classes.lastInvestmentDate}>
          {intl.formatMessage({id: 'investiblesLastInvestment' }, { date: lastInvestDate })}
        </Typography>
        <HelpMovie name="usersStagesHelp" open={showStagesHelp} onClose={() => setShowStagesHelp(false)} dontAutoOpen />
        <Typography component="div" className={classNames(classes.flex, classes.row)}>
          <span className={classes.stageLabel}>
            {intl.formatMessage({ id: 'currentStageLabel' })}
          </span>
          <div className={classes.stageContent}>
            <div>
              {myInvestible.stage_name}
              {canEditMarketInvestible && (
                <IconButton
                  name="stagesinfo"
                  aria-label="Stages Help"
                  className={classes.button}
                  color="primary"
                  onClick={(event) => {
                    event.preventDefault();
                    setShowStagesHelp(true);
                  }}
                >
                  <Info />
                </IconButton>
              )}
            </div>
            <div className={classes.numSharesText}>
              {intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: myInvestible.quantity })}
            </div>
          </div>
        </Typography>
        {getNextStageContent(myInvestible)}
        {renderLabelChips()}

        <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={myInvestible.description} readOnly />
        <InvestibleListItemTabs
          name={myInvestible.name}
          quantity={myInvestible.quantity}
          investibleId={myInvestible.id}
          marketId={myInvestible.market_id}
          currentUserInvestment={myInvestible.current_user_investment}
          openForInvestment={myInvestible.open_for_investment}
          subscribed={myInvestible.current_user_is_following}
        />
      </div>
    </div>
  );
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

InvestibleDetail.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  onClose: PropTypes.func.isRequired,
  userPermissions: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  dispatch: PropTypes.func.isRequired,
  user: PropTypes.object, //eslint-disable-line
};

export default connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(withUserAndPermissions(withStyles(styles)(InvestibleDetail))),
);
