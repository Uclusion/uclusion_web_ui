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
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';
import InvestibleFollowUnfollow from './InvestibleSubscribeUnsubscribe';
import InvestibleDelete from './InvestibleDelete';
import InvestibleEdit from './InvestibleEditButton';
import InvestibleInvest from './InvestibleInvest';
import { fetchInvestibles } from '../../api/marketInvestibles';
import { fetchSelf } from '../../api/users';
import { getCurrentUser } from '../../store/Users/reducer';
import { getFlags } from '../../utils/userFunctions'
import CommentsList from './Comments/CommentsList';

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
    investible, intl, classes, onClose, dispatch, user,
  } = props;
  const { isAdmin, isGuest } = getFlags(user);


  useEffect(() => {
    if (investible.id !== lastInvestible.id) {
      setLastInvestible(investible);
      fetchInvestibles([investible.id], investible.market_id, dispatch);
      // Required if someone on team has spent shared uShares or there was a grant
      fetchSelf(dispatch);
    }
  }, [investible, lastInvestible, dispatch]);


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
        ) : null
        }
      </div>
    );
  }

  function canEdit() {
    return isAdmin || (investible.created_by === user.id);
  }


  const show = !!investible;
  const myInvestible = investible || lastInvestible;
  const dateFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };
  return (
    <div
      className={classNames(classes.root, {
        [classes.detailOpen]: show,
        [classes.detailClose]: !show,
      })}
    >
      <div className={classNames(classes.bottomActions)}>
        {!isGuest && (<InvestibleFollowUnfollow investible={myInvestible} />)}
        {canEdit()
        && <InvestibleDelete investible={myInvestible} onCloseDetail={onClose} />}
        {canEdit() && <InvestibleEdit investibleId={myInvestible.id} />}
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
        {renderLabelChips()}
        <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={myInvestible.description} readOnly />
        <InvestibleInvest
          teamId={user.default_team_id}
          sharesAvailable={100} // {user.market_presence.quantity}
          currentUserInvestment={myInvestible.current_user_investment}
          investibleId={myInvestible.id}
        />
        <CommentsList
          marketId={myInvestible.market_id}
          user={user}
          investibleId={myInvestible.id}
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
  intl: PropTypes.object.isRequired, //eslint-disable-line
  dispatch: PropTypes.func.isRequired,

};

export default connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(withStyles(styles)(InvestibleDetail)),
);
