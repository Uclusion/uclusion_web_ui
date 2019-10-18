import { Quill } from 'react-quill';
import Delta from 'quill-delta';
import { getS3FileUrl, uploadFileToS3 } from '../../api/files';

class QuillS3ImageUploader {
  quill;

  marketId;

  toolbar;

  uploader;

  // See here: https://github.com/quilljs/quill/issues/1089#issuecomment-319567957

  constructor(quill, options) {
    this.quill = quill;
    this.marketId = options.marketId;
    this.s3Uploader = this.s3Uploader.bind(this);
    this.toolbar = this.quill.getModule('toolbar');
    if (this.toolbar) {
      this.toolbar.addHandler('image', this.selectImages.bind(this));
    }
  }

  selectImages() {
    this.uploader = document.createElement('input');
    this.uploader.setAttribute('type', 'file');
    this.uploader.setAttribute('accept', 'image/*');
    this.uploader.setAttribute('multiple', true);
    this.uploader.onchange = this.fileChanged.bind(this);
    this.uploader.click();
  }

  fileChanged() {
    const { files } = this.uploader;
    if (files.length > 0) {
      // convert FileList object to array so we can use map later
      const uploads = [];
      for (let x = 0; x < files.length; x += 1) {
        uploads.push(files[x]);
      }
      const range = this.quill.getSelection();
      console.debug(uploads);
      return this.s3Uploader(range, uploads)
        .then(() => {
          this.uploader.value = ''; // zero it out for the next run
        });
    }
    return Promise.resolve(true);
  }

  s3Uploader(range, uploads) {
    const promises = uploads.map((file) => {
      return uploadFileToS3(this.marketId, file)
        .then((metadata) => getS3FileUrl(metadata));
    });
    return Promise.all(promises).then((images) => {
      const update = images.reduce((delta, image) => {
        return delta.insert({ image });
      }, new Delta().retain(range.index).delete(range.length));
      this.quill.updateContents(update, Quill.sources.USER);
      this.quill.setSelection(
        range.index + images.length,
        Quill.sources.SILENT,
      );
    });
  }
}

export default QuillS3ImageUploader;
