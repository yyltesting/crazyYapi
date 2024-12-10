const yapi = require('yapi.js');
const mongoose = require('mongoose');
const controller = require('./controller');
const Config = require('./utils/config');
const { SendLogVialarkSender } = require('./utils/logSender');

module.exports = function() {
  let options = Config.conf;
  Config.instance = options;

  const originalSaveLog = this.commons.saveLog;

  this.commons.saveLog = function() {
    const args = Array.prototype.slice.call(arguments);
    originalSaveLog.apply(this, args);
    try {
      // yapi.commons.log('yapi-plugin-lark: 开始运行');
      const logData = args[0];
      if (!logData || logData.type != 'project') {
        yapi.commons.log('yapi-plugin-lark: 日志不是 project 类型，跳过通知。');
        return;
      }
      (new SendLogVialarkSender(logData)).send().then().catch((err) => {
        yapi.commons.log(err, 'error');
      });
    } catch(err) {
      yapi.commons.log(err, 'error');
    }
  }

  yapi.connect.then(function() {
    let db = mongoose.connection.db.collection('lark_robots');
    db.createIndex({
      project_id: 1
    });
  });

  this.bindHook('add_router', function(router) {
    router({
      controller: controller,
      method: 'get',
      path: 'lark_robots/detail',
      action: 'show'
    });

    router({
      controller: controller,
      method: 'post',
      path: 'lark_robots/up',
      action: 'update'
    });

    router({
      controller: controller,
      method: 'post',
      path: 'lark_robots/test',
      action: 'test'
    });
  });
}
