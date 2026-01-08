/**
 * A message passing based quill editor
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { useIntl } from 'react-intl';
import { makeStyles, useMediaQuery, useTheme } from '@material-ui/core'
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
import PropTypes from 'prop-types';
import { getNameForUrl, getUrlForTicketPath } from '../../utils/marketIdPathFunctions';
import ImageBlot from './ImageBlot';
import QuillEditorRegistry from './QuillEditorRegistry';
import {
  createEditor,
  getBoundsId
} from './Utilities/CoreUtils';
import { isTicketPath } from '../../contexts/TicketContext/ticketIndexContextHelper';
import { ticketContextHack } from '../../contexts/TicketContext/TicketIndexContext';
import { marketsContextHack } from '../../contexts/MarketsContext/MarketsContext';
import { commentsContextHack } from '../../contexts/CommentsContext/CommentsContext';
import { MyLink } from './Utilities/LinkUtils';

// https://github.com/derrickpelletier/react-loading-overlay/pull/57
LoadingOverlay.propTypes = undefined;
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
Quill.register(MyLink);
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
      nothing: {}
    };
  },
  { name: 'QuillEditorClasses' }
);

function QuillEditor2 (props) {

  const {
    id,
    cssId,
    value = '',
    uploadDisabled = false,
    noToolbar = false,
    simple = false,
    marketId,
    mentionsAllowed = false,
    placeholder = '',
    noOverflow,
    maxHeight,
    backgroundColor,
    buttons = React.Fragment
  } = props;
  const useCssId = cssId || id;
  const classes = useStyles();
  const containerRef = useRef();
  const boxRef = useRef();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const intl = useIntl();
  const theme = useTheme();
  const boundsId = getBoundsId(useCssId);
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));

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
          let url = link;
          const urlParts = new URL(url);
          if (isTicketPath(urlParts.pathname)) {
            const urlFromTicket = getUrlForTicketPath(urlParts.pathname, ticketContextHack, marketsContextHack,
              commentsContextHack);
            if (urlFromTicket) {
              url = urlFromTicket;
            }
          }
          //do we have nothing selected i.e. a zero length selection?
          if (selected.length === 0) {
            const index = selected ? selected.index : 0; // no position? do it at the front
            // if so, the selection is just the cursor position, so insert our new text there
            const name = getNameForUrl(link);
            editor.insertText(index, _.isEmpty(name) ? url : name, 'link', url, 'user');
            //refocus the editor because for some reason it moves to the top during insert
          } else {
            editor.format('link', url);
            // Remove selection or typing will erase the link text
            editor.setSelection(selected.index + selected.length, 0);
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
    backgroundColor: backgroundColor || (noToolbar ? undefined : 'white'),
    minHeight: noToolbar ? undefined : '8rem'
  };

  const containerStyle = {
    maxWidth: '100%',
    zIndex: '2',
    borderTop: '1px solid lightgrey',
  };

  const containerReadOnlyStyle = {
    maxWidth: '100%',
    zIndex: '2'
  };

  // callback wrapper. Really should
  // resolve the deps issue with create editor
  const editorCreator = useCallback(() => {
    const idReady = id != null;
    const containersReady = containerRef.current != null && boxRef.current != null;
    const ready = containersReady && idReady;
    if (ready) {
      // creating editor
      const editorConfig = {
        scrollingContainer: `#${useCssId}scroll`,
        boxRef,
        containerRef,
        marketId,
        layout: mobileLayout,
        noToolbar,
        onS3Upload,
        setUploadInProgress,
        setVideoDialogOpen,
        setLinkDialogOpen,
        simple,
        uploadDisabled,
        mentionsAllowed,
        boundsId,
        placeholder,
        value
      };
      createEditor(id, noToolbar ? value : undefined, editorConfig, false);
    }
    // This is probably a bad idea, but the create should be fine
    // due to the checks above (missing createEditor dep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileLayout, noToolbar, onS3Upload, setUploadInProgress, setVideoDialogOpen, setLinkDialogOpen, simple,
    uploadDisabled, mentionsAllowed, boundsId, boxRef, marketId, containerRef, placeholder, value
  ]);

  useEffect(() => {
    editorCreator();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (!boxRef || !boxRef.current) {
        // using boxRef to know if unmounted or not - don't want to remove if still mounted as will lose typing
        QuillEditorRegistry.remove(id);
      }
    };
  }, [id, editorCreator]);

  return (
    <div
      id={`${useCssId}scroll`}
      style={{
        maxHeight: maxHeight || (noOverflow ? undefined : '50vh'),
        overflowY: noOverflow ? undefined : 'auto',
      }}
    >
      {createVideoUi(id)}
      {createLinkUi(id)}
      <div
        ref={containerRef}
        className={noToolbar ? classes.root : classes.nothing}
        style={noToolbar ? containerReadOnlyStyle : containerStyle}
        id={useCssId}
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
            {buttons}
          </LoadingOverlay>
        )}
      </div>
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
  id: PropTypes.string.isRequired,
  simple: PropTypes.bool,
  mentionsAllowed: PropTypes.bool,
  dontManageState: PropTypes.bool
};

export default React.memo(QuillEditor2);