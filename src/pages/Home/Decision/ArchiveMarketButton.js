import React from 'react';
import PropTypes from 'prop-types';
import { archiveMarket } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import ArchiveIcon from '@material-ui/icons/Archive';

function ArchiveMarketButton(props) {

  const {
    marketId,
    onClick,
  } = props;

  function myOnClick() {
    return archiveMarket(marketId)
      .then(() => {
        onClick();
      });
  }

  return (
    <TooltipIconButton
      translationId="decisionDialogsArchiveDialog"
      icon={<ArchiveIcon/>}
      onClick={myOnClick}
    />
  );
}

ArchiveMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ArchiveMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default ArchiveMarketButton;
