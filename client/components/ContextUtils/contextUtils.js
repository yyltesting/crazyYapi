import React from 'react';
import { Drawer, List } from 'antd';
const { utils: powerStringUtils } = require('../../../common/power-string.js');

const ContextUtils = ({ visible, onClose }) => {
  const metadata = { ...powerStringUtils.metadata, ...powerStringUtils.contractMetadata };
  const utilsMethod = Object.keys(metadata).map(key => ({
    name: key,
    params: metadata[key]
  }));
  return (
    <Drawer
      title="context.utils函数集"
      placement="right"
      closable={true}
      onClose={onClose}
      open={visible}
    >
      <List
        bordered
        dataSource={utilsMethod}
        renderItem={(item) => (
          <List.Item>
            <strong>{item.name}</strong>: ({item.params.join(", ") || "No params"})
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default ContextUtils;