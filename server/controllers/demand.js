const demandModel = require('../models/demand.js');
const caselibModel = require('../models/caselib.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const interfaceModel = require('../models/interface.js');
const projectModel = require('../models/project.js');
const baseController = require('./base.js');
const yapi = require('../yapi.js');

class demandController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(demandModel);
    this.caselibModel = yapi.getInst(caselibModel);
    this.caseModel = yapi.getInst(interfaceCaseModel);
    this.interfaceModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
  }
  /**
  * 添加项目需求
  * @interface /demand/add
  * @method POST
  * @category demand
  * @foldnumber 10
  * @param {String} demand 需求名称，不能为空
  * @param {String} intro 需求简介，不能为空
  * @param {Number} project_id 项目id，不能为空
  * @param {String} status 需求状态不能为空
  * @returns {Object}
  * @example 
  */
   async add(ctx) {
    let params = ctx.params;
    params = yapi.commons.handleParams(params, {
        demand: 'string',
        project_id: 'number',
        intro: 'string',
        status: 'string'
      });
    if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }
    if (!params.status) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '状态不能为空'));
    }
    if (!params.demand) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '名称不能为空'));
    }
    let auth = await this.checkAuth(params.project_id, 'project', 'edit');
    if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
    }

    let data = {
      demand: params.demand,
      intro: params.intro,
      project_id: params.project_id,
      uid: this.getUid(),
      status: params.status,
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time()
    };

    let result = await this.Model.save(data);
    let uid = this.getUid();
    let username = this.getUsername();
    yapi.commons.saveLog({
      content: `<a href="/user/profile/${this.getUid()}">${username}</a> 添加了项目需求 <a href="/project/${params.project_id}/demandlib">${params.demand}</a>`,
      type: 'project',
      uid,
      username: username,
      typeid: params.project_id
    });
    return(ctx.body = yapi.commons.resReturn(result));
    }
    /**
   * 编辑项目需求
   * @interface /demand/edit
   * @method POST
   * @category demand
   * @foldnumber 10
   * @param {Number} demand_id 需求id，不能为空
   * @param {String} demand
   * @param {String} intro
   * @param {String} status
   * @returns {Object}
   * @example 
   */
     async edit(ctx) {
      try {
        let params = ctx.request.body;
        let id = params.demand_id;
  
        params = yapi.commons.handleParams(params, {
            demand: 'string',
            intro: 'string',
            status: 'string',
        });
        
        if (!id) {
          return (ctx.body = yapi.commons.resReturn(null, 405, '需求id不能为空'));
        }
        let demandData = await this.Model.get(id);
        if (!demandData) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
        }
        if (!params.status) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '状态不能为空'));
        }
        if (!params.demand) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '名称不能为空'));
        }
        let auth = await this.checkAuth(params.demand_id, 'demand', 'edit');
        if (!auth) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
        delete params.demand_id;
        let result = await this.Model.up(id, params);
        let username = this.getUsername();
        yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了项目需求 <a href="/project/${demandData.project_id}/demandlib">${params.demand}</a>`,
            type: 'project',
            uid:this.getUid(),
            username: username,
            typeid: demandData.project_id
          });
        ctx.body = yapi.commons.resReturn(result);
      } catch (e) {
        return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
      }
    }

  /**
   * 获取所有项目需求
   * @interface /demand/list
   * @method GET
   * @category demand
   * @foldnumber 10
   * @param {String} project_id 项目ID
   * @returns {Object}
   * @example
   */
  async list(ctx) {
    try {
      let id = ctx.query.project_id;
      let project = await this.projectModel.getBaseInfo(id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }
    // 列表暂时不分页 page & limit 为分页配置
    // page = ctx.request.query.page || 1,
    // limit = ctx.request.query.limit || 10;
      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }
      let result = await this.Model.list(id);
      ctx.body = yapi.commons.resReturn(result);
    }catch (err) {
      return(ctx.body = yapi.commons.resReturn(null, 402, err.message));
    }
  }
  /**
   * 删除一个需求
   * @interface /demand/del
   * @method POST
   * @category demand
   * @foldnumber 10
   * @param {Number} id 需求id，不能为空
   * @returns {Object}
   * @example
   */

   async del(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.id;
      params = yapi.commons.handleParams(params, {
          id: 'number'
      });
      let demandData = await this.Model.get(id);
      if (!demandData) {
        return(ctx.body = yapi.commons.resReturn(null, 400, '不存在的id'));
      }

      if (demandData.uid !== this.getUid()) {
        let auth = await this.checkAuth(id, 'demand', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }
      let casedata = await this.caselibModel.listcheck(id);
      if(casedata.length>0){
        return(ctx.body = yapi.commons.resReturn(null, 400, '请清理完所有测试用例再删除'));
      }
      let result = await this.Model.del(id);
      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了需求 ${
          demandData.demand
        } `,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: demandData.project_id
      });
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
    }
  }
 /**
   * 更新需求状态
   * @interface /demand/upstatus
   * @method POST
   * @category demand
   * @foldnumber 10
   * @param {Number} id 需求id，不能为空
   * @param {String} status
   * @returns {Object}
   * @example 
   */
  async upstatus(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.id;
      let status;
      if(params.status==='done'){
        status='已发布'
      } else if(params.status==='design'){
        status='设计中'
      } else if(params.status==='undone'){
        status='开发中'
      } else if(params.status==='testing'){
        status='已提测'
      } else if(params.status==='stoping'){
        status='暂停开发'
      } else if(params.status==='deprecated'){
        status='已过时'
      }
      params = yapi.commons.handleParams(params, {
          status: 'string',
          id:'number'
      });
      
      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 405, '需求id不能为空'));
      }
      let demandData = await this.Model.get(id);
      if (!demandData) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
      }
      if (!params.status) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '状态不能为空'));
      }
      let auth = await this.checkAuth(params.id, 'demand', 'edit');
      if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
      delete params.id;
      let result = await this.Model.upStatus(id, params.status);
      let username = this.getUsername();
      yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了需求 ${demandData.demand} <a href="/project/${demandData.project_id}/demandlib">${status}</a>`,
          type: 'project',
          uid:this.getUid(),
          username: username,
          typeid: demandData.project_id
        });
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
    }
  }
}
module.exports = demandController;
