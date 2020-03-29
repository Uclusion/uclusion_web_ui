import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { DISMISS, DismissTextContext } from '../../contexts/DismissTextContext';
import IconButton from '@material-ui/core/IconButton';
import LiveHelpIcon from '@material-ui/icons/LiveHelp';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    backgroundColor: theme.palette.grey["300"],
    borderRadius: 6,
    padding: 0,
  },
  leftMost: {
    marginLeft: theme.spacing(1),
    fontSize: 20,
  },
  dismissText: {
    transform: 'scale(0.7)',
  },
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
        <LiveHelpIcon color='primary' />
        <FormattedMessage id={textId} />
      </dl>
      <dl>
        <dd className={classes.dismissText}>
          <FormattedMessage id="decisionDialogsDismissDialog" />
          <IconButton onClick={dismiss}>
            <CloseIcon />
          </IconButton>
        </dd>
      </dl>
    </dl>
  );
}

DismissableText.propTypes = {
  textId: PropTypes.string.isRequired,
};

export default DismissableText;
