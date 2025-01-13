const interfaceColModel = require('../models/interfaceCol.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const interfaceModel = require('../models/interface.js');
const projectModel = require('../models/project.js');
const baseController = require('./base.js');
const caselibModel = require('../models/caselib.js');
const userModel = require('../models/user');
const coltestReport = require('../models/coltestReport.js');
const yapi = require('../yapi.js');

class interfaceColController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.colModel = yapi.getInst(interfaceColModel);
    this.colReportModel = yapi.getInst(coltestReport);
    this.caseModel = yapi.getInst(interfaceCaseModel);
    this.interfaceModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
    this.caselibModel = yapi.getInst(caselibModel);
    this.userModel = yapi.getInst(userModel);
  }

    /**
   * 编辑测试集合数据驱动
   * @interface /col/upcolrequest
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Number} id 集合id，不能为空
   * @param {String} colpre_script
   * @param {String} colafter_script
   * @returns {Object}
   * @example 
   */
     async upcolrequest(ctx) {
      try {
        let params = ctx.request.body;
        let id = params.id;
  
        params = yapi.commons.handleParams(params, {
          colpre_script: 'string',
          colafter_script: 'string'
        });
        
        if (!id) {
          return (ctx.body = yapi.commons.resReturn(null, 405, '集合id不能为空'));
        }
        let colData = await this.colModel.get(id);
        if (!colData) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
        }
        let auth = await this.checkAuth(colData.project_id, 'project', 'edit');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
        delete params.id;
        let result = await this.colModel.up(id, params);
        // let username = this.getUsername();
        // yapi.commons.saveLog({
        //   content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了测试集合 <a href="/project/${
        //     colData.project_id
        //   }/interface/col/${id}">${colData.name}</a> 的信息`,
        //   type: 'project',
        //   uid: this.getUid(),
        //   username: username,
        //   typeid: colData.project_id
        // });
        ctx.body = yapi.commons.resReturn(result);
      } catch (e) {
        ctx.body = yapi.commons.resReturn(null, 400, e.message);
      }
    }

  /**
   * 获取所有接口用例集
   * @interface /col/listall
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} project_id email名称，不能为空
   * @returns {Object}
   * @example
   */
  async listall(ctx) {
    try {
      let id = ctx.query.project_id;
      let project = await this.projectModel.getBaseInfo(id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }
      let islist = ctx.params.islist && ctx.params.islist === '1' ? true : false;
      let result = await this.getCol(id,islist);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async getCol(project_id,islist,mycatid,ids) {
    let result= yapi.commons.getCol(project_id,islist,mycatid,ids);
    return result;
  }

  /**
   * 获取子集用例集
   * @interface /col/list
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} project_id 项目工程id
   * @param {String} parent_id 父级id
   * @returns {Object}
   * @example
   */
  async list(ctx) {
    try {
      let id = ctx.query.project_id;
      let pid = ctx.query.parent_id;
      //获取父级列表
      let result;
      if(!pid){
        let project = await this.projectModel.getBaseInfo(id);
        if (project.project_type === 'private') {
          if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
          }
        }
        result= await this.colModel.listprent(id);
      }else{
        result= await this.colModel.listchild(pid);
      }
      //优化版本 查出所有该col下caselist
      let colids = [];
      let len = result.length;
      if(len){
        result = result.sort((a, b) => a.index - b.index);
        for(let i=0;i<len;i++){
          colids.push(result[i]._id);
        }
        //获取col下所有case
        let caselist = await this.caseModel.listforcols(colids);
        let caseData = caselist.reduce((acc, item) => {
          let key = item.col_id;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});
        //获取拥有子集合的colid
        let childcollist = await this.colModel.getchildforcols(colids);

        //获取所有的接口列表
        let interfaceDataMap = new Map();
        let interfacelist = await this.interfaceModel.getPathbypid(result[0].project_id);
        interfacelist.forEach(item => {
          interfaceDataMap.set(item._id, item.path);
        });
        //重组result
        result = await Promise.all(result.map(async col => {
          col = col.toObject();
          col.parent_id = col.parent_id === undefined ? -1 : col.parent_id;
          let colid = String(col._id);
          let caseList = caseData[colid] || [];
          col.haschild = childcollist.find(item => item.parent_id === col._id) ? 1 : 0;
          if (caseList.length > 0) {
            caseList = caseList.map(item => {
              item = item.toObject();
              item.path = interfaceDataMap.get(item.interface_id);
              return item;
            }).sort((a, b) => a.index - b.index);
            col.caseList = caseList;
          }
          return col;
        }));
      }
      // //获取是否有子集合和子用例
      // let len = result.length;
      // if(len){
      //   for(let i=0;i<len;i++){
      //     let colid = result[i]._id;
      //     // let r = await this.colModel.getcol(colid);
      //     let r2 = await this.colModel.getchild(colid);
      //     result[i] = result[i].toObject();
      //     //获取子集合
      //     // if(r.length>0){
      //     //   result[i].children = r
      //     // }
      //     //是否有子集合
      //     if(r2>0){
      //       result[i].haschild=1
      //     }else{
      //       result[i].haschild=0
      //     }
      //     result[i].parent_id=(typeof result[i].parent_id) == 'undefined'?-1: result[i].parent_id;
      //     let caseList = await this.caseModel.list(result[i]._id);
      //     const interfaceDataList = await Promise.all(
      //       caseList.map(item => this.interfaceModel.getBaseinfo(item.interface_id))
      //     );
      //     interfaceDataList.forEach((item, index) => {
      //       caseList[index] = caseList[index].toObject();
      //       caseList[index].path = item.path;
      //     });
      
      //     caseList = caseList.sort((a, b) => {
      //       return a.index - b.index;
      //     });
      //     if(caseList&&caseList.length>0){
      //       result[i].caseList = caseList;
      //     }
      //   }
      // }
      // result = result.sort((a, b) => {
      //   return a.index - b.index;
      // });
  
      ctx.body = yapi.commons.resReturn(result);
      
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  /**
   * 获取集合和包含集合的树
   * @interface /col/containList
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} ids 集合id
   * @returns {Object}
   * @example
   */
  async containList(ctx) {
    try {
      let ids = ctx.query.ids;
      let islist = ctx.params.islist && ctx.params.islist === '1' ? true : false;
      let result = await this.getCol(null,islist,null,ids);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
    /**
   * 获取集合所有子集合id
   * @interface /col/getchilds
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} id 集合id
   * @returns {Object}
   * @example
   */
  async getchilds(ctx) {
    try {
      let id = ctx.query.id;
      let result = await this.colModel.getchilds(id);
      if(result.length>0){
        let resultlist = async (result,results) => {
          let promises = [];
          for (let item of result) {
            let promise = this.colModel.getchilds(item._id);
            promises.push(promise);
          }
          let res = await Promise.all(promises);
          let flattenedRes = res.flat();
       
          if (res&&flattenedRes.length > 0) {
            results.push(flattenedRes);
            await resultlist(flattenedRes,results);
          }
        }
        let results = [];
        await resultlist(result,results);
        results.forEach(item=>{
          item.forEach(it=>{
            result.push(it);
          })
        })
      }
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  /**
   * 获取集合所有测试用例集
   * @interface /col/case_listall
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} col_id 父级id
   * @returns {Object}
   * @example
   */
  async getCaseListall(ctx) {
    try {
      let col_id = ctx.query.col_id;
      let result;
      //获取父级列表
      let caseList = await this.caseModel.list(col_id);
      const interfaceDataList = await Promise.all(
        caseList.map(item => this.interfaceModel.getBaseinfo(item.interface_id))
      );
      interfaceDataList.forEach((item, index) => {
        caseList[index] = caseList[index].toObject();
        caseList[index].path = item.path;
      });
  
      caseList = caseList.sort((a, b) => {
        return a.index - b.index;
      });
      if(caseList&&caseList.length>0){
        result = caseList;
      }
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 增加测试集
   * @interface /col/add_col
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Number} project_id
   * @param {String} name
   * @param {String} desc
   * @param {Array} own
   * @param {String} case_env
   * @returns {Object}
   * @example
   */

  async addCol(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        name: 'string',
        project_id: 'number',
        desc: 'string',
        parent_id: 'number',
        case_env:'string',
        pre_col:'string'
      });

      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }
      if (!params.parent_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '父集合id不能为空'));
      }
      if (!params.name) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '名称不能为空'));
      }

      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
      if(params.pre_col){
        let preCollist = params.pre_col.split(',');
        let preCount = await this.colModel.findByIds(preCollist);
        if(preCollist.length!== preCount){
          return (ctx.body = yapi.commons.resReturn(null, 400, '前置集合未找到'));
        }
      }
      var colOwn = [];
      if(params.own&&params.own.length>0){
        for(let i=0;i<params.own.length;i++){
          let userdata = await this.userModel.findById(params.own[i]);
          if(!userdata){
            ctx.body = yapi.commons.resReturn(null, 400, '用户不存在');
          }else{
            colOwn.push({uid:userdata._id,username:userdata.username,email:userdata.email})
          }
        }
      }
      let lastindex = await this.colModel.findByIdforIndex(params.project_id,params.parent_id);
      if(lastindex==null||lastindex=='undefind'||!lastindex){
        lastindex = {};
        lastindex['index'] = 0;
      }
      let result;
      if(params.own){
        if(colOwn.length<=0){
          return (ctx.body = yapi.commons.resReturn(null, 400, '用户不存在'));
        }else{
          result = await this.colModel.save({
            name: params.name,
            project_id: params.project_id,
            desc: params.desc,
            case_env:params.case_env,
            pre_col:params.pre_col,
            uid: this.getUid(),
            parent_id: params.parent_id,
            own: colOwn,
            add_time: yapi.commons.time(),
            up_time: yapi.commons.time(),
            index: lastindex.index+1
          });
        }
      }else{
        result = await this.colModel.save({
        name: params.name,
        project_id: params.project_id,
        desc: params.desc,
        pre_col:params.pre_col,
        case_env:params.case_env,
        uid: this.getUid(),
        parent_id: params.parent_id,
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time(),
        index: lastindex.index+1
      });
      }
      
      // let result = await this.colModel.save({
      //   name: params.name,
      //   project_id: params.project_id,
      //   desc: params.desc,
      //   uid: this.getUid(),
      //   parent_id: params.parent_id,
      //   add_time: yapi.commons.time(),
      //   up_time: yapi.commons.time()
      // });

      // let username = this.getUsername();
      // yapi.commons.saveLog({
      //   content: `<a href="/user/profile/${this.getUid()}">${username}</a> 添加了测试集 <a href="/project/${
      //     params.project_id
      //   }/interface/col/${result._id}">${params.name}</a>`,
      //   type: 'project',
      //   uid: this.getUid(),
      //   username: username,
      //   typeid: params.project_id
      // });
      // this.projectModel.up(params.project_id,{up_time: new Date().getTime()}).then();
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 获取一个测试集下的所有的未禁用测试用例
   * @interface /col/case_list
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} col_id 测试集id
   * @returns {Object}
   * @example
   */
  async getCaseList(ctx) {
    let catids = ctx.query.col_id ? ctx.query.col_id.split(',') : [];
    //返回coldata
    let colData = await this.colModel.get(catids[catids.length-1]);
    let preCollist = colData.pre_col;
    //前置运行用例
    if(preCollist){
      let prelist = preCollist.split(',');
      catids.unshift(...prelist);
    }

    let handleReport=json=> {
      try {
        return JSON.parse(json);
      } catch (e) {
        return {};
      }
    }

    try {
      let alldata={};
      for(let i=0;i<catids.length;i++)
      {
        let id = Number(catids[i]);
        if (!id || id == 0) {
          return (ctx.body = yapi.commons.resReturn(null, 407, 'col_id不能为空'));
        }

        let colData = await this.colModel.get(id);
//        console.log(colData);
        let project = await this.projectModel.getBaseInfo(colData.project_id);
        if (project.project_type === 'private') {
          if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
          }
        }

        let ret= await yapi.commons.getCaseList(id);
        let test_report=handleReport(ret.colData.test_report);
        if(ret.errcode!==0){
          alldata=ret;
          break;
        }else{
          alldata.data=alldata.data?alldata.data.concat(ret.data):ret.data;
          typeof alldata.test_report==='undefined'?(alldata.test_report={}):'';
         Object.assign(alldata.test_report,test_report)
        }
      }

      let ctxBody = yapi.commons.resReturn(alldata.data);
      ctxBody.test_report = alldata.test_report;
      ctxBody.colData = colData;
      ctx.body=ctxBody;
//      console.log({'ctx.body':ctx.body});
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 获取一个测试集下的所有的测试用例的环境变量
   * @interface /col/case_env_list
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} col_id 测试集id
   * @returns {Object}
   * @example
   */
  async getCaseEnvList(ctx) {
    let catids = ctx.query.col_id ? ctx.query.col_id.split(',') : [];
    
    let colData = await this.colModel.get(catids[catids.length-1]);
    let preCollist = colData.pre_col;
    //前置运行用例
    if(preCollist){
      let prelist = preCollist.split(',');
      catids.unshift(...prelist);
    }
    try {
      let projectEnvList = [];
      let envProjectIdList=[];
      for(let i=0;i<catids.length;i++) {
        let id = Number(catids[i]);
        if (!id || id == 0) {
          return (ctx.body = yapi.commons.resReturn(null, 407, 'col_id不能为空'));
        }

        let colData = await this.colModel.get(id);
        let project = await this.projectModel.getBaseInfo(colData.project_id);
        if (project.project_type === 'private') {
          if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
          }
        }

        // 通过col_id 找到 caseList
        let projectList = await this.caseModel.list(id, 'project_id');
        // 对projectList 进行去重处理

        projectList = this.unique(projectList, 'project_id');
        projectList.forEach(id=>{envProjectIdList.includes(id)?'':envProjectIdList.push(id)});
        // 遍历projectList 找到项目和env


      }
      for (let i = 0; i < envProjectIdList.length; i++) {
        let result = await this.projectModel.getBaseInfo(envProjectIdList[i], 'name  env');
        projectEnvList.push(result);
      }
      //projectEnvList=this.unique(projectEnvList, '_id');
      ctx.body = yapi.commons.resReturn(projectEnvList);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  requestParamsToObj(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return {};
    }
    let obj = {};
    arr.forEach(item => {
      obj[item.name] = '';
    });
    return obj;
  }

  /**
   * 获取一个测试集下的所有的测试用例
   * @interface /col/case_list_by_var_params
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} col_id 测试集id
   * @returns {Object}
   * @example
   */

  async getCaseListByVariableParams(ctx) {
    try {
      let id = ctx.query.col_id;
      if (!id || id == 0) {
        return (ctx.body = yapi.commons.resReturn(null, 407, 'col_id不能为空'));
      }
      let resultList = await this.caseModel.list(id, 'all');
      if (resultList.length === 0) {
        return (ctx.body = yapi.commons.resReturn([]));
      }
      let project = await this.projectModel.getBaseInfo(resultList[0].project_id);

      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }

      for (let index = 0; index < resultList.length; index++) {
        let result = resultList[index].toObject();
        let item = {},
          body,
          query,
          bodyParams,
          pathParams;
        let data = await this.interfaceModel.get(result.interface_id);
        if (!data) {
          await this.caseModel.del(result._id);
          continue;
        }
        item._id = result._id;
        item.casename = result.casename;
        body = yapi.commons.json_parse(data.res_body);
        body = typeof body === 'object' ? body : {};
        if (data.res_body_is_json_schema) {
          body = yapi.commons.schemaToJson(body, {
            alwaysFakeOptionals: true
          });
        }
        item.body = Object.assign({}, body);
        query = this.requestParamsToObj(data.req_query);
        pathParams = this.requestParamsToObj(data.req_params);
        if (data.req_body_type === 'form') {
          bodyParams = this.requestParamsToObj(data.req_body_form);
        } else {
          bodyParams = yapi.commons.json_parse(data.req_body_other);
          if (data.req_body_is_json_schema) {
            bodyParams = yapi.commons.schemaToJson(bodyParams, {
              alwaysFakeOptionals: true
            });
          }
          bodyParams = typeof bodyParams === 'object' ? bodyParams : {};
        }
        item.params = Object.assign(pathParams, query, bodyParams);
        item.index = result.index;
        resultList[index] = item;
      }

      ctx.body = yapi.commons.resReturn(resultList);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 增加一个测试用例
   * @interface /col/add_case
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {String} casename
   * @param {Number} project_id
   * @param {String} domain
   * @param {String} path
   * @param {String} method
   * @param {Object} req_query
   * @param {Object} req_headers
   * @param {String} req_body_type
   * @param {Array} req_body_form
   * @param {String} req_body_other
   * @returns {Object}
   * @example
   */

  async addCase(ctx) {
    try {
      let params = ctx.request.body;
      params.testcaseid = null;//复制新增时如果有testcaseid则置空
      params = yapi.commons.handleParams(params, {
        casename: 'string',
        project_id: 'number',
        interface_id: 'number',
        case_env: 'string'
      });

      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }

      if (!params.interface_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空'));
      }

      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }

      if (!params.col_id||params.col_id.length == 0) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口集id不能为空'));
      }

      if (!params.casename) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '用例名称不能为空'));
      }
      if(typeof(params.col_id) == 'number'){
        let lastindex = await this.caseModel.findByIdforIndex(params.project_id,params.col_id);
        if(lastindex==null||lastindex=='undefind'||!lastindex){
          lastindex = {};
          lastindex['index'] = 0;
        }
        params.uid = this.getUid();
        params.index = lastindex.index+1;
        params.add_time = yapi.commons.time();
        params.up_time = yapi.commons.time();
        let result = await this.caseModel.save(params);
        // let username = this.getUsername();
  
        // this.colModel.get(params.col_id).then(col => {
        //   yapi.commons.saveLog({
        //     content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在测试集 <a href="/project/${
        //       params.project_id
        //     }/interface/col/${col._id}">${col.name}</a> 下添加了测试用例 <a href="/project/${
        //       params.project_id
        //     }/interface/case/${result._id}">${params.casename}</a>`,
        //     type: 'project',
        //     uid: this.getUid(),
        //     username: username,
        //     typeid: params.project_id
        //   });
        // });
        // this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();
        ctx.body = yapi.commons.resReturn(result);
      }else{
        for(let item of params.col_id){
          let lastindex = await this.caseModel.findByIdforIndex(params.project_id,item);
          if(lastindex==null||lastindex=='undefind'||!lastindex){
            lastindex = {};
            lastindex['index'] = 0;
          }
          let addData;
          params.uid = this.getUid();
          params.index = lastindex.index+1;
          params.add_time = yapi.commons.time();
          params.up_time = yapi.commons.time();
          addData = params;
          delete addData.col_id;
          addData.col_id = item;
          await this.caseModel.save(addData);
          // let username = this.getUsername();
    
          // this.colModel.get(item).then(col => {
          //   yapi.commons.saveLog({
          //     content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在测试集 <a href="/project/${
          //       params.project_id
          //     }/interface/col/${item}">${col.name}</a> 下添加了测试用例 <a href="/project/${
          //       params.project_id
          //     }/interface/case/${result._id}">${params.casename}</a>`,
          //     type: 'project',
          //     uid: this.getUid(),
          //     username: username,
          //     typeid: params.project_id
          //   });
          // });
        }
        // this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();
        ctx.body = yapi.commons.resReturn('ok');
      }
      
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async addCaseList(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        project_id: 'number',
        col_id: 'number',
        case_env:'string'
      });
      if (!params.interface_list || !Array.isArray(params.interface_list)) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'interface_list 参数有误'));
      }

      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }

      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }

      if (!params.col_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口集id不能为空'));
      }

      let data = {
        uid: this.getUid(),
        index: 0,
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time(),
        project_id: params.project_id,
        col_id: params.col_id,
        case_env:params.case_env
      };
      let lastindex = await this.caseModel.findByIdforIndex(params.project_id,params.col_id);
      if(lastindex==null||lastindex=='undefind'||!lastindex){
        lastindex = {};
        lastindex['index'] = 0;
      }
      data.index = lastindex.index+1;
      for (let i = 0; i < params.interface_list.length; i++) {
        let interfaceData = await this.interfaceModel.get(params.interface_list[i]);
        data.interface_id = params.interface_list[i];
        data.casename = interfaceData.title;

        // 处理json schema 解析
        if (
          interfaceData.req_body_type === 'json' &&
          interfaceData.req_body_other &&
          interfaceData.req_body_is_json_schema
        ) {
          let req_body_other = yapi.commons.json_parse(interfaceData.req_body_other);
          req_body_other = yapi.commons.schemaToJson(req_body_other, {
            alwaysFakeOptionals: true
          });

          data.req_body_other = JSON.stringify(req_body_other);
        } else {
          data.req_body_other = interfaceData.req_body_other;
        }

        data.req_body_type = interfaceData.req_body_type;
        await this.caseModel.save(data);
        data.index = data.index+1;
        // let username = this.getUsername();
        // this.colModel.get(params.col_id).then(col => {
        //   yapi.commons.saveLog({
        //     content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在测试集 <a href="/project/${
        //       params.project_id
        //     }/interface/col/${params.col_id}">${col.name}</a> 下导入了测试用例 <a href="/project/${
        //       params.project_id
        //     }/interface/case/${caseResultData._id}">${data.casename}</a>`,
        //     type: 'project',
        //     uid: this.getUid(),
        //     username: username,
        //     typeid: params.project_id
        //   });
        // });
      }

      // this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();

      ctx.body = yapi.commons.resReturn('ok');
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  async addCaseListBach(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        project_id: 'number'
      });
      if (!params.interface_list || !Array.isArray(params.interface_list)) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'interface_list 参数有误'));
      }
      if (!params.col_ids || !Array.isArray(params.col_ids)) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'col_ids 参数有误'));
      }
      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }

      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }

      for(let i=0;i<params.col_ids.length;i++){
        let data = {
          uid: this.getUid(),
          index: 0,
          add_time: yapi.commons.time(),
          up_time: yapi.commons.time(),
          project_id: params.project_id,
          col_id: params.col_ids[i]
        };
        //获取当前col的默认环境
        let colenv = await this.colModel.getCaseEnv(data.col_id);
        if(colenv){
          data.case_env = colenv.case_env;
        }
        let lastindex = await this.caseModel.findByIdforIndex(params.project_id,data.col_id);
        if(lastindex==null||lastindex=='undefind'||!lastindex){
          lastindex = {};
          lastindex['index'] = 0;
        }
        data.index = lastindex.index+1;
        for (let i = 0; i < params.interface_list.length; i++) {
          let interfaceData = await this.interfaceModel.get(params.interface_list[i]);
          data.interface_id = params.interface_list[i];
          data.casename = interfaceData.title;
  
          // 处理json schema 解析
          if (
            interfaceData.req_body_type === 'json' &&
            interfaceData.req_body_other &&
            interfaceData.req_body_is_json_schema
          ) {
            let req_body_other = yapi.commons.json_parse(interfaceData.req_body_other);
            req_body_other = yapi.commons.schemaToJson(req_body_other, {
              alwaysFakeOptionals: true
            });
  
            data.req_body_other = JSON.stringify(req_body_other);
          } else {
            data.req_body_other = interfaceData.req_body_other;
          }
  
          data.req_body_type = interfaceData.req_body_type;
          await this.caseModel.save(data);
          data.index = data.index+1;
          // let username = this.getUsername();
          // this.colModel.get(data.col_id).then(col => {
          //   yapi.commons.saveLog({
          //     content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在测试集 <a href="/project/${
          //       params.project_id
          //     }/interface/col/${data.col_id}">${col.name}</a> 下导入了测试用例 <a href="/project/${
          //       params.project_id
          //     }/interface/case/${caseResultData._id}">${data.casename}</a>`,
          //     type: 'project',
          //     uid: this.getUid(),
          //     username: username,
          //     typeid: params.project_id
          //   });
          // });
        }
      }

      // this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();

      ctx.body = yapi.commons.resReturn('ok');
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  async importcaseone(ctx){
    try{
      let data = ctx.request.body;
      data['uid'] = this.getUid();
      let result = await this.caseModel.save(ctx.request.body);
      ctx.body = yapi.commons.resReturn(result);
    }catch(e){
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  async cloneCaseList(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        project_id: 'number',
        col_id: 'number',
        new_col_id: 'number'
      });

      const { project_id, col_id, new_col_id } = params;

      if (!project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }

      let auth = await this.checkAuth(params.project_id, 'project', 'edit');

      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }

      if (!col_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '被克隆的接口集id不能为空'));
      }

      if (!new_col_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '克隆的接口集id不能为空'));
      }

      let oldColCaselistData = await this.caseModel.list(col_id, 'all');

      oldColCaselistData = oldColCaselistData.sort((a, b) => {
        return a.index - b.index;
      });

      const newCaseList = [];
      const oldCaseObj = {};
      let obj = {};

      const handleTypeParams = (data, name) => {
        let res = data[name];
        const type = Object.prototype.toString.call(res);
        if (type === '[object Array]' && res.length) {
          res = JSON.stringify(res);
          try {
            res = JSON.parse(handleReplaceStr(res));
          } catch (e) {
            console.log('e ->', e);
          }
        } else if (type === '[object String]' && data[name]) {
          res = handleReplaceStr(res);
        }
        return res;
      };

      const handleReplaceStr = str => {
        if (str.indexOf('$') !== -1) {
          str = str.replace(/\$\.([0-9]+)\./g, function(match, p1) {
            p1 = p1.toString();
            let newStr = '';
            if(newCaseList[oldCaseObj[p1]]){
              newStr = `$.${newCaseList[oldCaseObj[p1]]}.`
            }else{
              newStr = `$.${p1}.`
            }
            return newStr;
          });
        }
        if (str.indexOf('records') !== -1) {
          str = str.replace(/records\[([0-9]+)\]/g, function(match, p1) {
            p1 = p1.toString();
            let newStr = '';
            if(newCaseList[oldCaseObj[p1]]){
              newStr = `records[${newCaseList[oldCaseObj[p1]]}]`
            }else{
              newStr = `records[${p1}]`
            }
            return newStr;
          });
        }
        return str;
      };

      // 处理数据里面的$id;
      const handleParams = data => {
        data.col_id = new_col_id;
        delete data._id;
        delete data.add_time;
        delete data.up_time;
        delete data.__v;
        delete data.disable;
        delete data.testcaseid;
        data.req_headers = handleTypeParams(data,'req_headers');
        data.req_body_other = handleTypeParams(data, 'req_body_other');
        data.req_query = handleTypeParams(data, 'req_query');
        data.req_params = handleTypeParams(data, 'req_params');
        data.req_body_form = handleTypeParams(data, 'req_body_form');
        data.test_script = handleTypeParams(data,'test_script');
        return data;
      };

      for (let i = 0; i < oldColCaselistData.length; i++) {
        obj = oldColCaselistData[i].toObject();
        // 将被克隆的id和位置绑定
        oldCaseObj[obj._id] = i;
        let caseData = handleParams(obj);
        let newCase = await this.caseModel.save(caseData);
        newCaseList.push(newCase._id);
      }

      // this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();
      ctx.body = yapi.commons.resReturn('ok');
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 更新一个测试用例
   * @interface /col/up_case
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {number} id
   * @param {String} casename
   * @param {String} domain
   * @param {String} path
   * @param {String} method
   * @param {Object} req_query
   * @param {Object} req_headers
   * @param {String} req_body_type
   * @param {Array} req_body_form
   * @param {String} req_body_other
   * @param {String} pre_script
   * @param {String} post_script
   * @param {String} disable //是否禁用
   * @param {String} testcaseid //关联用例id
   * @param {String} sql
   * @returns {Object}
   * @example
   */

  async upCase(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        id: 'number',
        casename: 'string'
      });

      if (!params.id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '用例id不能为空'));
      }

      // if (!params.casename) {
      //   return (ctx.body = yapi.commons.resReturn(null, 400, '用例名称不能为空'));
      // }

      let caseData = await this.caseModel.get(params.id);
      let auth = await this.checkAuth(caseData.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
      //更新不动用例所归属人
      // params.uid = this.getUid();
      //同步用例key
      if(params.testcaseid){
        let caselibData = await this.caselibModel.get(params.testcaseid);
        if(!caselibData){
          return (ctx.body = yapi.commons.resReturn(null, 400, '用例不存在'));
        }else{
          let resultdata = await this.caseModel.getTestcaseid(params.testcaseid);
          if(resultdata&&caseData.testcaseid!=params.testcaseid){
            return (ctx.body = yapi.commons.resReturn(null, 400, '用例已被绑定'));
          }else if(caseData&&caseData.testcaseid!=params.testcaseid){
            await this.caselibModel.upInterfacecaseid(caseData.testcaseid,null);
            await this.caselibModel.upInterfacecaseid(params.testcaseid,params.id);
          }else{
            await this.caselibModel.upInterfacecaseid(params.testcaseid,params.id);
          }
        }
      }else if(caseData.testcaseid){
        await this.caselibModel.upInterfacecaseid(caseData.testcaseid,null);
      }
      //判断是否是同父级下的集合,不同父级则排序在最后面
      if(params.col_id){
        let olddata = await this.caseModel.findById(params.id);
        let oldcid = olddata.col_id;
        if(params.col_id!=oldcid){
          let lastindex = await this.caseModel.findByIdforIndex(olddata.project_id,params.col_id);
          if(lastindex==null||lastindex=='undefind'||!lastindex){
            lastindex = {};
            lastindex['index'] = 0;
          }
          params.index = lastindex.index+1;
        }
      }
      //不允许修改接口id和项目id
      delete params.interface_id;
      delete params.project_id;
      //console.log(params);
      let result = await this.caseModel.up(params.id, params);
      // let username = this.getUsername();
      // this.colModel.get(caseData.col_id).then(col => {
      //   yapi.commons.saveLog({
      //     content: `<a href="/user/profile/${this.getUid()}">${username}</a> 在测试集 <a href="/project/${
      //       caseData.project_id
      //     }/interface/col/${caseData.col_id}">${col.name}</a> 更新了测试用例 <a href="/project/${
      //       caseData.project_id
      //     }/interface/case/${params.id}">${params.casename || caseData.casename}</a>`,
      //     type: 'project',
      //     uid: this.getUid(),
      //     username: username,
      //     typeid: caseData.project_id
      //   });
      // });

      // this.projectModel.up(caseData.project_id, { up_time: new Date().getTime() }).then();

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  /**
   * 测试用例批量配置
   * @interface /col/bachChangeCase
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array} upcases
   * @returns {Object}
   * @example
   */

  async bachChangeCase(ctx) {
    try {
      let params = ctx.request.body;
      if(params.upcases.length==0){
        return (ctx.body = yapi.commons.resReturn(null, 200, '更新成功'));
      }
      let err;
      for(let i=0;i<params.upcases.length;i++){
        if(i==0){
          let caseData = await this.caseModel.get(params.upcases[i]._id);
          let auth = await this.checkAuth(caseData.project_id, 'project', 'edit');
          if (!auth) {
            err = '没有权限'
            break;
          }
        }
        await this.caseModel.up(params.upcases[i]._id,params.upcases[i]);
      }
      if(err){
        ctx.body = yapi.commons.resReturn(null, 402, err);
      }else{
        ctx.body = yapi.commons.resReturn(null, 200, '更新成功');
      }
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  /**
   * 测试用例批量更新
   * @interface /col/bachUpCase
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Object} casedata //用例基础信息
   * @param {number} interfaceid
   * @param {String} case_env
   * @param {String} upjsonname
   * @param {String} newjsonname
   * @param {String} addjsonname
   * @param {String} addjsonvlue
   * @param {String} deljsonname
   * @param {String} upjsonvalue
   * @param {String} upstr
   * @param {String} upnewstr
   * @param {String} uptestscriptstr
   * @param {String} uptestscriptnewstr
   * @param {String} upprescriptstr
   * @param {String} upprescriptnewstr
   * @param {String} upafterscriptstr
   * @param {String} upafterscriptnewstr
   * @param {Array} upcaseids
   * @returns {Object}
   * @example
   */

  async bachUpcase(ctx) {
    try {
      let params = ctx.request.body;
      //可能不更新interface
      if(params.interfaceid){
        let Data = await this.interfaceModel.get(params.interfaceid);
        let auth = await this.checkAuth(Data.project_id, 'project', 'edit');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }else{
        if(params.upcaseids.length==0){
          return (ctx.body = yapi.commons.resReturn(null, 400, '更新用例id为空'));
        }
      }
      // params.uid = this.getUid();
      // let uid = this.getUid();
      //通过interfaceid查出关联的用例
      let caseList;
      if(params.upcaseids.length>0){
        //通过caseid查询每个case值
        let caseiddate = []
        params.upcaseids.forEach(item=>{
          let data={};
          data._id=item;
          caseiddate.push(data);
        })
        caseList = await this.caseModel.getsynccaseforids(caseiddate);
      }else{
        caseList = await this.caseModel.getsynccase(params.interfaceid);
      }

      if(caseList&&caseList.length>0){
        let len = caseList.length;
        for(let i=0;i<len;i++){
          await this.bachUpCaseInfo(params,caseList[i]);
        }

        ctx.body = yapi.commons.resReturn(null, 200, '更新成功');
      }else{
        ctx.body = yapi.commons.resReturn(null, 400, '暂无关联用例');
      }
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  //casedata是原用例数据
  async bachUpCaseInfo(params,casedata){
    let id = casedata._id;
    //更新关联接口id
    if(params.interfaceid&&params.interfaceid!==casedata.interface_id){
      await this.caseModel.upinterfaceid(id,params.interfaceid);
    }
    //更新关联环境id
    if(params.case_env&&params.case_env!==casedata.case_env){
      await this.caseModel.upenv(id,params.case_env);
    }
    //更新header
    if(params.headers){
      let new_header = JSON.parse(params.headers);
      //获取有多少个key
      let keysArray = Object.keys(new_header);
      //原数据header
      let header = casedata.req_headers;
      header.forEach(item=>{
        keysArray.forEach(key=>{
          if(item.name == key){
            item.value = new_header[key];
          }
        })
        
      })
      await this.caseModel.upheader(id,header);
    }
    //替换参数名
    if(params.upjsonname){
      let body = casedata.req_body_other;
      if(body.indexOf(params.upjsonname)>=0||body.indexOf(params.upjsonname.split('.')[0])>=0){
        let bodydata = JSON.parse(body);
        //判断嵌套
        if(params.upjsonname.indexOf('.')>=0){
          // 使用.分割原始键名和新键名
          var oldKeys = params.upjsonname.split('.');
          var newKeys = params.newjsonname.split('.');

          // 遍历原始键名的每一层
          var currentObj = bodydata;
          for (var j = 0; j < oldKeys.length - 1; j++) {
            var key = oldKeys[j];
            currentObj = currentObj[key];
          }

          // 获取原始键名的最后一层
          var lastOldKey = oldKeys[oldKeys.length - 1];

          // 修改键名
          currentObj[newKeys[newKeys.length - 1]] = currentObj[lastOldKey];
          delete currentObj[lastOldKey];
          body = JSON.stringify(bodydata);
        } else{
          bodydata[params.newjsonname] = bodydata[params.upjsonname];
          delete bodydata[params.upjsonname];
          body = JSON.stringify(bodydata)
        }            
        await this.caseModel.upjsonbody(id, body);
      }

    }
    //新增参数
    if(params.addjsonname){
      let body = casedata.req_body_other;
      let jsonbody = JSON.parse(body);
      jsonbody[params.addjsonname] = params.addjsonvlue;
      body = JSON.stringify(jsonbody);
      await this.caseModel.upjsonbody(id, body);
    }
    //删除参数
    if(params.deljsonname){
      let body = casedata.req_body_other;
      if(body.indexOf(params.deljsonname)>=0){
        let jsonbody = JSON.parse(body);
        delete jsonbody[params.deljsonname];
        body = JSON.stringify(jsonbody);
        await this.caseModel.upjsonbody(id, body);
      }
    }
    //更新参数值
    if(params.upjsonvalue){
      let body = casedata.req_body_other;
      let data = JSON.parse(params.upjsonvalue);
      let keys = Object.keys(data)
      let jsonbody = JSON.parse(body);
      for(let j=0;j<keys.length;j++){
        jsonbody[keys[j]] = data[keys[j]];
      }
      body = JSON.stringify(jsonbody);
      await this.caseModel.upjsonbody(id, body);
    }
    //更新替换一些字符
    if(params.upstr){
      let body = casedata.req_body_other; 
      if(typeof(body) !== "undefined" && body !== null && body.trim() !== "") {
        body = body.toString();
        if(body.indexOf(params.upstr) !== -1){
          var regex = new RegExp(params.upstr.replace(/\\/g, "\\\\"), "g");
          body = body.replace(regex,params.upnewstr);
          await this.caseModel.upjsonbody(id, body);
        }
      }     
    }
    //更新前置js处理器
    if(params.upprescriptstr){
      let case_pre_script = casedata.case_pre_script;  
      if(typeof(case_pre_script) !== "undefined" && case_pre_script !== null && case_pre_script.trim() !== "") {
        case_pre_script = case_pre_script.toString();
        if(case_pre_script.indexOf(params.upprescriptstr) !== -1){
          var regex = new RegExp(params.upprescriptstr.replace(/\\/g, "\\\\"), "g");
          case_pre_script = case_pre_script.replace(regex,params.upprescriptnewstr);
          await this.caseModel.upprescript(id, case_pre_script);
        }
      }
    }
    //更新后置js处理器
    if(params.upafterscriptstr){
      let case_post_script = casedata.case_post_script;
      if(typeof(case_post_script) !== "undefined" && case_post_script !== null && case_post_script.trim() !== "") {
        case_post_script = case_post_script.toString();
        if(case_post_script.indexOf(params.upafterscriptstr) !== -1){
          var regex = new RegExp(params.upafterscriptstr.replace(/\\/g, "\\\\"), "g");
          case_post_script = case_post_script.replace(regex,params.upafterscriptnewstr);
          await this.caseModel.upafterscript(id, case_post_script);
        }
      }   
    }
    //更新测试断言，替换一些名称
    if(params.uptestscriptstr){
      let test_script = casedata.test_script;
      if(typeof(test_script) !== "undefined" && test_script !== null && test_script.trim() !== "") {
        test_script = test_script.toString();
        if(test_script.indexOf(params.uptestscriptstr) !== -1){
          var regex = new RegExp(params.uptestscriptstr.replace(/\\/g, "\\\\"), "g");
          test_script = test_script.replace(regex,params.uptestscriptnewstr);
          await this.caseModel.uptestsctiptstr(id, test_script);
        }
      }
    }
  }
  /**
   * 获取一个测试用例详情
   * @interface /col/case
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} caseid
   * @returns {Object}
   * @example
   */

  async getCase(ctx) {
    try {
      let id = ctx.query.caseid;
      let result = await this.caseModel.get(id);
      if (!result) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '不存在的case'));
      }
      result = result.toObject();
      let data = await this.interfaceModel.get(result.interface_id);
      if (!data) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '找不到对应的接口，请联系管理员'));
      }
      data = data.toObject();

      let projectData = await this.projectModel.getBaseInfo(data.project_id);
      result.path = projectData.basepath + data.path;
      result.method = data.method;
      result.req_body_type = data.req_body_type;
      result.req_headers = yapi.commons.handleParamsValue(data.req_headers, result.req_headers);
      result.res_body = data.res_body;
      result.res_body_type = data.res_body_type;
      result.req_body_form = yapi.commons.handleParamsValue(
        data.req_body_form,
        result.req_body_form
      );  
      try{
        // 处理json schema 解析为了覆盖相同key
        if (
          data.req_body_type === 'json' &&
          data.req_body_other 
          // data.req_body_is_json_schema
        ) {
          let req_body_other = yapi.commons.json_parse(data.req_body_other);
          req_body_other = yapi.commons.schemaToJson(req_body_other, {
            alwaysFakeOptionals: true
          });
          // result.plt_body_other =  req_body_other;
          data.req_body_other = JSON.stringify(req_body_other);

          // result.req_body_other = JSON.stringify(result.req_body_other);

          // 转为json
          // result.req_body_other = JSON.parse(result.req_body_other);
          // data.req_body_other = JSON.parse(data.req_body_other);

          // //覆盖相同key值
          // for(var x in data.req_body_other)
          //   {
          //   if(result.req_body_other[x])
          //   {
          //     data.req_body_other[x] = result.req_body_other[x];
          //   }
          //   }
          // //转为string
          // result.req_body_other= JSON.stringify(result.req_body_other);
          // data.req_body_other= JSON.stringify(data.req_body_other);
          result.tpl_body_other = data.req_body_other;  
        }
      }catch(err){
        console.log('无法同步用例，建议删除注释')
      }
      
      result.req_query = yapi.commons.handleParamsValue(data.req_query, result.req_query);
      result.req_params = yapi.commons.handleParamsValue(data.req_params, result.req_params);
      result.interface_up_time = data.up_time;
      result.req_body_is_json_schema = data.req_body_is_json_schema;
      result.res_body_is_json_schema = data.res_body_is_json_schema;
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }

  /**
   * 更新一个测试集
   * @interface /col/up_col
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {String} name
   * @param {String} desc
   * @param {Array} own
   * @param {String} case_env
   * @returns {Object}
   * @example
   */

  async upCol(ctx) {
    try {
      let params = ctx.request.body;
      let id = params.col_id;
      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '缺少 col_id 参数'));
      }
      let colData = await this.colModel.get(id);
      if (!colData) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '不存在'));
      }
      let auth = await this.checkAuth(colData.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
      if(params.pre_col){
        let preCollist = params.pre_col.split(',');
        let preCount = await this.colModel.findByIds(preCollist);
        if(preCollist.length!== preCount){
          return (ctx.body = yapi.commons.resReturn(null, 400, '前置集合未找到'));
        }
      }
      delete params.col_id;
      var colOwn = [];
      
      //若当前为json对象则不更新该字段
      if(params.own&&typeof params.own[0] =='object' && Object.prototype.toString.call(params.own[0]) === '[object Object]'){
        delete params.own
      }
      //若当前为数组则重组该字段
      if(params.own&&params.own.length>0){
        for(let i=0;i<params.own.length;i++){
            let userdata = await this.userModel.findById(params.own[i]);
            if(!userdata){
              ctx.body = yapi.commons.resReturn(null, 400, '用户不存在');
            }else{
              colOwn.push({uid:userdata._id,username:userdata.username,email:userdata.email})
            }
        }
      }
      //判断是否是同父级下的集合,不同父级则排序在最后面
      if(params.parent_id){
        let olddata = await this.colModel.findById(id);
        let oldpid = olddata.parent_id;
        if(params.parent_id!=oldpid){
          let lastindex = await this.colModel.findByIdforIndex(olddata.project_id,params.parent_id);
          if(lastindex==null||lastindex=='undefind'||!lastindex){
            lastindex = {};
            lastindex['index'] = 0;
          }
          params.index = lastindex.index+1;
        }
      }
      let result;
      if(colOwn.length>0){
        params.own = colOwn;
        result = await this.colModel.up(id, params);
      }else{
        delete params.own
        result = await this.colModel.up(id, params);
      }

      // let result = await this.colModel.up(id, params);
      //只记录运行集合后日志
      if(params.test_report){
        const yapiuser = ctx.req.headers['yapi-user'];
        const match = yapiuser.match(/username=([^;]+)/);
        let executor;
        if(match){
          executor = decodeURIComponent(match[1])
        }else{
          executor = '匿名执行者'
        }
        let saveColReport = {
          colid : id,
          run_end : params.run_end,
          run_start : params.run_start,
          add_time : yapi.commons.time(),
          executor : executor,
          status: params.status,
          test_report : params.test_report
        }
        this.colReportModel.save(saveColReport);//异步保存就行
        let username = this.getUsername();
        yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 运行了测试集合 <a href="/project/${
            colData.project_id
          }/interface/col/${id}">${colData.name}</a> 并更新了报告`,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: colData.project_id
        });
      }

      // //子集合有错将同步所有父集合
      // if(params.status==1){
      //   delete params.test_report;
      //   while(colData.parent_id>0){
      //     await this.colModel.up(colData.parent_id, params);
      //     colData = await this.colModel.get(colData.parent_id);
      //   }
      // }
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }
  /**
   * 获取测试报告日志
   * @interface /col/getReportLog
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} id 集合id
   * @returns {Object}
   * @example
   */
  async getReportLog(ctx) {
    try {
      let id = ctx.query.id;
      let result = await this.colReportModel.findSimpleByColId(id);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }
  /**
   * 获取日志中的具体测试报告
   * @interface /col/getReportDetail
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} id id
   * @returns {Object}
   * @example
   */
    async getReportDetail(ctx) {
      try {
        let id = ctx.query.id;
        let result = await this.colReportModel.findReportById(id);
        ctx.body = yapi.commons.resReturn(result);
      } catch (e) {
        ctx.body = yapi.commons.resReturn(null, 402, e.message);
      }
    }
  /**
   * 更新多个接口case index
   * @interface /col/up_case_index
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async upCaseIndex(ctx) {
    try {
      let params = ctx.request.body;
      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '请求参数必须是数组');
      }
      params.forEach(item => {
        if (item.id) {
          this.caseModel.upCaseIndex(item.id, item.index).then(
            res => {},
            err => {
              yapi.commons.log(err.message, 'error');
            }
          );
        }
      });

      return (ctx.body = yapi.commons.resReturn('成功！'));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }


    /**
     * 根据接口id 刷新用例
     * @interface /col/flush
     * @method POST
     * @category col
     * @foldnumber 10
     * @param {Number}  interface_id
     * @returns {Object}
     * @example
     */
    async flush(ctx) {
        let params = ctx.params;
        if (!this.$tokenAuth) {
            let auth = await this.checkAuth(params.pid, 'project', 'edit');
            if (!auth) {
                return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
            }
        }

        try {
            this.caseModel.flush(params.inpid,params.pid).then(
                res => {},
                err => {
                    yapi.commons.log(err.message, 'error');
                }
            );
            return (ctx.body = yapi.commons.resReturn('成功！'));
        } catch (e) {
            ctx.body = yapi.commons.resReturn(null, 400, e.message);
        }
    }

  /**
   * 移动用例case
   * @interface /col/move
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async move(ctx) {
    let params = ctx.params;
    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(params.pid, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
    }


    try {
      this.caseModel.move(params.caseId,  params.cid).then(
          res => {},
          err => {
            yapi.commons.log(err.message, 'error');
          }
      );
      return (ctx.body = yapi.commons.resReturn('成功！'));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }


  /**
   * 更新多个测试集合 index
   * @interface /col/up_col_index
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async upColIndex(ctx) {
    try {
      let params = ctx.request.body;
      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '请求参数必须是数组');
      }
      params.forEach(item => {
        if (item.id) {
          this.colModel.upColIndex(item.id, item.index).then(
            res => {},
            err => {
              yapi.commons.log(err.message, 'error');
            }
          );
        }
      });

      return (ctx.body = yapi.commons.resReturn('成功！'));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }
  /**
   * 获取测试集信息
   * @interface /col/getColdetil
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String} col_id 集合id
   * @returns {Object}
   * @example
   */

  async getColdetil(ctx) {
    try {
      let id = ctx.query.col_id;
      let colData = await this.colModel.get(id);
      return (ctx.body = yapi.commons.resReturn(colData));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }
  /**
   * 删除一个测试集
   * @interface /col/del_col
   * @method GET
   * @category col
   * @foldnumber 10
   * @param {String}
   * @returns {Object}
   * @example
   */

  async delCol(ctx) {
    try {
      let id = ctx.query.col_id;
      let colData = await this.colModel.get(id);
      if (!colData) {
        ctx.body = yapi.commons.resReturn(null, 400, '不存在的id');
      }

      if (colData.uid !== this.getUid()) {
        let auth = await this.checkAuth(colData.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }

      //查找是否有子集，也就是否有parentid是该删除集合的id
      let colDataids = await this.colModel.getpid(id);
      let result;
      let r;
      if(colDataids){
        //获取所有的子集id
        result = await this.colModel.getchilds(id);
        if(result.length>0){
          let resultlist = async (result,results) => {
            let promises = [];
            for (let item of result) {
              let promise = this.colModel.getchilds(item._id);
              promises.push(promise);
            }
            let res = await Promise.all(promises);
            let flattenedRes = res.flat();
         
            if (res&&flattenedRes.length > 0) {
              results.push(flattenedRes);
              await resultlist(flattenedRes,results);
            }
          }
          let results = [];
          await resultlist(result,results);
          results.forEach(item=>{
            item.forEach(it=>{
              result.push(it);
            })
          })
        }
        let ids = [parseInt(id)];
        result.forEach(item=>(
          ids.push(item._id)
        ))
        let promises = [];
        for (let itemid of ids) {
          let promise = await this.colModel.del(itemid);
          await this.caseModel.delByCol(itemid);
          promises.push(promise);
        }
        let res = await Promise.all(promises);
        r = res.flat();
        // let coltreenode=await this.getCol(colData.project_id,false,id);
        // let delcoltree= async coldata => {

        //   if(coldata.children&&coldata.children.length>0){
        //     coldata.children.forEach(subcol=>{
        //       delcoltree(subcol)
        //     })
        //   }

        //   result = await this.colModel.del(coldata._id);
        //   await this.caseModel.delByCol(coldata._id);
        //   return result
        // }
        // r=delcoltree(coltreenode);
      }else{
        r = await this.colModel.del(id);
        await this.caseModel.delByCol(id);
      }
      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了测试集 ${
          colData.name
        } 及子测试集以及其下面的用例`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: colData.project_id
      });
      return (ctx.body = yapi.commons.resReturn(r));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

  /**
   *
   * @param {*} ctx
   */

  async delCase(ctx) {
    try {
      let caseid = ctx.query.caseid;
      let caseData = await this.caseModel.get(caseid);
      if (!caseData) {
        ctx.body = yapi.commons.resReturn(null, 400, '不存在的caseid');
      }

      if (caseData.uid !== this.getUid()) {
        let auth = await this.checkAuth(caseData.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }
      //同步绑定用例也清空
      if(caseData.testcaseid){
        //更新caselib的关联用例id
        await this.caselibModel.upInterfacecaseid(caseData.testcaseid,null);
      }
      let result = await this.caseModel.del(caseid);

      let username = this.getUsername();
      this.colModel.get(caseData.col_id).then(col => {
        yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了测试集 <a href="/project/${
            caseData.project_id
          }/interface/col/${caseData.col_id}">${col.name}</a> 下的用例 ${caseData.casename}`,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: caseData.project_id
        });
      });

      this.projectModel.up(caseData.project_id, { up_time: new Date().getTime() }).then();
      return (ctx.body = yapi.commons.resReturn(result));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }
    /**
   * 批量删除测试用例case
   * @interface /col/batchdelcase
   * @method POST
   * @example
   */
  async batchdelCase(ctx) {
    let caseids = ctx.params.caseids;
    if(caseids.length==0){
      return (ctx.body = yapi.commons.resReturn(null, 400, '参数不能为空'));
    }
    var filemessage = [];
    var successmessage =[];
    for (const caseid of caseids) {
      try{
        let caseData = await this.caseModel.get(caseid);
        if (!caseData) {
          filemessage.push(`不存在的caseid_`+caseid);
          continue
        }
        if (caseData.uid !== this.getUid()) {
          let auth = await this.checkAuth(caseData.project_id, 'project', 'danger');
          if (!auth) {
            filemessage.push(`没有权限caseid_`+caseid);
            continue
          }
        }
        //同步绑定用例也清空
        if(caseData.testcaseid){
          //更新caselib的关联用例id
          await this.caselibModel.upInterfacecaseid(caseData.testcaseid,null);
        }
        await this.caseModel.del(caseid);

        let username = this.getUsername();
        this.colModel.get(caseData.col_id).then(col => {
          yapi.commons.saveLog({
            content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了测试集 <a href="/project/${
              caseData.project_id
            }/interface/col/${caseData.col_id}">${col.name}</a> 下的用例 ${caseData.casename}`,
            type: 'project',
            uid: this.getUid(),
            username: username,
            typeid: caseData.project_id
          });
        });

        this.projectModel.up(caseData.project_id, { up_time: new Date().getTime() }).then();
        successmessage.push(caseid);
      }catch(e){
        console.log('batchdelcaseError',e)
        filemessage.push(e.message+'_'+caseid);
      }
    }
    let delmessage={successmessage:successmessage,filemessage:filemessage};
    return (ctx.body = yapi.commons.resReturn(delmessage));
  }
  async runCaseScript(ctx) {
    let params = ctx.request.body;
    ctx.body = await yapi.commons.runCaseScript(params, params.col_id, params.interface_id, this.getUid());
  }

  async splitFile(ctx){
    let params = ctx.request.body;
    ctx.body = await yapi.commons.splitFile(params.filePath, params.chunkSize);
  }

  async generateFile(ctx){
    let params = ctx.request.body;
    ctx.body = await yapi.commons.generateFile(params.filePath, params.fileSizeInBytes);
  }
  // 数组去重
  unique(array, compare) {
    let hash = {};
    let arr = array.reduce(function(item, next) {
      hash[next[compare]] ? '' : (hash[next[compare]] = true && item.push(next));
      // console.log('item',item.project_id)
      return item;
    }, []);
    // 输出去重以后的project_id
    return arr.map(item => {
      return item[compare];
    });
  }
}

module.exports = interfaceColController;
