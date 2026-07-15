import _ from 'lodash';
import QuillEditorRegistry from '../QuillEditorRegistry';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../localStorageUtils'
import ReactDOMServer from 'react-dom/server'
import MentionListItem from '../CustomUI/MentionListItem'
import React from 'react'
import Quill from 'quill'
import Delta from 'quill-delta';

import { convertHTMLString } from '../ImageBlot';
import { pushMessage } from '../../../utils/MessageBusUtils'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { marketPresencesContextHack } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { investibleContextHack } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';


// static helper funcs

export function editorEmpty (originalContents) {
  if (_.isEmpty(originalContents)) {
    return true;
  }
  const contents = originalContents.replace(/[\n\r]+/g, '').replaceAll('<p>', '')
    .replaceAll('</p>', '').replaceAll('<br>', '').trim();
  return contents.length === 0;
}

function disableToolbarTabs (editorNode) {
  if (editorNode && editorNode.querySelectorAll) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *')
    toolbarButtons.forEach((button) => {
      if (button.tabIndex !== -1) {
        button.tabIndex = -1;
      }
    });
  } else {
    console.warn(editorNode);
  }
}


function isWhitespace (ch) {
  return (ch === ' ') || (ch === '\t') || (ch === '\n')
}

export function generateOnChangeHandler(editorId){
  const {editor} = QuillEditorRegistry.getEditor(editorId);
  if(!editor) {
    return () => {};
  }
  return _.debounce((delta) => {
    // URL stuff from https://github.com/quilljs/quill/issues/109
    const regex = /https?:\/\/[^\s]+$/
    if (delta.ops.length === 2 && delta.ops[0].retain && isWhitespace(delta.ops[1].insert)) {
      const endRetain = delta.ops[0].retain;
      const text = editor.getText().substr(0, endRetain);
      const match = text.match(regex);

      if (match !== null) {
        const url = match[0];

        const ops = [];
        if(endRetain > url.length) {
          ops.push({ retain: endRetain - url.length });
        }

        const retOps = ops.concat([
          { delete: url.length },
          { insert: url, attributes: { link: url } }
        ]);

        editor.updateContents({
          ops: retOps
        });
      }
    }
    const contents = editor.root.innerHTML;
    if (editorEmpty(contents)) {
      storeState(editorId, '');
      pushMessage(`editor-${editorId}`, { type: 'change', contents: ''});
    } else {
      storeState(editorId, contents);
      pushMessage(`editor-${editorId}`, { type: 'change', contents});
    }

  }, 50);

}

