/**
 Our uploading is handled by the S3 uploader and centralizes
 paste and drag drop in one place. This module will just disable drag drop
 image uploading in the main editor
 **/
import Quill from 'quill';

const Module = Quill.import('core/module');

class NoOpUploader extends Module{
}

export default NoOpUploader