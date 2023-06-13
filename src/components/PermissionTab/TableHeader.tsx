// Libs
import React, { useState } from 'react';
import { isAddress } from 'web3-utils';
// Rimble Components
import { Flex, Box, Heading, Button, Form, Text } from 'rimble-ui';
// Styles
import styles from './styles.module.scss';
import classnames from 'classnames';

type TableHeader = {
  number: number;
  handleFilter: (filter: any) => void;
};

const TableHeader: React.FC<TableHeader> = ({ number, handleFilter }) => {
  const [filter, setFilter] = useState<{ authorizer: string | null; authorized: string | null }>({
    authorizer: '',
    authorized: ''
  });

  const [validation1, setValidation1] = useState({ valid: true, msg: '' });
  const [validation2, setValidation2] = useState({ valid: true, msg: '' });

  const isValidAccount = (address: string) => {
    if (address.trim().length === 0) return { valid: true, msg: '' };

    let isValidAddress = isAddress(address);
    if (!isValidAddress) return { valid: false, msg: 'Invalid address!' };

    return { valid: true, msg: '' };
  };

  const modifyInput1 = ({ target: { name, value } }: { target: { name: string; value: string } }) => {
    const validation = isValidAccount(value);
    setFilter({ ...filter, [name]: value });
    setValidation1(validation);
  };

  const modifyInput2 = ({ target: { name, value } }: { target: { name: string; value: string } }) => {
    const validation = isValidAccount(value);
    setFilter({ ...filter, [name]: value });
    setValidation2(validation);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    handleFilter(filter);
  };

  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Box>
        <Heading.h2 fontWeight="700">Permissions ({number})</Heading.h2>
      </Box>

      <Form onSubmit={handleSubmit}>
        <Flex alignItems="center">
          <Form.Field
            mt={3}
            label="Grantor"
            className={filter.authorizer ? `${validation1.valid ? styles.validField : styles.invalidField}` : null}
          >
            <Form.Input
              width={1}
              type="text"
              name="authorizer"
              placeholder="Grantor address"
              value={filter.authorizer}
              onChange={modifyInput1}
              className={styles.fieldInput}
            />
            <Text
              color="red"
              height="30px"
              fontSize="14px"
              className={
                !validation1.valid && filter.authorizer
                  ? classnames(styles.errorMessage, styles.show)
                  : styles.errorMessage
              }
            >
              {validation1.msg ? validation1.msg : ''}
            </Text>
          </Form.Field>
          <Form.Field
            mt={3}
            label="Grantee"
            className={filter.authorized ? `${validation2.valid ? styles.validField : styles.invalidField}` : null}
          >
            <Form.Input
              width={1}
              type="text"
              name="authorized"
              placeholder="Grantee address"
              value={filter.authorized}
              onChange={modifyInput2}
              className={styles.fieldInput}
            />
            <Text
              color="red"
              height="30px"
              fontSize="14px"
              className={
                !validation2.valid && filter.authorized
                  ? classnames(styles.errorMessage, styles.show)
                  : styles.errorMessage
              }
            >
              {validation2.msg ? validation2.msg : ''}
            </Text>
          </Form.Field>

          <Button
            icon="FilterList"
            mainColor="#25D78F"
            ml={1}
            onClick={() => handleSubmit}
            disabled={!validation1.valid || !validation2.valid}
          >
            Filter
          </Button>
        </Flex>
      </Form>
    </Flex>
  );
};

export default TableHeader;
