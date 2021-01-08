/** A simple wrapper around the quill editor that passes props
 through, and sets up some of the options we'll always want
 **/
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import LoadingOverlay from 'react-loading-overlay';
import ImageResize from 'quill-image-resize-module-withfix';
import QuillS3ImageUploader from './QuillS3ImageUploader';
import NoOpUploader from './NoOpUploader';
import CustomQuillClipboard from './CustomQuillClipboard';
import CustomCodeBlock from './CustomCodeBlock';
import QuillTableUI from 'quill-table-ui';
import 'quill/dist/quill.snow.css';
import 'quill-table-ui/dist/index.css';
import './editorStyles.css';
import _ from 'lodash';
import { injectIntl, useIntl } from 'react-intl';
import { withTheme } from '@material-ui/core';
import { isTinyWindow } from '../../utils/windowUtils';
import { addQuillLinkFixer } from './Utilities/LinkUtils';
import VideoDialog from './CustomUI/VideoDialog';
import { embeddifyVideoLink } from './Utilities/VideoUtils';
import LinkDialog from './CustomUI/LinkDialog';
import QuillMention from 'quill-mention-uclusion';
import Quill from 'quill';
// install our filtering paste module, and disable the uploader

Quill.register('modules/clipboard', CustomQuillClipboard, true);
Quill.register('modules/uploader', NoOpUploader, true);
Quill.register('modules/tableUI', QuillTableUI);
Quill.register('modules/s3Upload', QuillS3ImageUploader);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/mention', QuillMention);
Quill.register(CustomCodeBlock, true);

