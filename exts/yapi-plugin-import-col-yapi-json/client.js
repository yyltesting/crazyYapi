import { message } from 'antd';

function improtData(importDataModule) {
  async function run(res) {
    try {
      res = JSON.parse(res);
      return res;
    } catch (e) {
      console.error(e);
      message.error('数据格式有误');
    }
  }

  if (!importDataModule || typeof importDataModule !== 'object') {
    console.error('importDataModule 参数Must be Object Type');
    return null;
  }

  importDataModule.json = {
    name: 'json',
    run: run,
    desc: 'YApi集合 json数据导入'
  };
}

module.exports = function() {
  this.bindHook('import_col_data', improtData);
};
