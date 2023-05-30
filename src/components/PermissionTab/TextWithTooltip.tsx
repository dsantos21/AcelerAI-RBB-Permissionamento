// Libs
import React from 'react';
import classnames from 'classnames';
// Rimble Components
import { Tooltip, Text } from 'rimble-ui';
// Constants
import { PENDING_ADDITION, PENDING_REMOVAL } from '../../constants/transactions';
// Styles
import styles from './styles.module.scss';

type TextWithTooltip = {
  status: string;
  isAdmin: boolean;
  text: string;
};

const TextWithTooltip: React.FC<TextWithTooltip> = ({ status, isAdmin, text }) => {
  return status === PENDING_ADDITION || status === PENDING_REMOVAL || !isAdmin ? (
    <Tooltip
      title={isAdmin ? 'This transaction is pending.' : 'You must be an admin to perform modifications.'}
      placement="bottom"
    >
      <Text
        variant="body1"
        className={classnames(
          styles.ellipsis,
          status === PENDING_REMOVAL
            ? styles.pendingRemoval
            : status === PENDING_ADDITION
            ? styles.pendingAddition
            : styles.lock
        )}
      >
        {text}
      </Text>
    </Tooltip>
  ) : (
    <Tooltip title={text} placement="bottom">
      <Text variant="body1" className={styles.ellipsis}>
        {text}
      </Text>
    </Tooltip>
  );
};

export default TextWithTooltip;
