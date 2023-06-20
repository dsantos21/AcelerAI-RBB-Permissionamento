// Libs
import React from 'react';
// Styles
import styles from './styles.module.scss';

const EmptyRow: React.FC<{}> = () => (
  <tr>
    <td colSpan={5} className={styles.emptyLine}>
      No permissions have been found.
    </td>
  </tr>
);

export default EmptyRow;
