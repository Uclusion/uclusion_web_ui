import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Card, Button, ButtonGroup, CardContent, CardActions, makeStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import QuillEditor from '../TextEditors/QuillEditor';
import { updateComment } from '../../api/comments';
import { processTextAndFilesForSave } from '../../api/files';
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  add: {},
}));

function CommentEdit(props) {
  const {
    intl, marketId, onSave, onCancel, comment,
  } = props;
  const { id, body: initialBody, uploaded_files: initialUploadedFiles } = comment;
  const [body, setBody] = useState(initialBody);
  const [uploadedFiles] = useState(initialUploadedFiles);
  const classes = useStyles();
  const [operationRunning] = useContext(OperationInProgressContext);

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

  function handleCancel() {
    onCancel();
  }

  return (
    <div
      className={classes.add}
    >
      <Card>
        <CardContent>
          <QuillEditor
            defaultValue={initialBody}
            onChange={onEditorChange}
          />
        </CardContent>
        <CardActions>
          <ButtonGroup
            disabled={operationRunning}
            variant="contained"
            size="small"
            color="primary"
          >
            <SpinBlockingButton
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
            >
              {intl.formatMessage({ id: 'cancel' })}
            </Button>
          </ButtonGroup>
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
