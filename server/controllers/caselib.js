const caselibModel = require('../models/caselib.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const interfaceModel = require('../models/interface.js');
const projectModel = require('../models/project.js');
const baseController = require('./base.js');
const demandModel = require('../models/demand.js');
const yapi = require('../yapi.js');
const { version } = require('os');

class caselibController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(caselibModel);
    this.caseModel = yapi.getInst(interfaceCaseModel);
    this.interfaceModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
    this.demandlibModel = yapi.getInst(demandModel);
  }
    /**
   * 获取项目测试用例库版本集
   * @interface /caselib/getversion
   * @method GET
   * @category project
   * @foldnumber 10
   * @param {Number} id 项目id，不能为空
   * @returns {Object}
   * @example ./api/project/get.json
   */

    async getversion(ctx) {
      let params = ctx.params;
      let projectId= params.id || params.project_id; // 通过 token 访问
      let demandid = await this.demandlibModel.getid(projectId);
      let versionlist = await this.Model.getversion(demandid);
      ctx.body = yapi.commons.resReturn(versionlist);
    }
  /**
  * 添加用例
  * @interface /caselib/add
  * @method POST
  * @category caselib
  * @foldnumber 10
  * @param {String} title 用例名称，不能为空
  * @param {String} model 模块，不能为空
  * @param {String} submodel 子模块
  * @param {String} preconditions 前置条件
  * @param {String} step 步骤
  * @param {String} expect 预期结果，不能为空
  * @param {String} remarks 备注
  * @param {String} priority 优先级
  * @param {Number} demandid 需求id，不能为空
  * @param {String} status 状态
  * @param {String} version 版本号
  * @param {String} interface_caseid 关联接口用例id
  * @returns {Object}
  * @example 
  */
   async add(ctx) {
    try{
    let params = ctx.params;
    params = yapi.commons.handleParams(params, {
        title: 'string',
        demandid: 'number',
        model: 'string',
        submodel: 'string',
        preconditions:'string',
        step:'string',
        expect:'string',
        remarks:'string',
        priority:'string',
        status:'string',
        version:'string',
        interface_caseid:'number'
      });
    if (!params.demandid) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '需求id不能为空'));
    }
    if (!params.model) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '模块不能为空'));
    }
    if (!params.expect) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '预期结果不能为空'));
    } 
    if (!params.status) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '状态不能为空'));
    } 
    let auth = await this.checkAuth(params.demandid, 'demand', 'edit');
    if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
    }
    if(params.interface_caseid){
      let interfacecaseData = await this.caseModel.get(params.interface_caseid);
      if(!interfacecaseData){
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口用例不存在'));
      }else{
        let resultdata = await this.Model.getInterfacecaseid(params.interface_caseid);
        if(resultdata){
          return (ctx.body = yapi.commons.resReturn(null, 400, '接口用例已绑定'));
        }
      }
    }
    let oldcase =await this.Model.info(params.demandid,params.title,params.model,params.submodel);
    if(oldcase){
      return (ctx.body = yapi.commons.resReturn(null, 400, '模块下用例title已存在'));
    }
    if(!params.submodel){
      params.submodel = '';
    }
    let data = {
      demandid: params.demandid,
      title: params.title,
      model: params.model,
      submodel: params.submodel,
      preconditions: params.preconditions,
      step: params.step,
      expect: params.expect,
      remarks: params.remarks,
      priority: params.priority,
      uid: this.getUid(),
      status: params.status,
      version:params.version,
      interface_caseid:params.interface_caseid,
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time()
    };

    let result = await this.Model.save(data);
    //更新interfacecase的关联用例id
    let interfaceparams = {
      testcaseid : result._id
    }
    await this.caseModel.up(params.interface_caseid,interfaceparams);

    let uid = this.getUid();
    let username = this.getUsername();
    let demandData = await this.demandlibModel.get(params.demandid);
    let project_id = demandData.project_id;
    let demandtitle = demandData.demand;
    yapi.commons.saveLog({
      content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在需求: ${demandtitle} 添加了用例 <a href="/project/${project_id}/demandlib">${params.title}</a>`,
      type: 'project',
      uid,
      username: username,
      typeid: project_id
    });
    return(ctx.body = yapi.commons.resReturn(result));  
  }catch(e){
    return(ctx.body = yapi.commons.resReturn(e.message)); 
  }
   }
  /**
  * 编辑用例
  * @interface /caselib/edit
  * @method POST
  * @category caselib
  * @foldnumber 10
  * @param {Number} caseid 用例id，不能为空
  * @param {String} title 用例名称，不能为空
  * @param {String} model 模块，不能为空
  * @param {String} submodel 子模块
  * @param {String} preconditions 前置条件
  * @param {String} step 步骤
  * @param {String} expect 预期结果，不能为空
  * @param {String} remarks 备注
  * @param {String} priority 优先级
  * @param {String} status 状态
  * @param {String} version 版本号
  * @param {Number} interface_caseid 关联接口用例id
  * @returns {Object}
  * @example 
   */
     async edit(ctx) {
      try {
        let params = ctx.request.body;
        let id = params.caseid;
  
        params = yapi.commons.handleParams(params, {
          title: 'string',
          model: 'string',
          submodel: 'string',
          preconditions:'string',
          step:'string',
          expect:'string',
          remarks:'string',
          priority:'string',
          status:'string',
          version:'string',
          interface_caseid:'number'
        });
        let caseData = await this.Model.get(id);
        if (!caseData) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
        }
        if (!params.caseid) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '用例id不能为空'));
        }
        if (!params.model) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '模块不能为空'));
        }
        if (!params.expect) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '预期结果不能为空'));
        } 
        if (!params.status) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '状态不能为空'));
        } 
        let auth = await this.checkAuth(params.caseid, 'case', 'edit');
        if (!auth) {
            return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
        let oldcase =await this.Model.info(caseData.demandid,params.title,params.model,params.submodel);
        if(oldcase&&oldcase._id!=params.caseid){
          return (ctx.body = yapi.commons.resReturn(null, 400, '模块下用例title已存在'));
        }
        if(!params.submodel){
          params.submodel = '';
        }
        if(params.interface_caseid){
          let interfacecaseData = await this.caseModel.get(params.interface_caseid);//获取对应接口用例数据
          if(!interfacecaseData){
            return (ctx.body = yapi.commons.resReturn(null, 400, '接口用例不存在'));//判断当前接口用例数据是否存在
          }else{
            let resultdata = await this.Model.getInterfacecaseid(params.interface_caseid);//获取当前key是否有数据
            if(resultdata&&caseData.interface_caseid!=params.interface_caseid){
              return (ctx.body = yapi.commons.resReturn(null, 400, '接口用例已被绑定'));
            }else if(caseData&&caseData.interface_caseid!==params.interface_caseid){
              await this.caseModel.up(caseData.interface_caseid,{
                testcaseid : null
              });
              let interfaceparams = {
                testcaseid : id
              }
              await this.caseModel.up(params.interface_caseid,interfaceparams);
            }else{
              let interfaceparams = {
                testcaseid : id
              }
              await this.caseModel.up(params.interface_caseid,interfaceparams);
            }
          }
        }else if(caseData.interface_caseid){
          await this.caseModel.up(caseData.interface_caseid,{
            testcaseid : null
          });
        }
        delete params.caseid;
        let result = await this.Model.up(id, params);
        let username = this.getUsername();
        let demandData = await this.demandlibModel.get(caseData.demandid);
        let project_id = demandData.project_id;
        yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了用例 <a href="/project/${project_id}/demandlib">${params.title}</a>`,
            type: 'project',
            uid:this.getUid(),
            username: username,
            typeid: project_id
          });
        ctx.body = yapi.commons.resReturn(result);
      } catch (e) {
        return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
      }
    }
  /**
  * 更新关联key
  * @interface /caselib/upinterfacecaseid
  * @method POST
  * @category caselib
  * @foldnumber 10
  * @param {Number} caseid 用例id，不能为空
  * @param {Number} interface_caseid 关联接口用例id
  * @returns {Object}
  * @example 
   */
  async upinterfacecaseid(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.caseid;

      params = yapi.commons.handleParams(params, {
        interface_caseid:'number'
      });
      let caseData = await this.Model.get(id);
      if (!caseData) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
      }
      if (!params.caseid) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '用例id不能为空'));
      }

      let auth = await this.checkAuth(params.caseid, 'case', 'edit');
      if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }

      if(params.interface_caseid){
        let interfacecaseData = await this.caseModel.get(params.interface_caseid);//获取对应接口用例数据
        if(!interfacecaseData){
          return (ctx.body = yapi.commons.resReturn(null, 400, '接口用例不存在'));//判断当前接口用例数据是否存在
        }else{
          let resultdata = await this.Model.getInterfacecaseid(params.interface_caseid);//获取当前key是否有数据
          if(resultdata&&caseData.interface_caseid!=params.interface_caseid){
            return (ctx.body = yapi.commons.resReturn(null, 400, '接口用例已被绑定'));
          }else if(caseData&&caseData.interface_caseid!==params.interface_caseid){
            await this.caseModel.up(caseData.interface_caseid,{
              testcaseid : null
            });
            let interfaceparams = {
              testcaseid : id
            }
            await this.caseModel.up(params.interface_caseid,interfaceparams);
          }else{
            let interfaceparams = {
              testcaseid : id
            }
            await this.caseModel.up(params.interface_caseid,interfaceparams);
          }
        }
      }else if(caseData.interface_caseid){
        await this.caseModel.up(caseData.interface_caseid,{
          testcaseid : null
        });
      }
      delete params.caseid;
      let result = await this.Model.up(id, params);
      let username = this.getUsername();
      let demandData = await this.demandlibModel.get(caseData.demandid);
      let project_id = demandData.project_id;
      yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了用例库关联KEY <a href="/project/${project_id}/demandlib">${params.title}</a>`,
          type: 'project',
          uid:this.getUid(),
          username: username,
          typeid: project_id
        });
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
    }
  }
  /**
   * 获取所有项目需求
   * @interface /caselib/list
   * @method POST
   * @category caselib
   * @foldnumber 10
   * @param {Number} demandid 需求id
   * @param {Number} page 当前页
   * @param {Number} limit 每一页限制条数
   * @param {String} status 状态
   * @param {String} title 用例名称
   * @returns {Object}
   * @example
   */
  async list(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.demandid;
      let page = params.page || 1,
      status = params.status ? params.status.split(',') : [],
      limit = params.limit || 10,
      title = params.title;
      let demandData = await this.demandlibModel.get(id);
      let project_id = demandData.project_id;
      let project = await this.projectModel.getBaseInfo(project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }
      let result;
      if (limit === 'all') {
        result = await this.Model.list(id);
      } 
      let v;
      //通过不同条件搜索
      if(title && title.indexOf(':')>0){
        v = title.split(':')[0];
        title = title.split(':')[1]
      }
      
      result = await this.Model.listWithPageserch(id, page, limit, status,title,v);
      
      // ctx.body = yapi.commons.resReturn(result);
      let demandid = parseInt(id);
      // //老版本去计算条数
      let aggregate = await this.Model.aggregate({demandid});
      // let aggregate1 = await this.Model.aggregates({demandid});
      // let count = 0;
      // aggregate.forEach(item => count += item.count);
      
      // let num=0;
      // for(let i =0;i<status.length;i++){
      //   let filterList = aggregate.filter(item => item._id === status[i]);
      //   if(filterList[0]){
      //     num = num+filterList[0].count;
      //   }
      // }
      // ctx.body = yapi.commons.resReturn({
      //   count: num,
      //   total: Math.ceil(num / limit),
      //   list: result,
      //   aggregate: aggregate,
      //   aggregate1:aggregate1
      // });

      let count = await this.Model.countSerch(id, status,title,v);
      ctx.body = yapi.commons.resReturn({
        count: count,
        list: result,
        aggregate: aggregate
      });
      // yapi.emitHook('case_list', result).then();
    }catch (err) {
      return(ctx.body = yapi.commons.resReturn(null, 402, err.message));
    }
  }
  /**
   * 删除一个用例
   * @interface /caselib/del
   * @method POST
   * @category caselib
   * @foldnumber 10
   * @param {Number} id 用例id，不能为空
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
      let caseData = await this.Model.get(id);
      if (!caseData) {
        return(ctx.body = yapi.commons.resReturn(null, 400, '不存在的id'));
      }

      if (caseData.uid !== this.getUid()) {
        let auth = await this.checkAuth(id, 'case', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }
      //同步绑定用例也清空
      if(caseData.interface_caseid){
        //更新interfacecase的关联用例id
        let interfaceparams = {
          testcaseid : null
        }
        await this.caseModel.up(caseData.interface_caseid,interfaceparams);
      }
      let result = await this.Model.del(id);
      let username = this.getUsername();
      let demandData = await this.demandModel.get(caseData.demandid);
      let project_id = demandData.project_id;
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了用例 ${
          caseData.title
        } `,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: project_id
      });
      return (ctx.body = yapi.commons.resReturn(result));
    } catch (e) {
      return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
    }
  }
  /**
   * 批量删除
   * @interface /caselib/batchdel
   * @method POST
   * @category caselib
   * @foldnumber 10
   * @param {Object} id 用例id，不能为空
   * @returns {Object}
   * @example
   */

   async batchdel(ctx) {
      let params = ctx.request.body;
      let id = params.id;
      if(id.length==0){
        return (ctx.body = yapi.commons.resReturn(null, 400, '参数不能为空'));
      }
      var filemessage = [];
      var successmessage =[];
      for(let i=0;i<id.length;i++){
        try {
          let caseData = await this.Model.get(id[i]);
          if (!caseData) {
            filemessage.push(`不存在的caseid_`+id[i]);
            continue
          }

          if (caseData.uid !== this.getUid()) {
            let auth = await this.checkAuth(id[i], 'case', 'danger');
            if (!auth) {
              filemessage.push(`没有权限caseid_`+id[i]);
              continue
            }
          }
          //同步绑定用例也清空
          if(caseData.interface_caseid){
            //更新interfacecase的关联用例id
            let interfaceparams = {
              testcaseid : null
            }
            await this.caseModel.up(caseData.interface_caseid,interfaceparams);
          }
          await this.Model.del(id[i]);
          let username = this.getUsername();
          let demandData = await this.demandlibModel.get(caseData.demandid);
          let project_id = demandData.project_id;
          yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了用例 ${
              caseData.title
            } `,
            type: 'project',
            uid: this.getUid(),
            username: username,
            typeid: project_id
          });
          successmessage.push(+id[i]);
        }catch (e) {
          console.log('batchdelcaseError',e)
          filemessage.push(e.message+'_'+id[i]);
        }
    }
    let delmessage={successmessage:successmessage,filemessage:filemessage};
    return (ctx.body = yapi.commons.resReturn(delmessage));
  }
 /**
   * 更新需求状态
   * @interface /caselib/upstatus
   * @method POST
   * @category caselib
   * @foldnumber 10
   * @param {Number} id id，不能为空
   * @param {String} status
   * @returns {Object}
   * @example 
   */
  async upstatus(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.id;
      let status;
      if(params.status==='pass'){
        status='通过'
      } else if(params.status==='fail'){
        status='失败'
      } else if(params.status==='undone'){
        status='待执行'
      } else if(params.status==='legacy'){
        status='遗留'
      }
      params = yapi.commons.handleParams(params, {
          status: 'string',
          id:'number'
      });
      
      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 405, '用例id不能为空'));
      }
      let caseData = await this.Model.get(id);
      if (!caseData) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
      }
      if (!params.status) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '状态不能为空'));
      }
      let auth = await this.checkAuth(params.id, 'case', 'edit');
      if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
      delete params.id;
      let result = await this.Model.upStatus(id, params.status);
      let username = this.getUsername();
      let demandData = await this.demandlibModel.get(caseData.demandid);
      let project_id = demandData.project_id;
      yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了用例 ${caseData.title} <a href="/project/${project_id}/demandlib">${status}</a>`,
          type: 'project',
          uid:this.getUid(),
          username: username,
          typeid: project_id
        });
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      return(ctx.body = yapi.commons.resReturn(null, 400, e.message));
    }
  }
  /**
  * 导入用例
  * @interface /caselib/import
  * @method POST
  * @category caselib
  * @foldnumber 10
  * @param {String} title 用例名称，不能为空
  * @param {String} model 模块，不能为空
  * @param {String} submodel 子模块
  * @param {String} preconditions 前置条件
  * @param {String} step 步骤
  * @param {String} expect 预期结果，不能为空
  * @param {String} remarks 备注
  * @param {String} priority 优先级
  * @param {Number} demandid 需求id，不能为空
  * @param {String} status 状态
  * @param {String} version 版本号
  * @param {Object} data 导入数据集
  * @param {Number} demandid 需求id，不能为空
  * @returns {Object}
  * @example 
  */
 async import(ctx) {
  let params = ctx.request.body;
  let demandid = params.demandid;
  if (!demandid) {
    return (ctx.body = yapi.commons.resReturn(null, 400, '需求id不能为空'));
  }
  let auth = await this.checkAuth(demandid, 'demand', 'edit');
  if (!auth) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
  }
  params = params.data;
  let result =[];
  let success =0;
  let fail =0;
  for(let i=0;i<params.length;i++){
    let num = i+1;
    if(params[i].status==='通过'){
      params[i].status='pass'
    } else if(params[i].status==='失败'){
      params[i].status='fail'
    } else if(params[i].status==='待执行'){
      params[i].status='undone'
    } else if(params[i].status==='遗留'){
      params[i].status='legacy'
    }else{
      result.push('第'+num+'条用例，状态不正确');
      fail = fail+1;
      continue;
    }
    params[i] = yapi.commons.handleParams(params[i], {
        title: 'string',
        model: 'string',
        submodel: 'string',
        preconditions:'string',
        step:'string',
        expect:'string',
        remarks:'string',
        priority:'string',
        status:'string',
        version:'string',
        interface_caseid:'number'
      });
    if (!params[i].model) {
      result.push('第'+num+'条用例，模块不能为空');
      fail = fail+1;
      continue;
    }
    if (!params[i].expect) {
      result.push('第'+num+'条用例，预期结果不能为空');
      fail = fail+1;
      continue;
    } 
    if (!params[i].title) {
      result.push('第'+num+'条用例，标题不能为空');
      fail = fail+1;
      continue;
    } 
    if(!params[i].submodel){
      params[i].submodel = '';
    }
    let data = {
      demandid: demandid,
      title: params[i].title,
      model: params[i].model,
      submodel: params[i].submodel,
      preconditions: params[i].preconditions,
      step: params[i].step,
      expect: params[i].expect,
      remarks: params[i].remarks,
      priority: params[i].priority,
      uid: this.getUid(),
      status: params[i].status,
      version: params[i].version,
      interface_caseid:params[i].interface_caseid,
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time()
    };
    try{
    //更新
    let oldcase = await this.Model.info(demandid,params[i].title,params[i].model,params[i].submodel);
    if(oldcase){
      //在模块下找到已拥有的用例判断一些更新条件
      result.push('第'+num+'条用例已存在，进行更新');
      if(!data.interface_caseid){
        //不去清除已关联接口用例id
        delete data.interface_caseid;
      }
      if(data.version==oldcase.version&&data.expect == oldcase.expect){
        //如果版本以及预期结果一致，则不去修改用例执行状态
        delete data.status;
      }
      await this.Model.up(oldcase._id,data);
    }else{
      await this.Model.save(data)
      result.push('第'+num+'条用例，新增成功');
    }
      success = success+1;
    }catch(err){
      result.push('第'+num+'条用例，数据库保存失败');
      fail = fail+1;
      continue;
    }
  }
  let uid = this.getUid();
  let username = this.getUsername();
  let demandData = await this.demandlibModel.get(demandid);
  let project_id = demandData.project_id;
  let demandtitle = demandData.demand;
  yapi.commons.saveLog({
    content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在需求: ${demandtitle} 导入了用例 <a href="/project/${project_id}/demandlib"></a>`,
    type: 'project',
    uid,
    username: username,
    typeid: project_id
  });
  let message = {};
  message.data = result;
  message.success = success;
  message.fail =fail;
  ctx.body = yapi.commons.resReturn(message);
}

  /**
   * 导出获取数据
   * @interface /caselib/export
   * @method POST
   * @category caselib
   * @foldnumber 10
   * @param {Number} demandid 需求id
   * @returns {Object}
   * @example
   */
   async export(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.demandid;
      let demandData = await this.demandlibModel.get(id);
      let project_id = demandData.project_id;
      let project = await this.projectModel.getBaseInfo(project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }
      let result;
      result = await this.Model.listWithexport(id); 
      let len = result.length;
      for(let i=0;i<len;i++){
        if(result[i].status==='pass'){
          result[i].status='通过'
        } else if(result[i].status==='fail'){
          result[i].status='失败'
        } else if(result[i].status==='undone'){
          result[i].status='待执行'
        } else if(result[i].status==='legacy'){
          result[i].status='遗留'
        }
      }    
      ctx.body = yapi.commons.resReturn({
        list: result
      });
      // yapi.emitHook('case_list', result).then();
    }catch (err) {
      return(ctx.body = yapi.commons.resReturn(null, 402, err.message));
    }
  }
}
module.exports = caselibController;
