// Libs
import React from 'react';
// Rimble Components
import { Tooltip, Text } from 'rimble-ui';
// Styles
import styles from './styles.module.scss';

type TextLinkWithTooltip = {
  status: string;
  isAdmin: boolean;
  text: string;
  link: string;
};

const TextLinkWithTooltip: React.FC<TextLinkWithTooltip> = ({ status, isAdmin, text, link }) => {
  return (
    <Tooltip message={text} placement="bottom" variant="dark">
      <Text variant="body1" className={styles.ellipsis}>
        <a href={link} target="_blank">
          {text}
        </a>
      </Text>
    </Tooltip>
  );
};

export default TextLinkWithTooltip;
