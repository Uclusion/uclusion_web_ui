import React from 'react';
//import _ from 'lodash';
import PropTypes from 'prop-types';
import { uploadFileToS3 } from '../../api/files';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Dropzone from 'react-dropzone';
import ExpandableAction from '../SidebarActions/Planning/ExpandableAction';
import { ACTION_BUTTON_COLOR } from '../Buttons/ButtonConstants';
import { useIntl } from 'react-intl';

function FileUploader(props) {
  const {
    marketId,
    onUpload = () => {},
    setUploadInProgress = () => {},
  } = props;

  const intl = useIntl();

  function onDrop(files) {
    setUploadInProgress(true);
    return AllSequentialMap(files,(file) => {
      // we'll assume a generic octet stream if it's not provided
      return uploadFileToS3(marketId, file)
        .then((metadata) => {
          // we need to augment the file with the original name if we have it
          return {
            ...metadata,
            original_name: file.name,
          };
        });
    })
      .then((results) => {
        setUploadInProgress(false);
        onUpload(results);
      });
  }

  return (
    <Dropzone onDrop={onDrop}>
      {({getRootProps, getInputProps}) => (
        <section>
          <div {...getRootProps()}>
            <ExpandableAction
              id="proposeOption"
              onClick={()=>{}}
              icon={<CloudUploadIcon htmlColor={ACTION_BUTTON_COLOR} />}
              label={intl.formatMessage({ id: 'uploadFilesDisplay' })}
              toolTip={intl.formatMessage({ id: 'uploadFilesTooltip'})}
            />
            <input {...getInputProps()} />
          </div>
        </section>
      )}
    </Dropzone>
  )
}

FileUploader.propTypes = {
  marketId: PropTypes.string.isRequired,
  onUpload: PropTypes.func,
  setUploadInProgress: PropTypes.func,
};

export default FileUploader;