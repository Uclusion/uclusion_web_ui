/**
 * A message passing based quill editor
 */

import React, { useContext, useEffect, useRef, useState } from 'react';
import LoadingOverlay from 'react-loading-overlay';
import { useIntl } from 'react-intl';
import { useTheme } from '@material-ui/core';
import { isTinyWindow } from '../../utils/windowUtils';
import { pushMessage, registerListener } from '../../utils/MessageBusUtils';
import _ from 'lodash';
import ReactDOMServer from 'react-dom/server';
import MentionListItem from './CustomUI/MentionListItem';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../utils';
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


// install our filtering paste module, and disable the uploader
Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);

Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/mention', QuillMention);
Quill.register(CustomCodeBlock, true);

// static helper funcs

function editorEmpty (contents) {
  return (contents.length === 0 || contents === '<p></p>' || contents === '<p><br></p>');
}

function disableToolbarTabs (editorNode) {
  const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *');
  toolbarButtons.forEach((button) => {
    button.tabIndex = -1;
  });
}

function setTooltip (toolbar, selector, title, title2) {
  const selected = title2 ? toolbar.querySelectorAll(selector) : toolbar.querySelector(selector);
  if (selected) {
    if (title2) {
      selected[0] && selected[0].setAttribute('title', title);
      selected[1] && selected[1].setAttribute('title', title2);
    } else {
      selected.setAttribute('title', title);
    }
  }
}

/** Adds the tooltips
 * to the items in the toolbar.
 */
function addToolTips (toolbar) {
  setTooltip(toolbar, 'button.ql-bold', 'Bold');
  setTooltip(toolbar, 'button.ql-italic', 'Italic');
  setTooltip(toolbar, 'button.ql-link', 'Link');
  setTooltip(toolbar, 'button.ql-clean', 'Clear Formatting');
  setTooltip(toolbar, 'button.ql-image', 'Image');
  setTooltip(toolbar, 'button.ql-video', 'Video or Loom Link');
  setTooltip(toolbar, 'button.ql-underline', 'Underline');
  setTooltip(toolbar, 'button.ql-strike', 'Strike');
  setTooltip(toolbar, 'button.ql-list', 'Number List', 'Bullet List');
  setTooltip(toolbar, 'button.ql-table', 'Table');
  setTooltip(toolbar, 'span.ql-color', 'Text Color');
  setTooltip(toolbar, 'span.ql-background', 'Background Color');
  setTooltip(toolbar, 'span.ql-align', 'Text Alignment');
  setTooltip(toolbar, 'span.ql-font', 'Font Style');
  setTooltip(toolbar, 'span.ql-header', 'Font Size');
  setTooltip(toolbar, 'button.ql-code-block', 'Code Block');
  setTooltip(toolbar, 'button.ql-script', 'Subscript', 'Superscript');
  setTooltip(toolbar, 'button.ql-indent', 'Unindent', 'Indent');
}

/** Returns the initial state of the editor,
 * preferring the known state over the stored state
 * and the disk state over the placeholder
 * @param id
 * @param knownState
 * @param placeHolder
 */
function getInitialState (id, knownState, placeHolder) {
  const storedState = getUclusionLocalStorageItem(`editor-${id}`);
  if (storedState != null) {
    return storedState
  }
  if (knownState != null) {
    return knownState;
  }
  return placeHolder;
}

function storeState (id, state) {
  setUclusionLocalStorageItem(`editor-${id}`, state);
}


