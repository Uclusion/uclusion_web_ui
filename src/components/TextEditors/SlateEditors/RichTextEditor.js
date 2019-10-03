/**
 * Shamelessly cribbed from https://github.com/ianstormtaylor/slate, Portions Copyright Uclusion Inc, 2018-Present. All rights reserved for Uclusion portions.
 * License for slate code as presented in slate's ;=license.md reproduced here
 *

 The MIT License

 Copyright © 2016–2017, Ian Storm Taylor

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

import { Editor, getEventRange, getEventTransfer } from 'slate-react';
import { Block } from 'slate';
import imageExtensions from 'image-extensions';
import isUrl from 'is-url';
import React from 'react';
import { injectIntl } from 'react-intl';
import {
  Button as MaterialButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import { isKeyHotkey } from 'is-hotkey';
import { withRouter } from 'react-router-dom';
import { Button, Icon, Toolbar } from './components';
import LoadableImage from './LoadableImage';
import { uploadFileToS3 } from '../../../api/files';
import { getMarketId } from '../../../utils/marketIdPathFunctions';

/** This portion is from the image example, so we'll also support images!
 *
 */

/*
 * A function to determine whether a URL has an image extension.
 *
 * @param {String} url
 * @return {Boolean}
 */

function isImage(url) {
  return !!imageExtensions.find((ending) => url.endsWith(ending));
}

/* end image example portion */

/**
 * Define the default node type.
 *
 * @type {String}
 */

const DEFAULT_NODE = 'paragraph';

/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */

const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

/**
 * A change function to standardize inserting images.
 *
 * @param {Editor} editor
 * @param {String} src
 * @param {Range} target
 */

function insertImage(editor, metadata, target) {
  if (target) {
    editor.select(target);
  }
  // console.log(metadata);
  editor.insertBlock({
    type: 'image',
    data: { metadata },
  });
}

/**
 * A change helper to standardize wrapping links.
 *
 * @param {Editor} editor
 * @param {String} href
 */

function wrapLink(editor, href) {
  editor.wrapInline({
    type: 'link',
    data: { href },
  });

  editor.moveToEnd();
}

/**
 * A change helper to standardize unwrapping links.
 *
 * @param {Editor} editor
 */

function unwrapLink(editor) {
  editor.unwrapInline('link');
}

const schema = {
  document: {
    last: { type: 'paragraph' },
    normalize: (editor, { code, node, child }) => {
      switch (code) {
        case 'last_child_type_invalid': {
          const paragraph = Block.create('paragraph');
          return editor.insertNodeByKey(node.key, node.nodes.size, paragraph);
        }
        default:
          return undefined;
      }
    },
  },
  blocks: {
    image: {
      isVoid: true,
    },
  },
};

const DialogTypes = {
  LINK: 'link',
  LINK_WITH_TEXT: 'link_with_text',
};

/**
 * The rich text example.
 *
 * @type {Component}
 */

class RichTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dialog: null,
      link: '',
      linkText: '',
    };
  }
  /**
   * Check if the current selection has a mark with `type` in it.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasMark = (type) => {
    const { value } = this.props;
    return value.activeMarks.some((mark) => mark.type === type);
  };

  /**
   * Check if the any of the currently selected blocks are of `type`.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasBlock = (type) => {
    const { value } = this.props;
    return value.blocks.some((node) => node.type === type);
  };

  /**
   * Check whether the current selection has a link in it.
   *
   * @return {Boolean} hasLinks
   */

  hasLinks = () => {
    const { value } = this.props;
    return value.inlines.some((inline) => inline.type === 'link');
  };

  /**
   * Store a reference to the `editor`.
   *
   * @param {Editor} editor
   */

  ref = (editor) => {
    this.editor = editor;
  };

  toolBar = () => {
    const { readOnly } = this.props;
    if (readOnly) {
      return null;
    }
    return (
      <div>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <Toolbar>
          {this.renderMarkButton('bold', 'format_bold')}
          {this.renderMarkButton('italic', 'format_italic')}
          {this.renderMarkButton('underlined', 'format_underlined')}
          {this.renderMarkButton('code', 'code')}
          {this.renderBlockButton('heading-one', 'looks_one')}
          {this.renderBlockButton('heading-two', 'looks_two')}
          {this.renderBlockButton('block-quote', 'format_quote')}
          {this.renderBlockButton('numbered-list', 'format_list_numbered')}
          {this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
          {this.renderImageButton()}
          {this.renderLinkButton()}
        </Toolbar>
      </div>
    );
  };

  handleChangeDialogValue = (name) => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleCloseDialog = () => {
    this.setState({ dialog: null });
  };

  handleSaveLink = () => {
    const { dialog, link, linkText } = this.state;

    this.setState({ dialog: null }, () => {
      if (dialog === DialogTypes.LINK) {
        if (!link.trim()) return;
        this.editor.command(wrapLink, link);
      } else if (dialog === DialogTypes.LINK_WITH_TEXT) {
        if (!link.trim()) return;
        if (!linkText.trim()) return;
        this.editor
          .insertText(linkText)
          .moveFocusBackward(linkText.length)
          .command(wrapLink, link);
      }
    });
  };


  handleImageUpload = () => {
    const uploader = this.refs.fileUploader;
    this.insertImagesFromFiles(uploader.files);
    uploader.value = '';
  };


  /**
   * Render.
   *
   * @return {Element}
   */

  render() {
    const {
      value, onChange, readOnly, placeHolder, intl,
    } = this.props;
    const { dialog, link, linkText } = this.state;
    return (
      <div style={{ width: '100%' }}>
        <input
          type="file"
          id="fileElem"
          multiple
          accept="image/*"
          ref="fileUploader"
          style={{ display: 'none' }}
          onChange={() => this.handleImageUpload()}
        />
        {this.toolBar()}
        <Typography
          style={{
            padding: '16px 0',
            minHeight: readOnly ? 'auto' : '80px',
          }}
          className="rich-editor"
          component="div"
        >
          <Editor
            spellCheck
            autoFocus
            placeholder={placeHolder}
            ref={this.ref}
            value={value}
            onChange={onChange}
            onKeyDown={this.onKeyDown}

            schema={schema}
            onDrop={this.onDropOrPaste}
            onPaste={this.onDropOrPaste}
            readOnly={readOnly}
            renderBlock={this.renderBlock}
            renderMark={this.renderMark}
          />
        </Typography>
        <Dialog
          open={!!dialog}
          onClose={this.handleCloseDialog}
          fullWidth
        >
          <DialogTitle>
            {intl.formatMessage({ id: 'RichTextEditorAddLinkTitle' })}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {(dialog === DialogTypes.LINK) && intl.formatMessage({ id: 'RichTextEditorEnterUrl' })}
              {(dialog === DialogTypes.LINK_WITH_TEXT) && intl.formatMessage({ id: 'RichTextEditorEnterTextAndLink' })}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="link"
              label={intl.formatMessage({ id: 'RichTextEditorLinkLabel' })}
              fullWidth
              value={link}
              onChange={this.handleChangeDialogValue('link')}
            />
            {(dialog === DialogTypes.LINK_WITH_TEXT) && (
              <TextField
                margin="dense"
                id="text"
                label={intl.formatMessage({ id: 'RichTextEditorTextLabel' })}
                fullWidth
                value={linkText}
                onChange={this.handleChangeDialogValue('linkText')}
              />
            )}
          </DialogContent>
          <DialogActions>
            <MaterialButton onClick={this.handleCloseDialog} color="primary">
              Cancel
            </MaterialButton>
            <MaterialButton onClick={this.handleSaveLink} color="primary">
              Save
            </MaterialButton>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  renderImageButton = () => (
    <Button onMouseDown={this.onClickImage}>
      <Icon>image</Icon>
    </Button>
  );

  renderLinkButton = () => (
    <Button active={this.hasLinks()} onMouseDown={this.onClickLink}>
      <Icon>link</Icon>
    </Button>
  );

  /**
   * Render a mark-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type);

    return (
      <Button
        active={isActive}
        onMouseDown={(event) => this.onClickMark(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    );
  };

  /**
   * Render a block-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderBlockButton = (type, icon) => {
    let isActive = this.hasBlock(type);

    if (['numbered-list', 'bulleted-list'].includes(type)) {
      const { value: { document, blocks } } = this.props;

      if (blocks.size > 0) {
        const parent = document.getParent(blocks.first().key);
        isActive = this.hasBlock('list-item') && parent && parent.type === type;
      }
    }

    return (
      <Button
        active={isActive}
        onMouseDown={(event) => this.onClickBlock(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    );
  };

  /**
   * Render a Slate node.
   *
   * @param {Object} props
   * @return {Element}
   */

  renderBlock = (props, editor, next) => {
    const {
      attributes, children, node,
    } = props;
    switch (node.type) {
      case 'paragraph':
        return <p {...attributes}>{children}</p>;
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>;
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>;
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>;
      case 'image': {
        const metadata = node.data.get('metadata');
        return <LoadableImage metadata={metadata} />;
      }
      case 'link': {
        const { data } = node;
        const href = data.get('href');
        return (
          <a {...attributes} href={href} rel="noopener noreferrer" target="_blank">
            {children}
          </a>
        );
      }
      default:
        return next();
    }
  };

  /**
   * Render a Slate mark.
   *
   * @param {Object} props
   * @return {Element}
   */

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>;
      case 'code':
        return <code {...attributes}>{children}</code>;
      case 'italic':
        return <em {...attributes}>{children}</em>;
      case 'underlined':
        return <u {...attributes}>{children}</u>;
      default:
        return next();
    }
  };

  /**
   * On key down, if it's a formatting command toggle a mark.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @return {Change}
   */

  onKeyDown = (event, editor, next) => {
    let mark;

    if (isBoldHotkey(event)) {
      mark = 'bold';
    } else if (isItalicHotkey(event)) {
      mark = 'italic';
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underlined';
    } else if (isCodeHotkey(event)) {
      mark = 'code';
    } else {
      return next();
    }

    event.preventDefault();
    editor.toggleMark(mark);
  };

  /**
   * When a mark button is clicked, toggle the current mark.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickMark = (event, type) => {
    event.preventDefault();
    this.editor.toggleMark(type);
  };

  /**
   * When a block button is clicked, toggle the block type.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickBlock = (event, type) => {
    event.preventDefault();

    const { editor } = this;
    const { value } = editor;
    const { document } = value;

    // Handle everything but list buttons.
    if (type !== 'bulleted-list' && type !== 'numbered-list') {
      const isActive = this.hasBlock(type);
      const isList = this.hasBlock('list-item');

      if (isList) {
        editor
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else {
        editor.setBlocks(isActive ? DEFAULT_NODE : type);
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock('list-item');
      const isType = value.blocks.some((block) => !!document.getClosest(block.key, (parent) => parent.type === type));

      if (isList && isType) {
        editor
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else if (isList) {
        editor
          .unwrapBlock(
            type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list',
          )
          .wrapBlock(type);
      } else {
        editor.setBlocks('list-item').wrapBlock(type);
      }
    }
  };

  /**
   * When clicking a link, if the selection has a link in it, remove the link.
   * Otherwise, add a new link with an href and text.
   *
   * @param {Event} event
   */

  onClickLink = (event) => {
    event.preventDefault();

    const { editor } = this;
    const { value } = editor;
    const hasLinks = this.hasLinks();

    if (hasLinks) {
      editor.command(unwrapLink);
    } else if (value.selection.isExpanded) {
      this.setState({
        dialog: DialogTypes.LINK,
        link: '',
        linkText: '',
      });
    } else {
      this.setState({
        dialog: DialogTypes.LINK_WITH_TEXT,
        link: '',
        linkText: '',
      });
    }
  };


  /** Image editor stuff again */
  /**
   * On clicking the image button, prompt for an image and insert it.
   *
   * @param {Event} event
   */

  onClickImage = (event) => {
    event.preventDefault();
    this.refs.fileUploader.click();
  };

  insertImagesFromFiles = (files, target) => {
    const { history } = this.props;
    const { location } = history;
    const { pathname } = location;
    const marketId = getMarketId(pathname);
    for (const file of files) {
      const { type } = file;
      const [mime] = type.split('/');
      // console.log(mime);
      if (mime !== 'image') continue;
      uploadFileToS3(marketId, file)
        .then((metadata) => this.editor.command(insertImage, metadata, target));
    }
  };

  /**
   * On drop, insert the image wherever it is dropped.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  onDropOrPaste = (event, editor, next) => {
    const target = getEventRange(event, editor);
    if (!target && event.type === 'drop') return next();

    const transfer = getEventTransfer(event);
    const { type, text, files } = transfer;

    if (type === 'files') {
      this.insertImagesFromFiles(files, target);
      return;
    }
    // console.log(text)
    if (type === 'text') {
      if (!isUrl(text)) return next();
      if (this.hasLinks()) {
        if (editor.value.selection.isCollapsed) return next();
        editor.command(unwrapLink);
      } else {
        if (!isImage(text)) return next();
        editor.command(insertImage, text, target);
      }
      return;
    }

    next();
  };
}

/**
 * Export.
 */

export default injectIntl(withRouter(RichTextEditor));
