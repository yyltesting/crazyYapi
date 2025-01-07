function exportColData(exportColDataModule, pid) {
  exportColDataModule.json = {
      name: 'json',
      route: `/api/plugin/exportColJson?colid=0&pid=${pid}`,
      desc: '导出项目测试集合为json文件,默认导出全部集合'
    };
}

module.exports = function() {
    this.bindHook('export_coldata', exportColData);
};