function QuillEditor2 (props) {

  const {
    id,
    cssId,
    value,
    marketId,
    placeholder,
    uploadDisabled,
    noToolbar,
    simple,
    participants,
    mentionsAllowed,
    children,
    dontManageState,
  } = props;

  const containerRef = useRef();
  const boxRef = useRef();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editor, setEditor] = useState(null);
  const intl = useIntl();
  const theme = useTheme();
  const [, setOperationInProgress] = useContext(OperationInProgressContext);
  const boundsId = `editorBox-${id || marketId}`;

  const initialContents = getInitialState(id, value, placeholder);
  const usingPlaceholder = placeholder === initialContents;

  function focusEditor(){
    if (!_.isEmpty(boxRef?.current?.children)) {
      boxRef.current.children[0].click();
    }
    editor && editor.focus();
  }

  function updateState(state) {
    if (!dontManageState) {
      storeState(id, state);
    }
  }

  function resetHandler(){
    console.error(`resetting ${id}`);
    storeState(id, null);
    editor.history.clear();
    editor.setContents({insert: ''});
    focusEditor();
  }


  registerListener(`editor-${id}-control-plane`, id, (message) => {
    const {
      type,
      contents
    } = message.payload;
    switch (type) {
      case 'reset':
        return resetHandler();
      case 'update':
        return replaceEditorContents(contents);
      case 'focus':
        return focusEditor();
      default:
        // do nothing;
    }
  })

  function replaceEditorContents(contents) {
    editor.setContents({insert: contents});
    updateState(id, contents);
  }
  /**
   * The UI for videos is quite poor, so we need
   * to replace it with ours
   */
  function createVideoUi () {
    return (
      <VideoDialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        onSave={(link) => {
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
  function createLinkUi () {
    return (
      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onSave={(link) => {
        //  console.error(link);
          // if they haven't got anything selected, just get the current
          // position and insert the url as the text,
          // otherwise just format the current selection as a link
          const selected = editor.getSelection(true);
          // console.error(selected);
          //do we have nothing selected i.e. a zero length selection?
          if (selected.length === 0) {
            const index = selected ? selected.index : 0; // no position? do it at the front
            // if so, the selection is just the cursor position, so insert our new text there
            editor.insertText(index, link, 'link', link, 'user');
            //refocus the editor because for some reason it moves to the top during insert
          } else {
            //  console.error('adding link' + link);
            editor.format('link', link);
          }
        }}
      />
    );
  }


  /**
   * Takes our properties and generates a quill options object
   * that configures the editor to what the properties imply.
   * @returns the quill options for the editor
   * */
  function generateEditorOptions () {
    // CSS id of the container from which scroll and bounds checks operate
    const defaultModules = {
      toolbar: {
        handlers: {
          'video': () => {
            setVideoDialogOpen(true);
          },
          'link': (value) => {
            if (value) {
              setLinkDialogOpen(true);
            } else {
              editor.format('link', false);
            }
          }
        },
        //for various reasons, the array form is stored in the container property when you're
        // passing in an object for the toolbar
        container: [
          [{ font: [] }],
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'code-block', 'image', 'video'],
          ['table'],
          ['clean'],
        ]
      },
      imageResize: {
        modules: ['Resize', 'DisplaySize'],
      },
      s3Upload: {
        marketId,
        onS3Upload,
        onUploadStart: () => {
          setUploadInProgress(true);
          setOperationInProgress(true);
        },
        onUploadStop: () => {
          setUploadInProgress(false);
          setOperationInProgress(false);
        },
      },

      table: true,
      tableUI: true,
      keyboard: {
        bindings: {
          'tab': {
            key: 9,
            handler: function (range, context) {
              return true;
            }
          }
        }
      }
    };
    const modules = { ...defaultModules };
    if (simple) {
      modules.toolbar.container = [
        ['bold', 'italic', 'underline', 'strike'],
        ['link', 'code-block'],
        ['clean'],
      ];
      modules.s3Upload = false;
      modules.imageResize = false;
    }
    if (uploadDisabled && !simple) {
      modules.toolbar.container = [
        [{ font: [] }],
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'code-block'],
        ['table'],
        ['clean'],
      ];
      modules.s3Upload = false;
      modules.imageResize = false;
    }

    if (isTinyWindow()) {
      modules.toolbar.container = [
        ['bold', 'italic', 'link', 'image', 'video', 'clean'],
      ];
    }

    if (noToolbar) {
      modules.toolbar = false;
    }

    if (!_.isEmpty(participants) && mentionsAllowed) {
      /* Note, due to lifecycles if they edit a comment begin creating a mention
        and hit save before selecting one (or clicking off to not do so), then
        the mention menu will stick open. Fixing this would require fairly
        invasive surgery to the mention module and some way in this code to know you've
        exited edit mode. Hence we're not fixing it as of 01/20/21
       */
      modules.mention = {
        isolateCharacter: true,
        dataAttributes: ['id', 'value', 'denotationChar', 'link', 'target', 'externalId'],
        positioningStrategy: 'fixed',
        renderItem: function (item) {
          // we want an html string here which gets slammed into inner html, so we have to do some trickery
          // to let react render the result
          return ReactDOMServer.renderToString(<MentionListItem mentionResult={item}/>);
        },
        source: function (searchTerm, renderList) {
          if (searchTerm.length === 0) {
            renderList(participants.map((presence) => {
              const { name, id, email, external_id } = presence;
              return { id, value: name, email, externalId: external_id };
            }), searchTerm);
          } else {
            const matches = [];
            participants.forEach((presence) => {
              const { name, id, email, external_id } = presence;
              if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({ id, value: name, email, externalId: external_id });
              }
            });
            renderList(matches, searchTerm);
          }
        }
      };
    }

    return {
      modules,
      placeholder,
      readOnly: false,
      theme: 'snow',
      bounds: `#${boundsId}`,
      // sets the element responsible for scroll
      scrollingContainer: `#${boundsId}`,
    };
  }

  function onS3Upload (metadatas) {
    const newUploads = [...uploadedFiles, ...metadatas];
    setUploadedFiles(newUploads);
    pushMessage(`editor-${id}`, { type: 'uploads', newUploads });
  }

  function onChange (contents, delta) {
    updateState(id, contents);
    pushMessage(`editor-${id}`, {type: 'update', contents, delta});
  }

  function createEditor () {
    // we only set the contents if different from the placeholder
    // otherwise the placeholder functionality of the editor won't work
    if(boxRef.current && !usingPlaceholder && initialContents) {
      boxRef.current.innerHTML = initialContents;
    }
    const editorOptions = generateEditorOptions();
    const editor = new Quill(boxRef.current, editorOptions);
    addToolTips(editor.container.previousSibling);
    disableToolbarTabs(containerRef.current);
    const debouncedOnChange = _.debounce((delta) => {
      const contents = editor.root.innerHTML;
      if (editorEmpty(contents)) {
        onChange('', delta);
      } else {
        onChange(contents, delta);
      }
    }, 50);
    editor.on('text-change', debouncedOnChange)
    setEditor(editor);
  }

  // bridge our fonts in from the theme;
  const editorStyle = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    maxHeight: '425px',
    overflow: 'scroll',
    overflowX: 'hidden',
  };

  useEffect(() => {
    if(!editor) {
      createEditor();
    }
  });

  return (
    <div>
      {createVideoUi()}
      {createLinkUi()}
      <div
        ref={containerRef}
        style={{ maxWidth: '100%', zIndex: '2', borderTop: '1px solid lightgrey' }}
        id={cssId}
      >
        <LoadingOverlay
          active={uploadInProgress}
          spinner
          className="editor-wrapper"
          text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
        >
          <div ref={boxRef} id={boundsId} style={editorStyle}/>
        </LoadingOverlay>
      </div>
      {isTinyWindow() && <div style={{ height: '40px' }}>&nbsp;</div>}
      <div>
        {children}
      </div>
    </div>
  );
}

QuillEditor2.propTypes = {
  marketId: PropTypes.string,
  onS3Upload: PropTypes.func,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onStoreChange: PropTypes.func,
  placeholder: PropTypes.string,
  uploadDisabled: PropTypes.bool,
  noToolbar: PropTypes.bool,
  setOperationInProgress: PropTypes.func,
  getUrlName: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  id: PropTypes.string,
  simple: PropTypes.bool,
  participants: PropTypes.arrayOf(PropTypes.object),
  mentionsAllowed: PropTypes.bool,
};

QuillEditor2.defaultProps = {
  onS3Upload: () => {
  },
  onChange: () => {
  },
  value: '',
  placeholder: '',
  marketId: undefined,
  uploadDisabled: false,
  noToolbar: false,
  id: undefined,
  simple: false,
  participants: [],
  mentionsAllowed: true,
};

export default QuillEditor2;