function editorEmpty (contents) {
  return (contents.length === 0 || contents === '<p></p>' || contents === '<p><br></p>');
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

const uploadLessToolbar = [
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

const simplifiedToolBar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['link', 'code-block'],
  ['clean'],
];

const tinyToolBar = [
  ['bold', 'italic', 'link', 'image', 'video', 'clean'],
];

// code derived from https://github.com/quilljs/quill/issues/1447
function QuillEditor (props) {

  const {
    onChange,
    defaultValue,
    children,
    theme,
    id,
    getUrlName,
    placeHolder,
    setEditorClearFunc,
  } = props;
  const intl = useIntl();
  const [uploads, setUploads] = useState([]);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const editorOptions = generateEditorOptions();

  const editorContainer = useRef();
  const quillRef = useRef();


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
          quill.format('video', embedded);
        }}
      />
    );
  }

  /**
   * The UI for links is quite poor, so we need
   * to replace it with ours
   */
  function createLinkUi () {
    return (
      <LinkDialog
        open={linkDialogOpen}
        onClose={() => this.setState({ linkDialogOpen: false })}
        onSave={(link) => {
          // if they haven't got anything selected, just get the current
          // position and insert the url as the text,
          // otherwise just format the current selection as a link
          const selected = this.editor.getSelection(true);
          //do we have nothing selected i.e. a zero length selection?
          if (selected.length === 0) {
            const index = selected ? selected.index : 0; // no position? do it at the front
            // if so, the selection is just the cursor position, so insert our new text there
            quill.insertText(index, link, 'link', link, 'user');
            //refocus the editor because for some reason it moves to the top during insert
          } else {
            //  console.error('adding link' + link);
            quill.format('link', link);
          }
        }}
      />
    );
  }

  function disableToolbarTabs (editorNode) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *');
    toolbarButtons.forEach((button) => {
      button.tabIndex = -1;
    });
  }

  // instantiate the quill, and only pay attention to changes in quill itself for sanity's sake
  useEffect(() => {
    /** Adds the tooltips
     * to the items in the toolbar.
     */

    function addToolTips (quill) {
      const toolbar = quill.container.previousSibling;
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

    // make sure we have the container, and if so check if quill exists
    if (quillRef.current) {
      disableToolbarTabs(quillRef.current);
      const quill = new Quill(quillRef.current, editorOptions);
      //set up our link fixing
      addQuillLinkFixer();
      //addToolTips(quill);
      const debouncedOnChange = _.debounce((delta) => {
        const contents = quill.root.innerHTML;
        if (editorEmpty(contents)) {
          onChange('', delta);
        } else {
          onChange(contents, delta);
        }
      }, 50);
      quill.on('text-change', debouncedOnChange);
      // register our modules if we've not created the editor yet
      // we have the editor, register our on change handlers
      // and our url magic
      quill.getUrlName = getUrlName;
      // since we have a handle
      function editorClear () {
        console.error('editorClearInvoked');
        // this might not really work, zo C-Z will undo the clear, but it's still better than nothing
        quill.history.clear();
        quill.root.innerHTML = '';
        quill.setContents([{ insert: '' }]);
        if (placeHolder) {
          const el = quillRef.current.firstChild;
          el.setAttribute('data-placeholder', placeHolder);
        }
        if (!_.isEmpty(quillRef.current.children)) {
          quillRef.current.children[0].click();
        }
        quill.focus();
      }
      setEditorClearFunc(() => editorClear);
    }
  }, [onChange, quillRef, getUrlName, setEditorClearFunc, placeHolder, editorOptions, defaultValue]);

  /**
   * Takes our properties and generates a quill options object
   * that configures the editor to what the properties imply.
   * @returns the quill options for the editor
   * */
  function generateEditorOptions () {
    const {
      marketId,
      placeholder,
      uploadDisabled,
      noToolbar,
      simple,
      setOperationInProgress,
      participants,
    } = props;
    // CSS id of the container from which scroll and bounds checks operate
    const boundsId = getBoundsId();
    const defaultModules = {
      toolbar: {
        handlers: {
          'video': () => {
            setLinkDialogOpen(true);
          },
          // we want a function for it's binding effects below instead of an arrow function
          'link': function (value) {
            console.error(value);
            if (value) {
              setLinkDialogOpen(true);
            } else {
              // handlers are bound to the toolbar
              // so the this is pointed to quill _after_ initialization
              this.quill.format('link', false);
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
        onS3Upload: handleUploads,
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
      modules.toolbar = simplifiedToolBar;
      modules.s3Upload = false;
      modules.imageResize = false;
    }
    if (uploadDisabled && !simple) {
      modules.toolbar = uploadLessToolbar;
      modules.s3Upload = false;
      modules.imageResize = false;
    }

    if (isTinyWindow()) {
      modules.toolbar = tinyToolBar;
    }

    if (noToolbar) {
      modules.toolbar = false;
    }

    // Include the mention module if we have participants that we can mention
    if (!_.isEmpty(participants)) {
      modules.mention = {
        positioningStrategy: 'fixed',
        source: function (searchTerm, renderList) {
          if (searchTerm.length === 0) {
            renderList(participants.map((presence) => ({ id: presence.id, value: presence.name })), searchTerm);
          } else {
            const matches = [];
            participants.forEach((participant) => {
              const { name, id } = participant;
              if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
                matches.push({ id, value: name });
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

  function getBoundsId () {
    const { id, marketId } = props;
    // quill will constrain ui elements to the boundaries
    // of the element specified in the bounds parameter
    // which in our case is a css id
    return `editorBox-${id || marketId}`;
  }

  function handleUploads (metadatas) {
    const newUploads = [...uploads, ...metadatas];
    setUploads(newUploads);
    const { onS3Upload } = props;
    if (onS3Upload) {
      onS3Upload(newUploads);
    }
  }

  // quill will constrain ui elements to the boundaries
  // of the element specified in the bounds parameter
  // which in our case is a css id
  const boundsId = getBoundsId();
  const editorStyle = {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    maxHeight: '425px',
    overflow: 'scroll',
    overflowX: 'hidden',
  };

  return (
    <div>
      {createVideoUi()}
      {createLinkUi()}
      <div ref={editorContainer} style={{ maxWidth: '100%', zIndex: '2', borderTop: '1px solid lightgrey' }} id={id}>
        <LoadingOverlay
          active={uploadInProgress}
          spinner
          className="editor-wrapper"
          text={intl.formatMessage({ id: 'quillEditorUploadInProgress' })}
        >
          <div ref={quillRef} id={boundsId} style={editorStyle}/>
        </LoadingOverlay>
      </div>
      {isTinyWindow() && <div style={{ height: '40px' }}>&nbsp;</div>}
      <div>
        {children}
      </div>
    </div>
  );
}

QuillEditor.propTypes = {
  marketId: PropTypes.string,
  onS3Upload: PropTypes.func,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  onStoreChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  uploadDisabled: PropTypes.bool,
  noToolbar: PropTypes.bool,
  setOperationInProgress: PropTypes.func,
  getUrlName: PropTypes.func.isRequired,
  id: PropTypes.string,
  setEditorClearFunc: PropTypes.func,
  setEditorFocusFunc: PropTypes.func,
  setEditorDefaultFunc: PropTypes.func,
  simple: PropTypes.bool,
  participants: PropTypes.arrayOf(PropTypes.object),
};

QuillEditor.defaultProps = {
  onS3Upload: () => {
  },
  onChange: () => {
  },
  onStoreChange: () => {
  },
  setOperationInProgress: () => {
  },
  setEditorClearFunc: () => {
  },
  setEditorFocusFunc: () => {
  },
  setEditorDefaultFunc: () => {
  },
  defaultValue: '',
  placeholder: '',
  marketId: undefined,
  uploadDisabled: false,
  noToolbar: false,
  id: undefined,
  simple: false,
  participants: [],
};

export default QuillEditor;
