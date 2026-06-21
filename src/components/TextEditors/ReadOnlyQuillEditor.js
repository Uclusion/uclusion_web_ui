import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core";
import clsx from "clsx";
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';
import './editorStyles.css';
import QuillEditor2 from './QuillEditor2'
import _ from 'lodash'

const useStyles = makeStyles(
  theme => {
    return {
      root: {
        "& .ql-container.ql-snow": {
          fontFamily: theme.typography.fontFamily,
          fontSize: 15,
          border: 0,
        },
        "& .ql-editor": {
          paddingLeft: 0,
          overflowY: 'hidden',
        },
      },
      editable: {
        // T-all-2209 (C-all-1013): editing a comment now opens a modal rather than
        // editing in place, so hovering an editable comment shows the normal
        // pointer (hand) instead of the inline-edit pencil cursor.
        "& > *": {
          cursor: 'pointer'
        }
      },
      notEditable: {},
    };
  },
  { name: "ReadOnlyQuillEditor" }
);

function ReadOnlyQuillEditor(props) {
  const { value = '', setBeingEdited = () => {}, isEditable = false, id, noOverflow, isWhiteText = false } = props;
  const classes = useStyles();

  if (!id) {
    return React.Fragment;
  }

  return (
    <div className={clsx(classes.root, isEditable ? classes.editable : classes.notEditable)}
         onClick={(event) => {
           if (isEditable) {
             setBeingEdited(event);
           }
         }}>
      {!_.isEmpty(value) && (
        <QuillEditor2
          id={`readOnly${id}`}
          value={value}
          noToolbar
          noOverflow={noOverflow}
          isWhiteText={isWhiteText}
        />
      )}
    </div>
  );
}

ReadOnlyQuillEditor.propTypes = {
  value: PropTypes.string,
  setBeingEdited: PropTypes.func,
  isEditable: PropTypes.bool,
};

export default React.memo(ReadOnlyQuillEditor);
