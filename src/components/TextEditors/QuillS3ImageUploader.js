import Quill from 'quill';
import Delta from 'quill-delta';
import { getS3FileUrl, uploadFileToS3 } from '../../api/files';

/**
 * Handles both upload button click and drag and drop into the editor
 */
class QuillS3ImageUploader {
  quill;

  marketId;

  onS3Upload;

  toolbar;

  uploader;

  // See here: https://github.com/quilljs/quill/issues/1089#issuecomment-319567957

  constructor(quill, options) {
    this.quill = quill;
    this.marketId = options.marketId;
    this.onUploadStart = options.onUploadStart;
    this.onUploadStop = options.onUploadStop;
    this.onS3Upload = options.onS3Upload;
    this.s3Uploader = this.s3Uploader.bind(this);
    this.doUpload = this.doUpload.bind(this);
    this.toolbar = this.quill.getModule('toolbar');
    // bind handlers to this instance
    this.handleDrop = this.handleDrop.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    // listen for drop and paste events
    this.quill.root.addEventListener('drop', this.handleDrop, false);
    this.quill.root.addEventListener('paste', this.handlePaste, false);
    // override the toolbar
    if (this.toolbar) {
      this.toolbar.addHandler('image', this.selectImages.bind(this));
    }
  }

  /**
   * Handler for drop event to read dropped files from evt.dataTransfer
   * @param {Event} evt
   */

  handleDrop(evt) {
    evt.preventDefault();
    if (evt.dataTransfer && evt.dataTransfer.files && evt.dataTransfer.files.length) {
      if (document.caretRangeFromPoint) {
        const selection = document.getSelection();
        const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
        if (selection && range) {
          selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
        }
      }
      const uploads = this.mapFilesToArray(evt.dataTransfer.files);
      this.doUpload(uploads);
    }
  }

  mapFilesToArray(files) {
    const uploads = [];
    for (let x = 0; x < files.length; x += 1) {
      uploads.push(files[x]);
    }
    return uploads;
  }

  /**
   * Handler for paste event to read pasted files from evt.clipboardData
   * @param {Event} evt
   */
  handlePaste(evt) {
    evt.preventDefault();
    if (evt.clipboardData && evt.clipboardData.items && evt.clipboardData.items.length) {
      const items = evt.clipboardData.items;
      const files = [];
      for (let x = 0; x < items.length; x += 1) {
        const file = items[x];
        if (file.type.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp|vnd\.microsoft\.icon)/i)) {
          const uploadable = file.getAsFile();
          if (uploadable) {
            files.push(uploadable);
          }
        }
      }
      if (files.length > 0) {
        const selection = this.quill.getSelection();
        if (selection) {
          // we must be in a browser that supports pasting (like Firefox)
          // so it has already been placed into the editor
          return this.doUpload(files);
        } else {
          // otherwise we wait until after the paste when this.quill.getSelection()
          // will return a valid index
          setTimeout(() => {
            return this.doUpload(files);
          }, 0);
        }
      }
    }
    return Promise.resolve(true);
  }

  selectImages() {
    this.uploader = document.createElement('input');
    this.uploader.setAttribute('type', 'file');
    this.uploader.setAttribute('accept', 'image/*');
    this.uploader.setAttribute('multiple', true);
    this.uploader.onchange = this.fileChanged.bind(this);
    this.uploader.click();
  }

  doUpload(uploads) {
    const range = this.quill.getSelection();
    if (this.onUploadStart) {
      this.onUploadStart();
    }
    // console.debug(uploads);
    return this.s3Uploader(range, uploads)
      .then((metadatas) => {
        if (this.uploader) {
          this.uploader.value = ''; // zero it out for the next run
        }
        if (this.onS3Upload) {
          this.onS3Upload(metadatas);
        }
        if (this.onUploadStop) {
          this.onUploadStop();
        }
      })
      .catch((error) => {
        if (this.onUploadStop) {
          this.onUploadStop();
        }
        throw error;
      });
  }

  fileChanged() {
    const { files } = this.uploader;
    if (files.length > 0) {
      // convert FileList object to array so we can use map later
      const uploads = this.mapFilesToArray(files);
      return this.doUpload(uploads);
    }
    return Promise.resolve(true);
  }

  s3Uploader(range, uploads) {
    const metadatas = [];
    const promises = uploads.map((file) => {
      return uploadFileToS3(this.marketId, file)
        .then((metadata) => {
          metadatas.push(metadata);
          return getS3FileUrl(metadata);
        });
    });
    return Promise.all(promises).then((images) => {
      const update = images.reduce((delta, image) => {
        return delta.insert({ image });
      }, new Delta().retain(range.index).delete(range.length));
      this.quill.updateContents(update, Quill.sources.USER);
      return this.quill.setSelection(
        range.index + images.length,
        Quill.sources.SILENT,
      );
    }).then(() => {
      return metadatas;
    });
  }
}

export default QuillS3ImageUploader;
