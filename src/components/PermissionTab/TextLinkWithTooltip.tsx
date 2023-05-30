// Libs
import React from 'react';
import classnames from 'classnames';
// Rimble Components
import { Tooltip, Text } from 'rimble-ui';
// Constants
import { PENDING_ADDITION, PENDING_REMOVAL } from '../../constants/transactions';
// Styles
import styles from './styles.module.scss';

type TextLinkWithTooltip = {
  status: string;
  isAdmin: boolean;
  text: string;
  link: string;
};

const TextLinkWithTooltip: React.FC<TextLinkWithTooltip> = ({ status, isAdmin, text, link }) => {
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
        <a href={link} target="_blank">
          {text}
        </a>
      </Text>
    </Tooltip>
  ) : (
    <Tooltip title={text} placement="bottom">
      <Text variant="body1" className={styles.ellipsis}>
        <a href={link} target="_blank">
          {text}
        </a>
      </Text>
    </Tooltip>
  );
};

export default TextLinkWithTooltip;
