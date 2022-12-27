import React from 'react'
import { FormattedMessage } from 'react-intl'
import PropTypes from 'prop-types'
import { darken, makeStyles } from '@material-ui/core/styles';
import Dialog from './Dialog';
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton';
import { Clear } from '@material-ui/icons';
import WarningIcon from '@material-ui/icons/Warning';

export const useLockedDialogStyles = makeStyles(
  (theme) => {
    return {
      root: {
        '& .MuiDialogTitle-root': {
          flex: '0 0 auto',
          margin: 0,
          padding: '16px 24px 0px 24px'
        },
      },
      title: {
        fontWeight: 'bold',
        textTransform: "capitalize",
        display: "flex",
        justifyContent: "center",
        "& h2": {
          display: "flex",
          alignItems: "center"
        }
      },
      titleIcon: {
        height: 16,
        width: 16,
        marginRight: 8,
      },
      titleDisplay: {
        fontSize: 32,
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("sm")]: {
          fontSize: 25
        }
      },
      titleEditable: {
        fontSize: 32,
        cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
        lineHeight: "42px",
        paddingBottom: "9px",
        [theme.breakpoints.down("sm")]: {
          fontSize: 25
        }
      },
      warningTitleIcon: {
        marginRight: 8,
        color: '#F2C94C',
      },
      content: {
        lineHeight: 1.75,
        textAlign: "center"
      },
      issueWarningContent: {
        lineHeight: 3,
        minWidth: '35rem',
        textAlign: "center"
      },
      actions: {
        flexBasis: "unset",
        justifyContent: "center"
      },
      action: {
        color: 'white',
        fontWeight: 'bold',
        paddingLeft: 24,
        paddingRight: 24,
        textTransform: "capitalize"
      },
      actionEdit: {
        backgroundColor: "#2D9CDB",
        "&:hover": {
          backgroundColor: darken("#2D9CDB", 0.08)
        },
        "&:focus": {
          backgroundColor: darken("#2D9CDB", 0.24)
        },
      },
      actionCancel: {
        backgroundColor: "#8C8C8C",
        "&:hover": {
          backgroundColor: darken("#8C8C8C", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#8C8C8C", 0.12)
        },
      }
    };
  },
  { name: "LockedDialog" }
);

export function LockedDialog(props) {
  const { actions, classes, open, onClose } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.content,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          <SpinningIconLabelButton onClick={onClose} doSpin={false} icon={Clear} ref={autoFocusRef}>
            <FormattedMessage id="lockDialogCancel" />
          </SpinningIconLabelButton>
          {actions}
        </React.Fragment>
      }
      content={<FormattedMessage id="lockDialogContent" />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="lockDialogTitle" />
        </React.Fragment>
      }
    />
  );
}

LockedDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};