function setTooltip (toolbar, selector, title, title2) {
  if (toolbar) {
    if ((title2 && toolbar.querySelectorAll) || (!title2 && toolbar.querySelector)) {
      const selected = title2 ? toolbar.querySelectorAll(selector) : toolbar.querySelector(selector)
      if (selected) {
        if (title2) {
          selected[0] && selected[0].setAttribute('title', title)
          selected[1] && selected[1].setAttribute('title', title2)
        } else {
          selected.setAttribute('title', title)
        }
      }
    } else {
      console.warn(toolbar);
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
  setTooltip(toolbar, 'button.ql-divider', 'Divider');
  setTooltip(toolbar, 'button.ql-clear', 'Clear');
  setTooltip(toolbar, 'span.ql-color', 'Text Color');
  setTooltip(toolbar, 'span.ql-background', 'Background Color');
  setTooltip(toolbar, 'span.ql-align', 'Text Alignment');
  setTooltip(toolbar, 'span.ql-font', 'Font Style');
  setTooltip(toolbar, 'span.ql-header', 'Font Size');
  setTooltip(toolbar, 'button.ql-code-block', 'Code Block');
  setTooltip(toolbar, 'button.ql-script', 'Subscript', 'Superscript');
  setTooltip(toolbar, 'button.ql-indent', 'Unindent', 'Indent');
}




const OUR_CLOUDFRONT_FILE_PATTERN = /https:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
const OUR_CND_DOMAIN_ENDING = 'imagecdn.uclusion.com';

function removeToolbarTabs (editorNode) {
  if (editorNode && editorNode.querySelectorAll) {
    const toolbarButtons = editorNode.querySelectorAll('.ql-toolbar *')
    toolbarButtons.forEach((button) => {
      button.style.display = 'none'
      button.parentElement.style.display = 'none'
    });
  } else {
    console.warn(editorNode);
  }
}

/** Moves the Quill-generated toolbar out of the editor container and into the
 * dedicated toolbar ref, so it renders below the editor. Must run on every
 * editor creation (including resetEditor) since Quill builds a fresh toolbar.
 */
function relocateToolbar (containerNode, toolbarRef) {
  if (toolbarRef?.current && containerNode) {
    const toolbar = containerNode.querySelector('.ql-toolbar');
    if (toolbar) {
      toolbarRef.current.innerHTML = '';
      toolbarRef.current.appendChild(toolbar);
    }
  }
}


export function resetEditor(id, contents, configOverrides, hardReset=false) {
  storeState(id, null);
  if (id && (contents || configOverrides || hardReset)) {
    const { editor, config } = QuillEditorRegistry.getEditor(id);
    const fullConfig = {
      ...config,
      // Reseed value with the reset contents so a recreate can't fall back to a stale draft this editor
      // was originally opened with (e.g. "add and another" after editing a draft task).
      value: contents,
      configOverrides,
    }
    if (editor != null) {
      createEditor(id, contents, fullConfig, true); // recreate the editor, because we need brand new state
    }
  }
}

/** Returns the initial state of the editor,
 * preferring the known state over the stored state
 * and the disk state over the placeholder
 * @param id
 * @param knownState
 * @param placeHolder
 * @param ignoreStored
 */
function getDefaultContents (id, knownState, placeHolder, ignoreStored=false) {
  if (!ignoreStored) {
    const storedState = getUclusionLocalStorageItem(`editor-${id}`);
    if (storedState != null) {
      return storedState;
    }
  }
  if (knownState != null) {
    return knownState;
  }
  return placeHolder;
}

export function createEditor (id, editorContents, config, forceCreate) {
  const { editor: oldEditor, config: oldConfig } = QuillEditorRegistry.getEditor(id);
  if (oldConfig && oldEditor) {
    let isNotAutoForce = oldConfig.simple === config.simple && oldConfig.layout === config.layout && !config.noToolbar;
    if (oldConfig.placeholder !== config.placeholder && _.isEmpty(config.value)
      && _.isEmpty(getUclusionLocalStorageItem(`editor-${id}`))) {
      isNotAutoForce = false;
    }
    // we need to rebuild the editor if we were rendered somewhere else under the same Id
    if (oldConfig.boxRef !== config.boxRef || oldConfig.containerRef !== config.containerRef) {
      isNotAutoForce = false
    }
    if (isNotAutoForce) {
      // noToolbar is read only and read only must be recreated each time or doesn't render
      if (!forceCreate) {
        return; // already made the editor
      }
    }
  }


  const {
    boxRef,
    containerRef,
    value,
    placeholder,
    noToolbar
  } = config;

  const defaultContents = getDefaultContents(id, value, placeholder, noToolbar)

  // we only set the contents if different from the placeholder
  // otherwise the placeholder functionality of the editor won't work
  removeToolbarTabs(containerRef.current)

  const editorOptions = generateEditorOptions(id, config);
  const isSetEditorContents = editorContents !== undefined;
  const isSetDefaultContents = !(placeholder === defaultContents) && defaultContents;
  if (boxRef.current && !isSetEditorContents && !isSetDefaultContents) {
    // React is re-using the boxRef even if params change so need to clear
    boxRef.current.innerHTML = '';
  }
  const editor = new Quill(boxRef.current, editorOptions);
  // this matcher prevents the quill editor from collapsing spaces
  // with it's default text parsing
  editor.clipboard.addMatcher(Node.TEXT_NODE, (node, data) => {
    return new Delta().insert(node.data);
  });
  if (isSetEditorContents) {
    // Unfortunately this will cause loss of focus
    editor.clipboard.dangerouslyPasteHTML(convertHTMLString(editorContents));
  } else if (isSetDefaultContents) {
    editor.clipboard.dangerouslyPasteHTML((defaultContents));
  }

  QuillEditorRegistry.setEditor(id, editor, config);
  if (!noToolbar) {
    if (editor.container) {
      addToolTips(editor.container.previousSibling)
    }
    disableToolbarTabs(containerRef.current)
    relocateToolbar(containerRef.current, config.toolbarRef)
  }
  const onChange = generateOnChangeHandler(id);


  const imageDeleteDetector = (delta, oldContents) => {
    const newContents = editor.getContents();
    const diff = newContents.diff(oldContents);
    // if the old contents had an image insert and the new doesn't it was deleted
    const deletedImages = diff.ops?.filter((op) => {
      return op.insert?.image != null;
    });
    if(!_.isEmpty(deletedImages)){
      pushMessage(`editor-${id}`, { type: 'image-deletion', contents: deletedImages});
    }
  }
  editor.on('text-change', onChange);
  editor.on('text-change', imageDeleteDetector);

}

export function storeState (id, state) {
  if (_.isEmpty(state)) {
    setUclusionLocalStorageItem(`editor-${id}`, state);
  } else {
    //Remove tokens here that were added in ImageBlot Quill format
    const regexp = /img src\s*=\s*"(.+?)"/g;
    const newStr = state.replace(regexp, (match, p1) => {
      const cloudfrontMatch = p1.match(OUR_CLOUDFRONT_FILE_PATTERN);
      const cdnMatch = p1.includes(OUR_CND_DOMAIN_ENDING);
      if (!cloudfrontMatch && !cdnMatch) {
        return `img src="${p1}"`;
      }
      const url = new URL(p1);
      const params = new URLSearchParams(url.search);
      params.delete('authorization');
      url.search = params.toString();
      return `img src="${url.toString()}"`;
    });
    setUclusionLocalStorageItem(`editor-${id}`, newStr);
  }
}

export function getBoundsId(id){
  return `editorBox-${id}`;
}

export function focusEditor (id) {
  const boundsId = getBoundsId(id);
  const container = document.getElementById(boundsId);
  if (!_.isEmpty(container?.children)) {
    container.children[0].click()
  }
  const {editor} = QuillEditorRegistry.getEditor(id);
  editor?.focus()
}

export function replaceEditorContents(contents, id) {
  const {editor} = QuillEditorRegistry.getEditor(id);
  if(!editor){
    return;
  }
  editor.setContents({insert: contents});
  storeState(id, contents);
}



export function getQuillStoredState(id) {
  return getUclusionLocalStorageItem(`editor-${id}`);
}


/**
 * Takes our properties and generates a quill options object
 * that configures the editor to what the properties imply.
 * @returns the quill options for the editor
 * */
export function generateEditorOptions (id, config) {
  const {
    marketId,
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
    scrollingContainer,
    layout
  } = config;

  if (noToolbar) {
    return {
      modules: {
        toolbar: false
      },
      readOnly: true,
      theme: 'snow'
    }
  }
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
            const {editor} = QuillEditorRegistry.getEditor(id);
            editor.format('link', false);
          }
        },
        'divider': () => {
          const {editor} = QuillEditorRegistry.getEditor(id);
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, 'divider', true, 'user');
          editor.setSelection(range.index + 1, 0, 'silent');
        },
        // Clear the whole editor (T-all-2168 / S-1). Editor-only control; the
        // text-change pipeline empties the stored draft too.
        'clear': () => {
          const {editor} = QuillEditorRegistry.getEditor(id);
          editor.setText('', 'user');
          editor.focus();
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
        ['link', 'code-block', 'image', 'video', 'divider'],
        ['table'],
        ['clean'],
        ['clear'],
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
      },
      onUploadStop: () => {
        setUploadInProgress(false);
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
      ['clear'],
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
      ['link', 'code-block', 'divider'],
      ['table'],
      ['clean'],
      ['clear'],
    ];
    modules.s3Upload = false;
    modules.imageResize = false;
  }

  if (layout) {
    // Mobile: drop the table button to save toolbar space so the controls stay
    // within fewer rows (T-all-2168 / C-all-1003).
    modules.toolbar.container = modules.toolbar.container
      .map((group) => group.filter((item) => item !== 'table'))
      .filter((group) => group.length > 0);
  }

  if (mentionsAllowed) {
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
      // J-all-348: '#' mentions a job (Q-all-224 O-1). Job names and ticket codes need spaces,
      // dashes and periods, which people mentions do not allow
      mentionDenotationChars: ['@', '#'],
      allowedChars: (mentionChar) => mentionChar === '#' ? /^[a-zA-Z0-9_\- .]*$/ : /^[a-zA-Z0-9_]*$/,
      renderItem: function (item) {
        // we want an html string here which gets slammed into inner html, so we have to do some trickery
        // to let react render the result
        return ReactDOMServer.renderToString(<MentionListItem mentionResult={item}/>);
      },
      source: function (searchTerm, renderList, mentionChar) {
        // J-all-348: the default 270px container wraps job names - widen the '#' list so an
        // 80 character name fits on one line, and restore the CSS default for '@' people
        const mentionModule = QuillEditorRegistry.getEditor(id).editor?.getModule('mention');
        if (mentionModule?.mentionContainer) {
          mentionModule.mentionContainer.style.width = mentionChar === '#' ? 'min(85ch, 90vw)' : '';
          mentionModule.mentionContainer.style.fontSize = mentionChar === '#' ? '16px' : '';
        }
        if (mentionChar === '#') {
          // J-all-348 (Q-all-226 O-1): every job in the workspace, matched on name or ticket code
          const investiblesRaw = getMarketInvestibles(investibleContextHack, marketId) || [];
          const jobs = [];
          investiblesRaw.forEach((inv) => {
            const marketInfo = getMarketInfo(inv, marketId);
            if (marketInfo && !marketInfo.deleted) {
              const { name, id } = inv.investible;
              const ticketCode = marketInfo.ticket_code ? decodeURI(marketInfo.ticket_code) : '';
              if (searchTerm.length === 0 || name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticketCode.toLowerCase().includes(searchTerm.toLowerCase())) {
                // Q-all-227: the link is the same ticket code URL InvesibleCommentLinker copies,
                // absolute because onSelect feeds it through the paste handler which only
                // link-ifies absolute URLs
                const link = `${window.location.protocol}//${window.location.host}${marketInfo.ticket_code ?
                  `/${marketId}/${marketInfo.ticket_code}` : formInvestibleLink(marketId, id)}`;
                jobs.push({ id, value: name, ticketCode, isJob: true, link });
              }
            }
          });
          // S-1 under Q-all-224: each list teaches the other trigger via a disabled hint row
          renderList([{ id: 'jobsMentionHint', value: 'use @ for people', disabled: true },
            ..._.orderBy(jobs, [(job) => job.value.toLowerCase()])], searchTerm);
          return;
        }
        const participantsRaw = getMarketPresences(marketPresencesContextHack, marketId) || [];
        const participants = participantsRaw.filter((presence) => !_.isEmpty(presence.email));
        const peopleHint = { id: 'peopleMentionHint', value: 'use # for jobs', disabled: true };
        if (searchTerm.length === 0) {
          renderList([peopleHint, ...participants.map((presence) => {
            const { name, id, email, external_id } = presence;
            return { id, value: name, email, externalId: external_id };
          })], searchTerm);
        } else {
          const matches = [];
          participants.forEach((presence) => {
            const { name, id, email, external_id } = presence;
            if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
              matches.push({ id, value: name, email, externalId: external_id });
            }
          });
          renderList([peopleHint, ...matches], searchTerm);
        }
      },
      onSelect: function (item, insertItem) {
        // J-all-348 (Q-all-227): selecting a job replaces the typed '#term' with a paste of the
        // linker URL through the real paste handler (CustomQuillClipboard.onCapturePaste), so a
        // job mention and a hand-pasted InvesibleCommentLinker link cannot behave differently
        if (item.denotationChar === '#') {
          const { editor } = QuillEditorRegistry.getEditor(id);
          const mention = editor.getModule('mention');
          editor.deleteText(mention.mentionCharPos, mention.cursorPos - mention.mentionCharPos, 'user');
          editor.setSelection(mention.mentionCharPos, 0, 'user');
          editor.clipboard.onCapturePaste({
            preventDefault: () => {},
            clipboardData: { getData: (type) => type === 'text/plain' ? item.link : '' }
          });
        } else {
          insertItem(item);
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
    scrollingContainer,
  };
}
