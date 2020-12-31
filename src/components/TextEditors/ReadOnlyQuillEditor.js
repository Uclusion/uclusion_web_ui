import React, { useRef, useEffect, useContext, useState } from 'react'
import PropTypes from "prop-types";
import Quill from "quill";
import handleViewport from 'react-in-viewport';
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';
import './editorStyles.css';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { deleteSingleMessage } from '../../api/users'
import { removeMessage } from '../../contexts/NotificationsContext/notificationsContextReducer'


const useStyles = makeStyles(
  theme => {
    return {
      root: {
        "& .ql-container.ql-snow": {
          fontFamily: theme.typography.fontFamily,
          fontSize: 15,
          border: 0
        },
        "& .ql-editor": {
          paddingLeft: 0
        },
      },
      editable: {
        "& > *": {
          cursor: "url('/images/edit_cursor.svg') 0 24, pointer"
        }
      },
      notEditable: {},
      heading: {
        "& .ql-container.ql-snow": {
          fontSize: 20,
          fontWeight: "bold"
        }
      }
    };
  },
  { name: "ReadOnlyQuillEditor" }
);

function ReadOnlyQuillEditor(props) {
  const { className, heading, value, setBeingEdited, isEditable, notificationType, notificationId } = props;
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [viewTimer, setViewTimer] = useState(undefined);
  const myMessage = findMessageOfTypeAndId(notificationType, notificationId, messagesState);
  const box = useRef(null);

  const classes = useStyles(props);

  const quillOptions = {
    modules: {
      toolbar: false
    },
    readOnly: true,
    theme: "snow"
  };

  useEffect(() => {
    if (box.current !== null) {
      box.current.innerHTML = value;
      new Quill(box.current, quillOptions);
    }
    return () => {};
  }, [box, value, quillOptions]);

  function removeMyMessage() {
    if (myMessage && !viewTimer) {
      setViewTimer(setTimeout(() => {
        return deleteSingleMessage(myMessage).then(() => messagesDispatch(removeMessage(myMessage)));
      }, 5000));
    }
  }

  function cancelRemoveMessage() {
    if (viewTimer) {
      setViewTimer(undefined);
      clearTimeout(viewTimer);
    }
  }

  const TextDiv = (props) => {
    // inViewport, enterCount, leaveCount also available
    const { forwardedRef } = props;
    return (
      <div ref={forwardedRef}>
        <div ref={box} className={isEditable ? classes.editable : classes.notEditable} />
      </div>
    )
  };

  const ViewportBlock = handleViewport(TextDiv, /** options: {}, config: {} **/);

  return (
    <div className={clsx(classes.root, heading && classes.heading, className)}
         onClick={(event) => setBeingEdited(true, event)}>
      <ViewportBlock onEnterViewport={removeMyMessage} onLeaveViewport={cancelRemoveMessage} />
    </div>
  );
}

ReadOnlyQuillEditor.propTypes = {
  editorClassName: PropTypes.string,
  notificationType: PropTypes.string,
  notificationId: PropTypes.string,
  value: PropTypes.string,
  heading: PropTypes.bool,
  setBeingEdited: PropTypes.func,
  isEditable: PropTypes.bool,
};

ReadOnlyQuillEditor.defaultProps = {
  heading: false,
  value: '',
  setBeingEdited: () => {},
  isEditable: false
};

export default ReadOnlyQuillEditor;
