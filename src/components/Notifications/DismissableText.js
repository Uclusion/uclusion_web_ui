import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { DISMISS, DismissTextContext } from '../../contexts/DismissTextContext';
import IconButton from '@material-ui/core/IconButton';
import LiveHelpTwoToneIcon from '@material-ui/icons/LiveHelpTwoTone';
import CancelRoundedIcon from '@material-ui/icons/CancelRounded';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    backgroundColor: theme.palette.grey["300"],
    borderRadius: 6,
    padding: 0,
  },
  leftMost: {
    margin: 0,
    marginLeft: theme.spacing(1),
    fontSize: 16,
    flex: 10.5,
    padding: '14px',
    display: 'flex'
  },
  rightMost: {
    flex: 1.5,
    marginLeft: 'auto',
    margin: 0,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  dismissText: {
    transform: 'scale(0.7)',
    margin: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  pointer: {
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  hoverState: {
    '&:hover': {
      backgroundColor: "transparent",
    }
  },
  help: {
    marginRight: '6px'
  }
}));

function DismissableText(props) {
  const {
    textId,
  } = props;
  const classes = useStyles();
  const [dismissState, dispatchDismissState] = useContext(DismissTextContext);

  function dismiss() {
    dispatchDismissState({ type: DISMISS, id: textId });
  }

  if (textId in dismissState) {
    return React.Fragment;
  }

  return (
    <dl className={classes.root} >
      <dl className={classes.leftMost}>
        <LiveHelpTwoToneIcon color="inherit" fontSize="small" className={classes.help}/>
        <FormattedMessage id={textId} />
      </dl>
      <dl className={classes.rightMost}>
        <dd className={classes.dismissText}>
          <span onClick={dismiss} className={classes.pointer}>
            <FormattedMessage id="decisionDialogsDismissDialog" />
            <IconButton className={classes.hoverState} disableRipple>
              <CancelRoundedIcon />
            </IconButton>
          </span>
        </dd>
      </dl>
    </dl>
  );
}

DismissableText.propTypes = {
  textId: PropTypes.string.isRequired,
};

export default DismissableText;
