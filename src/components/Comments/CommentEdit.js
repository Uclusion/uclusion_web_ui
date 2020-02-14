import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Card, Button, CardContent, CardActions, makeStyles, darken
} from '@material-ui/core';
import PropTypes from 'prop-types';
import QuillEditor from '../TextEditors/QuillEditor';
import { updateComment } from '../../api/comments';
import { processTextAndFilesForSave } from '../../api/files';
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  add: {},
  cardContent: {
    padding: 0,
  },
  cardActions: {
    padding: 8,
  },
  buttonPrimary: {
    backgroundColor: '#2d9cdb',
    color: '#fff',
    "&:hover": {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    "&:focus": {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
}), { name: 'CommentEdit' });

function CommentEdit(props) {
  const {
    intl, marketId, onSave, onCancel, comment,
  } = props;
  const { id, body: initialBody, uploaded_files: initialUploadedFiles } = comment;
  const [body, setBody] = useState(initialBody);
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const classes = useStyles();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);

  function onEditorChange(content) {
    setBody(content);
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, body);
    return updateComment(marketId, id, tokensRemoved, filteredUploads);
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleCancel() {
    onCancel();
  }

  return (
    <div
      className={classes.add}
    >
      <Card elevation={0}>
        <CardContent className={classes.cardContent}>
          <QuillEditor
            defaultValue={initialBody}
            onChange={onEditorChange}
            onS3Upload={onS3Upload}
            setOperationInProgress={setOperationRunning}
          />
        </CardContent>
        <CardActions className={classes.cardActions}>
          <SpinBlockingButton
            className={classes.buttonPrimary}
            disabled={operationRunning}
            variant="contained"
            size="small"
            marketId={marketId}
            onClick={handleSave}
            onSpinStop={() => {
              onSave();
            }}
          >
            {intl.formatMessage({ id: 'save' })}
          </SpinBlockingButton>
          <Button
            onClick={handleCancel}
            disabled={operationRunning}
            variant="text"
            size="small"
          >
            {intl.formatMessage({ id: 'cancel' })}
          </Button>
        </CardActions>
      </Card>
    </div>
  );
}

CommentEdit.propTypes = {
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
};

CommentEdit.defaultProps = {
  onCancel: () => {
  },
  onSave: () => {
  },
};

export default injectIntl(CommentEdit);
