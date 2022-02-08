/**
 * A message passing based quill editor
 */

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { useIntl } from 'react-intl';
import { makeStyles, useMediaQuery, useTheme } from '@material-ui/core';
import { pushMessage } from '../../utils/MessageBusUtils';
import _ from 'lodash';
import VideoDialog from './CustomUI/VideoDialog';
import { embeddifyVideoLink } from './Utilities/VideoUtils';
import LinkDialog from './CustomUI/LinkDialog';
import Quill from 'quill';
import CustomQuillClipboard from './CustomQuillClipboard';
import NoOpUploader from './NoOpUploader';
import QuillTableUI from 'quill-table-ui';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillMention from 'quill-mention-uclusion';
import CustomCodeBlock from './CustomCodeBlock';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import PropTypes from 'prop-types';
import { getNameForUrl } from '../../utils/marketIdPathFunctions';
import ImageBlot from './ImageBlot';
import QuillEditorRegistry from './QuillEditorRegistry';
import {
  createEditor,
  getBoundsId, getQuillStoredState, resetEditor,
} from './Utilities/CoreUtils';

Quill.debug('error');
// install our filtering paste module, and disable the uploader
Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);
Quill.register(ImageBlot);
Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/mention', QuillMention);
Quill.register(CustomCodeBlock, true);

const useStyles = makeStyles(
  theme => {
    return {
      root: {
        '& .ql-container.ql-snow': {
          fontFamily: theme.typography.fontFamily,
          fontSize: 15,
          border: 0
        },
        '& .ql-editor': {
          paddingLeft: 0
        },
      },
      nothing: {},
      bottomSpacer: {
        display: 'none',
        [theme.breakpoints.between(0, 601)]: {
          display: 'block',
          height: '50px'
        }
      }
    };
  },
  { name: 'ReadOnlyQuillEditor' }
);

function QuillEditor2 (props) {

  const {
    id,
    cssId,
    value,
    uploadDisabled,
    noToolbar,
    simple,
    participants,
    marketId,
    mentionsAllowed,
    placeholder
  } = props;
  const classes = useStyles();
  const containerRef = useRef();
  const boxRef = useRef();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const intl = useIntl();
  const theme = useTheme();
  const [, setOperationInProgress] = useContext(OperationInProgressContext);
  const boundsId = getBoundsId(id);
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [currentLayout, setCurrentLayout] = useState(mobileLayout);

  /**
   * The UI for videos is quite poor, so we need
   * to replace it with ours
   */
  function createVideoUi (id) {
    return (
      <VideoDialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        onSave={(link) => {
          const { editor } = QuillEditorRegistry.getEditor(id);
          const embedded = embeddifyVideoLink(link);
          editor.format('video', embedded);
        }}
      />
    );
  }

  /**
   * The UI for links is also quite poor, so we need
   * to replace it with ours
   */
  function createLinkUi (id) {
    return (
      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onSave={(link) => {
          const { editor } = QuillEditorRegistry.getEditor(id);
          // if they haven't got anything selected, just get the current
          // position and insert the url as the text,
          // otherwise just format the current selection as a link
          const selected = editor.getSelection(true);
          // console.error(selected);
          //do we have nothing selected i.e. a zero length selection?
          if (selected.length === 0) {
            const index = selected ? selected.index : 0; // no position? do it at the front
            // if so, the selection is just the cursor position, so insert our new text there
            const name = getNameForUrl(link);
            editor.insertText(index, _.isEmpty(name) ? link : name, 'link', link, 'user');
            //refocus the editor because for some reason it moves to the top during insert
          } else {
            //  console.error('adding link' + link);
            editor.format('link', link);
          }
        }}
      />
    );
  }

  function onS3Upload (metadatas) {
    const newUploads = [...uploadedFiles, ...metadatas];
    setUploadedFiles(newUploads);
    pushMessage(`editor-${id}`, { type: 'uploads', newUploads });
  }

  // bridge our fonts in from the theme;
  const editorStyle = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    overflowX: 'hidden',
  };

  const containerStyle = {
    maxWidth: '100%',
    zIndex: '2',
    borderTop: '1px solid lightgrey'
  };

  const containerReadOnlyStyle = {
    maxWidth: '100%',
    zIndex: '2'
  };

  // Handle rotation on an iPhone
  useEffect(() => {
    if (id && mobileLayout !== currentLayout) {
      setCurrentLayout(mobileLayout);
      resetEditor(id, getQuillStoredState(id), { layout: mobileLayout });
    }
    return () => {};
  }, [id, mobileLayout, currentLayout]);

  // callback wrapper. Really should
  // resolve the deps issue with create editor
  const editorCreator = useCallback(() => {
    const { editor } = QuillEditorRegistry.getEditor(id);
    const idReady = id != null;
    const containersReady = containerRef.current != null && boxRef.current != null;
    const needEditor = containersReady && idReady && editor == null;
    if (needEditor) {
      // creating editor
      const editorConfig = {
        boxRef,
        containerRef,
        marketId,
        layout: currentLayout,
        noToolbar,
        onS3Upload,
        setCurrentLayout,
        setUploadInProgress,
        setOperationInProgress,
        setVideoDialogOpen,
        setLinkDialogOpen,
        simple,
        uploadDisabled,
        participants,
        mentionsAllowed,
        boundsId,
        placeholder,
      };
      createEditor(id, noToolbar ? value : undefined, editorConfig, false);
    }
    // This is probably a bad idea, but the create should be fine
    // due to the checks above (missing createEditor dep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayout, noToolbar, onS3Upload, setUploadInProgress,
    setOperationInProgress, setVideoDialogOpen, setLinkDialogOpen,
    simple, uploadDisabled, participants, mentionsAllowed, boundsId,
    boxRef, marketId, containerRef, setCurrentLayout, placeholder, value
  ]);

  useEffect(() => {
    editorCreator();
    return () => {
      // will only fire after total cleanup because of the needsEditor calculation
      QuillEditorRegistry.remove(id); // harmless if already nuked
    };
  }, [id, editorCreator]);

  return (
    <div>
      {createVideoUi(id)}
      {createLinkUi(id)}
      <div
        ref={containerRef}
        className={noToolbar ? classes.root : classes.nothing}
        style={noToolbar ? containerReadOnlyStyle : containerStyle}
        id={cssId}
      >
        {noToolbar && (
          <div ref={boxRef} id={boundsId} style={editorStyle}/>
        )}
        {!noToolbar && (
          <LoadingOverlay
            active={uploadInProgress}
            spinner
            className="editor-wrapper"
            text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
          >
            <div ref={boxRef} id={boundsId} style={editorStyle}/>
          </LoadingOverlay>
        )}
      </div>
      {!noToolbar && (
        <div className={classes.bottomSpacer}>&nbsp;</div>
      )}
    </div>
  );
}

QuillEditor2.propTypes = {
  marketId: PropTypes.string,
  value: PropTypes.string,
  onStoreChange: PropTypes.func,
  placeholder: PropTypes.string,
  uploadDisabled: PropTypes.bool,
  noToolbar: PropTypes.bool,
  setOperationInProgress: PropTypes.func,
  id: PropTypes.string.isRequired,
  simple: PropTypes.bool,
  participants: PropTypes.arrayOf(PropTypes.object),
  mentionsAllowed: PropTypes.bool,
  dontManageState: PropTypes.bool
};

QuillEditor2.defaultProps = {
  value: '',
  placeholder: '',
  marketId: undefined,
  dontManageState: false,
  uploadDisabled: false,
  noToolbar: false,
  simple: false,
  participants: [],
  mentionsAllowed: true,
};

export default QuillEditor2;