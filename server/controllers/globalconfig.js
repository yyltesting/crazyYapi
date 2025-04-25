const globalModel = require('../models/global.js');
const yapi = require('../yapi.js');
const _ = require('underscore');
const baseController = require('./base.js');
class globalController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(globalModel);
  }
  /**
   * 编辑配置
   * @interface /upconfig
   * @method POST
   * @category project
   * @foldnumber 10
   * @param {String} config 项目名称，不能为空
   * @returns {Object}
   * @example ./api/project/up.json
   */
  async upconfig(ctx) {
    try {
      let params = ctx.request.body;

      params = yapi.commons.handleParams(params, {
        config: 'string'
      });

      if (this.getRole() !== 'admin') {
        return (ctx.body = yapi.commons.resReturn(null, 402, 'Without permission.'));
      }
      let data = {
        up_time: yapi.commons.time(),
        config:params.config
      };
      let getconfig = await this.Model.getconfig();
      let result;
      if (getconfig) {
        result = await this.Model.up( getconfig._id,data);
      }else{
        result = await this.Model.save(data);
      }
       
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  /**
   * 获取配置
   * @interface /getconfig
   * @method GET
   * @category project
   * @foldnumber 10
   * @returns {Object}
   * @example ./api/project/up.json
   */
  async getconfig(ctx) {
    try {

      if (this.getRole() !== 'admin') {
        return (ctx.body = yapi.commons.resReturn(null, 402, 'Without permission.'));
      }

      let result = await this.Model.getconfig();
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
}
module.exports = globalController;