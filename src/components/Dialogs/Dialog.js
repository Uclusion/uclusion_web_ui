import _ from 'lodash'
import React from 'react'
import PropTypes from "prop-types";
import MuiDialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import { makeStyles } from "@material-ui/core/styles";

const useDialogStyles = makeStyles(
  {
    root: {},
    actions: {paddingBottom: '1.25rem'},
    content: {},
    title: {}
  },
  { name: "Dialog" }
);

export default function Dialog(props) {
  const classes = useDialogStyles(props);
  const { actions, autoFocusRef, content, open, onClose, title } = props;

  const uniqueId = useClientSideId();
  const labelId = `dialog-name-${uniqueId}`;
  const descriptionId = `dialog-description-${uniqueId}`;

  React.useEffect(() => {
    const { current: autoFocus } = autoFocusRef || {}
    if (open === true && !_.isEmpty(autoFocus)) {
      if (typeof autoFocus.focus !== 'function') {
        console.warn(
          'Dialog: The instance at autoFocusRef must implement .focus()'
        )
      } else {
        autoFocus.focus()
      }
    }
  }, [autoFocusRef, open]);

  return (
    <MuiDialog
      aria-describedby={descriptionId}
      aria-labelledby={labelId}
      className={classes.root}
      disableAutoFocus
      open={open}
      onClose={onClose}
    >
      <DialogTitle className={classes.title} id={labelId}>
        {title}
      </DialogTitle>
      <DialogContent className={classes.content} id={descriptionId}>
        {content}
      </DialogContent>
      <DialogActions className={classes.actions}>{actions}</DialogActions>
    </MuiDialog>
  );
}

Dialog.propTypes = {
  actions: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired
};

function useClientSideId() {
  const [id, setId] = React.useState(undefined);

  React.useEffect(() => {
    setId(
      Math.random()
        .toString(36)
        .slice(2)
    );
  }, []);

  return id;
}
