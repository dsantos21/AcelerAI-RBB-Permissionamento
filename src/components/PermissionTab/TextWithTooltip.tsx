// Libs
import React from 'react';
// Rimble Components
import { Tooltip, Text } from 'rimble-ui';
// Styles
import styles from './styles.module.scss';

type TextWithTooltip = {
  status: string;
  isAdmin: boolean;
  text: string;
};

const TextWithTooltip: React.FC<TextWithTooltip> = ({ status, isAdmin, text }) => {
  return (
    <Tooltip message={text} placement="bottom" variant="dark">
      <Text variant="body1" className={styles.ellipsis}>
        {text}
      </Text>
    </Tooltip>
  );
};

export default TextWithTooltip;
