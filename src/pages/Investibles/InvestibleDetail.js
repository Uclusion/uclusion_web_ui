import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import {
  IconButton,
  Typography,
  Chip, Tooltip,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';
import InvestibleDelete from './InvestibleDelete';
import InvestibleEdit from '../../components/Investibles/InvestibleEditButton';
import InvestibleInvest from './InvestibleInvest';

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
    padding: theme.spacing(2),
    paddingTop: 64 + theme.spacing(2),
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
    paddingBottom: theme.spacing(1),
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
    marginBottom: theme.spacing(1),
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
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(1),
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
    margin: theme.spacing(0.25),
  },
  button: {
    marginLeft: theme.spacing(1),
    padding: 0,
  },
});

function InvestibleDetail(props) {
  const {
    investible, intl, classes, onClose,
  } = props;
  const [ quantityToInvest, setQuantityToInvest ] = useState(investible.current_user_investment);



  function renderLabelChips() {
    const { label_list = [] } = investible;

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


  const show = !!investible;
  const myInvestible = investible;

  /**
   *         <CommentsList
   marketId={myInvestible.market_id}
   user={user}
   investibleId={myInvestible.id}
   />

   */
  return (
    <div
      className={classNames(classes.root, {
        [classes.detailOpen]: show,
        [classes.detailClose]: !show,
      })}
    >
      <div className={classNames(classes.bottomActions)}>
        <InvestibleDelete investible={myInvestible} onCloseDetail={onClose} />
        <InvestibleEdit investibleId={myInvestible.id} />
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
          marketId={myInvestible.market_id}
          sharesAvailable={100} // {user.market_presence.quantity}
          currentUserInvestment={myInvestible.current_user_investment}
          investibleId={myInvestible.id}
          quantityToInvest={quantityToInvest}
          setQuantityToInvest={setQuantityToInvest}
        />
      </div>
    </div>
  );
}



InvestibleDetail.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  onClose: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(InvestibleDetail));
