const interfaceModel = require('../models/interface.js');
const interfaceCatModel = require('../models/interfaceCat.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const followModel = require('../models/follow.js');
const groupModel = require('../models/group.js');
const _ = require('underscore');
const url = require('url');
const baseController = require('./base.js');
const yapi = require('../yapi.js');
const userModel = require('../models/user.js');
const projectModel = require('../models/project.js');
const jsondiffpatch = require('jsondiffpatch');
const formattersHtml = jsondiffpatch.formatters.html;
const showDiffMsg = require('../../common/diff-view.js');
const mergeJsonSchema = require('../../common/mergeJsonSchema');
const fs = require('fs-extra');
const path = require('path');
const GenerateSchema = require('generate-schema/src/schemas/json.js');
const mocker = require("pbmock");
const commons = require('../utils/commons.js');
const fsl = require('fs');
const axios = require('axios');
const QRCode = require('qrcode');

// const annotatedCss = require("jsondiffpatch/public/formatters-styles/annotated.css");
// const htmlCss = require("jsondiffpatch/public/formatters-styles/html.css");


function handleHeaders(values){
  let isfile = false,
  isHavaContentType = false;
  if (values.req_body_type === 'form') {
    values.req_body_form.forEach(item => {
      if (item.type === 'file') {
        isfile = true;
      }
    });

    values.req_headers.map(item => {
      if (item.name === 'Content-Type') {
        item.value = isfile ? 'multipart/form-data' : 'application/x-www-form-urlencoded';
        isHavaContentType = true;
      }
    });
    if (isHavaContentType === false) {
      values.req_headers.unshift({
        name: 'Content-Type',
        value: isfile ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
      });
    }
  } else if (values.req_body_type === 'json') {
    values.req_headers
      ? values.req_headers.map(item => {
          if (item.name === 'Content-Type') {
            item.value = 'application/json';
            isHavaContentType = true;
          }
        })
      : [];
    if (isHavaContentType === false) {
      values.req_headers = values.req_headers || [];
      values.req_headers.unshift({
        name: 'Content-Type',
        value: 'application/json'
      });
    }
  }
}


class interfaceController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.Model = yapi.getInst(interfaceModel);
    this.catModel = yapi.getInst(interfaceCatModel);
    this.projectModel = yapi.getInst(projectModel);
    this.caseModel = yapi.getInst(interfaceCaseModel);
    this.followModel = yapi.getInst(followModel);
    this.userModel = yapi.getInst(userModel);
    this.groupModel = yapi.getInst(groupModel);

    const minLengthStringField = {
      type: 'string',
      minLength: 1
    };

    const addAndUpCommonField = {
      desc: 'string',
      status: 'string',
      req_query: [
        {
          name: 'string',
          value: 'string',
          example: 'string',
          desc: 'string',
          required: 'string'
        }
      ],
      req_headers: [
        {
          name: 'string',
          value: 'string',
          example: 'string',
          desc: 'string',
          required: 'string'
        }
      ],
      req_body_type: 'string',
      req_params: [
        {
          name: 'string',
          example: 'string',
          desc: 'string'
        }
      ],
      req_body_form: [
        {
          name: 'string',
          type: {
            type: 'string'
          },
          example: 'string',
          desc: 'string',
          required: 'string'
        }
      ],
      req_body_other: 'string',
      res_body_type: 'string',
      res_body: 'string',
      custom_field_value: 'string',
      api_opened: 'boolean',
      req_body_is_json_schema: 'string',
      res_body_is_json_schema: 'string',
      markdown: 'string',
      owners: ['number'],
    };

    this.schemaMap = {
      add: Object.assign(
        {
          '*project_id': 'number',
          '*path': minLengthStringField,
          '*title': minLengthStringField,
          '*method': minLengthStringField,
          '*catid': 'number'
        },
        addAndUpCommonField
      ),
      up: Object.assign(
        {
          '*id': 'number',
          project_id: 'number',
          path: minLengthStringField,
          title: minLengthStringField,
          method: minLengthStringField,
          catid: 'number',
          switch_notice: 'boolean',
          message: minLengthStringField,
          tag: 'array'
        },
        addAndUpCommonField
      ),
      save: Object.assign(
        {
          project_id: 'number',
          catid: 'number',
          title: minLengthStringField,
          path: minLengthStringField,
          method: minLengthStringField,
          message: minLengthStringField,
          dataSync: 'string'
        },
        addAndUpCommonField
      )
    };
  }

  /**
   * 添加项目接口
   * @interface /interface/add
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @param {String}   title 接口标题，不能为空
   * @param {String}   path 接口请求路径，不能为空
   * @param {String}   method 请求方式
   * @param {Array}  [req_headers] 请求的header信息
   * @param {String}  [req_headers[].name] 请求的header信息名
   * @param {String}  [req_headers[].value] 请求的header信息值
   * @param {Boolean}  [req_headers[].required] 是否是必须，默认为否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 请求参数方式，有["form", "json", "text", "xml"]四种
   * @param {Array} [req_params] name, desc两个参数
   * @param {Mixed}  [req_body_form] 请求参数,如果请求方式是form，参数是Array数组，其他格式请求参数是字符串
   * @param {String} [req_body_form[].name] 请求参数名
   * @param {String} [req_body_form[].value] 请求参数值，可填写生成规则（mock）。如@email，随机生成一条email
   * @param {String} [req_body_form[].type] 请求参数类型，有["text", "file"]两种
   * @param {String} [req_body_other]  非form类型的请求参数可保存到此字段
   * @param {String}  [res_body_type] 相应信息的数据格式，有["json", "text", "xml"]三种
   * @param {String} [res_body] 响应信息，可填写任意字符串，如果res_body_type是json,则会调用mock功能
   * @param  {String} [desc] 接口描述
   * @returns {Object}
   * @example ./api/interface/add.json
   */
  async add(ctx) {
    let params = ctx.params;

    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(params.project_id, 'project', 'edit');

      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 40033, '没有权限'));
      }
    }
    params.method = params.method || 'GET';
    params.res_body_is_json_schema = _.isUndefined(params.res_body_is_json_schema)
      ? false
      : params.res_body_is_json_schema;
    params.req_body_is_json_schema = _.isUndefined(params.req_body_is_json_schema)
      ? false
      : params.req_body_is_json_schema;
    params.method = params.method.toUpperCase();
    params.req_params = params.req_params || [];
    params.res_body_type = params.res_body_type ? params.res_body_type.toLowerCase() : 'json';
    let http_path = url.parse(params.path, true);

    if (!yapi.commons.verifyPath(http_path.pathname)) {
      return (ctx.body = yapi.commons.resReturn(
        null,
        400,
        'path第一位必需为 /, 只允许由 字母数字-/_:.! 组成'
      ));
    }

    handleHeaders(params)

    params.query_path = {};
    params.query_path.path = http_path.pathname;
    params.query_path.params = [];
    Object.keys(http_path.query).forEach(item => {
      params.query_path.params.push({
        name: item,
        value: http_path.query[item]
      });
    });

    let checkRepeat = await this.Model.checkRepeat(params.project_id, params.path, params.method);

    if (checkRepeat > 0) {
      return (ctx.body = yapi.commons.resReturn(
        null,
        40022,
        '已存在的接口:' + params.path + '[' + params.method + ']'
      ));
    }

    let data = Object.assign(params, {
      uid: this.getUid(),
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time()
    });

    yapi.commons.handleVarPath(params.path, params.req_params);

    if (params.req_params.length > 0) {
      data.type = 'var';
      data.req_params = params.req_params;
    } else {
      data.type = 'static';
    }

    // 新建接口的人成为项目dev  如果不存在的话
    // 命令行导入时无法获知导入接口人的信息，其uid 为 999999
    let uid = this.getUid();

    if (this.getRole() !== 'admin' && uid !== 999999) {
      let userdata = await yapi.commons.getUserdata(uid, 'dev');
      // 检查一下是否有这个人
      let check = await this.projectModel.checkMemberRepeat(params.project_id, uid);
      if (check === 0 && userdata) {
        await this.projectModel.addMember(params.project_id, [userdata]);
      }
    }

    let result = await this.Model.save(data);
    yapi.emitHook('interface_add', result).then();
    this.catModel.get(params.catid).then(cate => {
      let username = this.getUsername();
      let title = `<a href="/user/profile/${this.getUid()}">${username}</a> 为分类 <a href="/project/${
        params.project_id
      }/interface/api/cat_${params.catid}">${cate.name}</a> 添加了接口 <a href="/project/${
        params.project_id
      }/interface/api/${result._id}">${data.title}</a> `;

      yapi.commons.saveLog({
        content: title,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: params.project_id
      });
      // this.projectModel.up(params.project_id, { up_time: new Date().getTime() }).then();
    });

    ctx.body = yapi.commons.resReturn(result);
  }

  /**
   * 保存接口数据，如果接口存在则更新数据，如果接口不存在则添加数据
   * @interface /interface/save
   * @method  post
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @param {String}   title 接口标题，不能为空
   * @param {String}   path 接口请求路径，不能为空
   * @param {String}   method 请求方式
   * @param {Array}  [req_headers] 请求的header信息
   * @param {String}  [req_headers[].name] 请求的header信息名
   * @param {String}  [req_headers[].value] 请求的header信息值
   * @param {Boolean}  [req_headers[].required] 是否是必须，默认为否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 请求参数方式，有["form", "json", "text", "xml"]四种
   * @param {Array} [req_params] name, desc两个参数
   * @param {Mixed}  [req_body_form] 请求参数,如果请求方式是form，参数是Array数组，其他格式请求参数是字符串
   * @param {String} [req_body_form[].name] 请求参数名
   * @param {String} [req_body_form[].value] 请求参数值，可填写生成规则（mock）。如@email，随机生成一条email
   * @param {String} [req_body_form[].type] 请求参数类型，有["text", "list","file"]三种
   * @param {String} [req_body_other]  非form类型的请求参数可保存到此字段
   * @param {String}  [res_body_type] 相应信息的数据格式，有["json", "text", "xml"]三种
   * @param {String} [res_body] 响应信息，可填写任意字符串，如果res_body_type是json,则会调用mock功能
   * @param  {String} [desc] 接口描述
   * @returns {Object}
   */

  async save(ctx) {
    let params = ctx.params;

    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 40033, '没有权限'));
      }
    }
    params.method = params.method || 'GET';
    params.method = params.method.toUpperCase();

    let http_path = url.parse(params.path, true);

    if (!yapi.commons.verifyPath(http_path.pathname)) {
      return (ctx.body = yapi.commons.resReturn(
        null,
        400,
        'path第一位必需为 /, 只允许由 字母数字-/_:.! 组成'
      ));
    }

    let result = await this.Model.getByPath(params.project_id, params.path, params.method, '_id res_body');

    if (result.length > 0) {
      result.forEach(async item => {
        params.id = item._id;
        // console.log(this.schemaMap['up'])
        let validParams = Object.assign({}, params)
        let validResult = yapi.commons.validateParams(this.schemaMap['up'], validParams);
        if (validResult.valid) {
          let data = {};
          data.params = validParams;

          if(params.res_body_is_json_schema && params.dataSync === 'good'){
            try{
              let new_res_body = yapi.commons.json_parse(params.res_body)
              let old_res_body = yapi.commons.json_parse(item.res_body)
              data.params.res_body = JSON.stringify(mergeJsonSchema(old_res_body, new_res_body),null,2);
            }catch(err){}
          }
          await this.up(data);
        } else {
          return (ctx.body = yapi.commons.resReturn(null, 400, validResult.message));
        }
      });
    } else {
      let validResult = yapi.commons.validateParams(this.schemaMap['add'], params);
      if (validResult.valid) {
        let data = {};
        data.params = params;
        await this.add(data);
      } else {
        return (ctx.body = yapi.commons.resReturn(null, 400, validResult.message));
      }
    }
    ctx.body = yapi.commons.resReturn(result);
    // return ctx.body = yapi.commons.resReturn(null, 400, 'path第一位必需为 /, 只允许由 字母数字-/_:.! 组成');
  }

  /**
   * 获取接口
   * @interface /interface/get
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 接口id，不能为空
   * @returns {Object}
   * @example ./api/interface/get.json
   */
  async get(ctx) {
    let params = ctx.params;
    if (!params.id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空'));
    }

    try {
      let result = await this.Model.get(params.id);
      if(this.$tokenAuth){
        if(params.project_id !== result.project_id){
          ctx.body = yapi.commons.resReturn(null, 400, 'token有误')
          return;
        }
      }
      // console.log('result', result);
      if (!result) {
        return (ctx.body = yapi.commons.resReturn(null, 490, '不存在的'));
      }
      let userinfo = await this.userModel.findById(result.uid);
      let project = await this.projectModel.getBaseInfo(result.project_id);
      let owners = await Promise.all(result.owners.map(uid => this.userModel.findById(uid)));
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }
      yapi.emitHook('interface_get', result).then();
      result = result.toObject();
      if (userinfo) {
        result.username = userinfo.username;
      }
      if (owners.length) {
        result.owners = owners.map(user => ({
          username: user.username,
          id: user._id,
        }));
      }
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 通过接口path获取接口
   * @interface /interface/getbypath
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {String}   path path，不能为空
   * @returns {Object}
   * @example ./api/interface/getbypat.json
   */
  async getbypath(ctx) {
    let params = ctx.params;
    if (!params.path) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '接口path不能为空'));
    }

    try {
      let result = await this.Model.getbypath(params.path);
      if (!result) {
        return (ctx.body = yapi.commons.resReturn(null, 490, '不存在的'));
      }
      if(this.$tokenAuth){
        if(params.project_id !== result.project_id){
          ctx.body = yapi.commons.resReturn(null, 400, 'token有误')
          return;
        }
      }
      // console.log('result', result);
      let userinfo = await this.userModel.findById(result.uid);
      let project = await this.projectModel.getBaseInfo(result.project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }
      //yapi.emitHook('interface_get', result).then();
      result = result.toObject();
      if (userinfo) {
        result.username = userinfo.username;
      }
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  /**
   * 接口列表
   * @interface /interface/list
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @param {Number}   page 当前页
   * @param {Number}   limit 每一页限制条数
   * @returns {Object}
   * @example ./api/interface/list.json
   */
  async list(ctx) {
    let project_id = ctx.params.project_id;
    let page = ctx.request.query.page || 1,
      status = ctx.request.query.status ? ctx.request.query.status.split(',') : [],
      limit = ctx.request.query.limit || 10;
    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 407, '不存在的项目'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
      }
    }
    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }

    try {
      let result;
      if (limit === 'all') {
        result = await this.Model.list(project_id);
      } else {
        result = await this.Model.listWithPage(project_id, page, limit, status);
      }

      // let count = await this.Model.listCount({ project_id, status:{ $in: status }});
      project_id = parseInt(project_id);
      let aggregate = await this.Model.aggregate({project_id});
      //去除老板计算方式
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
      //   aggregate: aggregate
      // });
      let count = await this.Model.countSerch(project_id, status);
      ctx.body = yapi.commons.resReturn({
        count: count,
        list: result,
        aggregate: aggregate
      });
      yapi.emitHook('interface_list', result).then();
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }
  /**
   * 接口列表简单信息
   * @interface /interface/list/simple
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @returns {Object}
   * @example ./api/interface/list.json
   */
  async listSimple(ctx) {
    let project_id = ctx.params.project_id;
    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 407, '不存在的项目'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
      }
    }
    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }
    
    try {
      let result = await this.Model.listSimple(project_id);
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }
  async downloadCrx(ctx) {
    let filename = 'crossRequest.zip';
    let dataBuffer = yapi.fs.readFileSync(
      yapi.path.join(yapi.WEBROOT, 'static/attachment/cross-request.zip')
    );
    ctx.set('Content-disposition', 'attachment; filename=' + filename);
    ctx.set('Content-Type', 'application/zip');
    ctx.body = dataBuffer;
  }

  async listByCat(ctx) {
    let catids = ctx.request.query.catid ? ctx.request.query.catid.split(',') : [];
    let page = ctx.request.query.page || 1,
      status = ctx.request.query.status ? ctx.request.query.status.split(',') : [],
      limit = ctx.request.query.limit || 10;

    if (catids.length === 0) {
      return (ctx.body = yapi.commons.resReturn(null, 400, 'catid不能为空'));
    }
    try {
      let results = [];

      for (let i = 0; i < catids.length; i++) {
        let catid = catids[i];
        let catdata = await this.catModel.get(catid);
        let project = await this.projectModel.getBaseInfo(catdata.project_id);
        if (project.project_type === 'private') {
          if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
          }
        }

        let res = await this.Model.listByCatidWithPage(catid, page, limit, status);
        results = [...results, ...res];
      }
      catids = catids.map(catid => {
        return parseInt(catid);
      });
      //  catid = parseInt(catid);
      let aggregate = await this.Model.aggregate({catid: {$in: catids}});
      let count = 0;
      aggregate.forEach(item => count += item.count);
      //let count = await this.Model.listCount({ catid,status:{ $in: status } });

      ctx.body = yapi.commons.resReturn({
        count: count,
        total: Math.ceil(count / limit),
        list: results,
        aggregate: aggregate
      });
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message + '1');
    }
  }

  async listByMenu(ctx) {
    let project_id = ctx.params.project_id;
    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }

    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 406, '不存在的项目'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
      }
    }

    try {
      let islist = ctx.params.islist && ctx.params.islist === '1' ? true : false;
      let  newResult=await this.getCat(project_id,islist);
      ctx.body = yapi.commons.resReturn(newResult);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }

  }

  async getCat(project_id,islist,mycatid) {
      let result = await this.catModel.list(project_id),
        newResult = [];

      for (let i = 0, item, list; i < result.length; i++) {
        item = result[i].toObject();
        list = await this.Model.listByCatid(item._id);
        for (let j = 0; j < list.length; j++) {
          list[j] = list[j].toObject();
        }
        item.list = list;
        newResult[i] = item;

      }

    newResult = islist ? newResult : yapi.commons.translateDataToTree(newResult,mycatid);
      return newResult;
  }


  /**
   * 编辑接口
   * @interface /interface/up
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 接口id，不能为空
   * @param {String}   [path] 接口请求路径
   * @param {String}   [method] 请求方式
   * @param {Array}  [req_headers] 请求的header信息
   * @param {String}  [req_headers[].name] 请求的header信息名
   * @param {String}  [req_headers[].value] 请求的header信息值
   * @param {Boolean}  [req_headers[].required] 是否是必须，默认为否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 请求参数方式，有["form", "json", "text", "xml"]四种
   * @param {Mixed}  [req_body_form] 请求参数,如果请求方式是form，参数是Array数组，其他格式请求参数是字符串
   * @param {String} [req_body_form[].name] 请求参数名
   * @param {String} [req_body_form[].value] 请求参数值，可填写生成规则（mock）。如@email，随机生成一条email
   * @param {String} [req_body_form[].type] 请求参数类型，有["text", "file"]两种
   * @param {String} [req_body_other]  非form类型的请求参数可保存到此字段
   * @param {String}  [res_body_type] 相应信息的数据格式，有["json", "text", "xml"]三种
   * @param {String} [res_body] 响应信息，可填写任意字符串，如果res_body_type是json,则会调用mock功能
   * @param  {String} [desc] 接口描述
   * @returns {Object}
   * @example ./api/interface/up.json
   */

  async up(ctx) {
    let params = ctx.params;
    // console.log('params: ', params);

    if (!_.isUndefined(params.method)) {
      params.method = params.method || 'GET';
      params.method = params.method.toUpperCase();
    }

    let id = params.id;
    params.message = params.message || '';
    params.message = params.message.replace(/\n/g, '<br>');
    // params.res_body_is_json_schema = _.isUndefined (params.res_body_is_json_schema) ? true : params.res_body_is_json_schema;
    // params.req_body_is_json_schema = _.isUndefined(params.req_body_is_json_schema) ?  true : params.req_body_is_json_schema;

    handleHeaders(params)

    let interfaceData = await this.Model.get(id);
    if (!interfaceData) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '不存在的接口'));
    }
    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(interfaceData.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
    }

    let data = Object.assign(
      {
        up_time: yapi.commons.time()
      },
      params
    );

    if (params.path) {
      let http_path;
      http_path = url.parse(params.path, true);

      if (!yapi.commons.verifyPath(http_path.pathname)) {
        return (ctx.body = yapi.commons.resReturn(
          null,
          400,
          'path第一位必需为 /, 只允许由 字母数字-/_:.! 组成'
        ));
      }
      params.query_path = {};
      params.query_path.path = http_path.pathname;
      params.query_path.params = [];
      Object.keys(http_path.query).forEach(item => {
        params.query_path.params.push({
          name: item,
          value: http_path.query[item]
        });
      });
      data.query_path = params.query_path;
    }

    if (
      params.path &&
      (params.path !== interfaceData.path || params.method !== interfaceData.method)
    ) {
      let checkRepeat = await this.Model.checkRepeat(
        interfaceData.project_id,
        params.path,
        params.method
      );
      if (checkRepeat > 0) {
        return (ctx.body = yapi.commons.resReturn(
          null,
          401,
          '已存在的接口:' + params.path + '[' + params.method + ']'
        ));
      }
    }

    if (!_.isUndefined(data.req_params)) {
      if (Array.isArray(data.req_params) && data.req_params.length > 0) {
        data.type = 'var';
      } else {
        data.type = 'static';
        data.req_params = [];
      }
    }
    // console.log('=======', data);
    let result = await this.Model.up(id, data);
    let username = this.getUsername();
    let CurrentInterfaceData = await this.Model.get(id);
    let logData = {
      interface_id: id,
      cat_id: data.catid,
      current: CurrentInterfaceData.toObject(),
      old: interfaceData.toObject()
    };

    this.catModel.get(interfaceData.catid).then(cate => {
      let diffView2 = showDiffMsg(jsondiffpatch, formattersHtml, logData);
      if (diffView2.length <= 0) {
          return; // 没有变化时，不写日志
      }
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 
                    更新了分类 <a href="/project/${cate.project_id}/interface/api/cat_${
          data.catid
        }">${cate.name}</a> 
                    下的接口 <a href="/project/${cate.project_id}/interface/api/${id}">${
          interfaceData.title
        }</a>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: cate.project_id,
        data: logData
      });
    });

    // this.projectModel.up(interfaceData.project_id, { up_time: new Date().getTime() }).then();
    if (params.switch_notice === true) {
      let diffView = showDiffMsg(jsondiffpatch, formattersHtml, logData);
      let annotatedCss = fs.readFileSync(
        path.resolve(
          yapi.WEBROOT,
          'node_modules/jsondiffpatch/dist/formatters-styles/annotated.css'
        ),
        'utf8'
      );
      let htmlCss = fs.readFileSync(
        path.resolve(yapi.WEBROOT, 'node_modules/jsondiffpatch/dist/formatters-styles/html.css'),
        'utf8'
      );

      let project = await this.projectModel.getBaseInfo(interfaceData.project_id);

      let interfaceUrl = `${ctx.request.origin}/project/${
        interfaceData.project_id
      }/interface/api/${id}`;

      yapi.commons.sendNotice(interfaceData.project_id, {
        title: `${username} 更新了接口`,
        content: `<html>
        <head>
        <style>
        ${annotatedCss}
        ${htmlCss}
        </style>
        </head>
        <body>
        <div><h3>${username}更新了接口(${data.title})</h3>
        <p>项目名：${project.name} </p>
        <p>修改用户: ${username}</p>
        <p>接口名: <a href="${interfaceUrl}">${data.title}</a></p>
        <p>接口路径: [${data.method}]${data.path}</p>
        <p>详细改动日志: ${this.diffHTML(diffView)}</p></div>
        </body>
        </html>`
      });
    }

    yapi.emitHook('interface_update', id).then();
    ctx.body = yapi.commons.resReturn(result);
    return 1;
  }

  diffHTML(html) {
    if (html.length === 0) {
      return `<span style="color: #555">没有改动，该操作未改动Api数据</span>`;
    }

    return html.map(item => {
      return `<div>
      <h4 class="title">${item.title}</h4>
      <div>${item.content}</div>
    </div>`;
    });
  }

  /**
   * 删除接口
   * @interface /interface/del
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 接口id，不能为空
   * @returns {Object}
   * @example ./api/interface/del.json
   */

  async del(ctx) {
    try {
      let id = ctx.request.body.id;

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '接口id不能为空'));
      }

      let data = await this.Model.get(id);

      if (data.uid != this.getUid()) {
        let auth = await this.checkAuth(data.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }

      // let inter = await this.Model.get(id);
      let result = await this.Model.del(id);
      yapi.emitHook('interface_del', id).then();
      await this.caseModel.delByInterfaceId(id);
      let username = this.getUsername();
      this.catModel.get(data.catid).then(cate => {
        yapi.commons.saveLog({
          content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了分类 <a href="/project/${
            cate.project_id
          }/interface/api/cat_${data.catid}">${cate.name}</a> 下的接口 "${data.title}"`,
          type: 'project',
          uid: this.getUid(),
          username: username,
          typeid: cate.project_id
        });
      });
      // this.projectModel.up(data.project_id, { up_time: new Date().getTime() }).then();
      ctx.body = yapi.commons.resReturn(result);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }
  // 处理编辑冲突
  async solveConflict(ctx) {
    try {
      let id = parseInt(ctx.query.id, 10),
        result,
        userInst,
        userinfo,
        data;
      if (!id) {
        return ctx.websocket.send('id 参数有误');
      }
      result = await this.Model.get(id);

      if (result.edit_uid !== 0 && result.edit_uid !== this.getUid()) {
        userInst = yapi.getInst(userModel);
        userinfo = await userInst.findById(result.edit_uid);
        data = {
          errno: result.edit_uid,
          data: { uid: result.edit_uid, username: userinfo.username }
        };
      } else {
        this.Model.upEditUid(id, this.getUid()).then();
        data = {
          errno: 0,
          data: result
        };
      }

      //向客户端发送信息，当前的状态
      ctx.websocket.send(JSON.stringify(data));

      // 监听客户端发送过来的信息 测试用
      ctx.websocket.on('message', function(message) {
        console.log('message',message);
        setInterval(
          () => ctx.websocket.send('服务端'+message),
          5000
        );
        
      });

      //监听客户端关闭连接，重置状态为0
      ctx.websocket.on('close', () => {
        this.Model.upEditUid(id, 0).then();
      });
    } catch (err) {
      yapi.commons.log(err, 'error');
    }
  }

  async addCat(ctx) {
    try {
      let params = ctx.request.body;
      params = yapi.commons.handleParams(params, {
        name: 'string',
        project_id: 'number',
        desc: 'string'
      });

      if (!params.project_id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
      }
      if (!this.$tokenAuth) {
        let auth = await this.checkAuth(params.project_id, 'project', 'edit');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }

      if (!params.name) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '名称不能为空'));
      }

      let result = await this.catModel.save({
        name: params.name,
        project_id: params.project_id,
        desc: params.desc,
        uid: this.getUid(),
        parent_id: params.parent_id||-1,
        add_time: yapi.commons.time(),
        up_time: yapi.commons.time()
      });

      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 添加了分类  <a href="/project/${
          params.project_id
        }/interface/api/cat_${result._id}">${params.name}</a>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: params.project_id
      });

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
  }

  async upCat(ctx) {
    try {
      let params = ctx.request.body;

      let username = this.getUsername();
      let cate = await this.catModel.get(params.catid);

      let auth = await this.checkAuth(cate.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
      }
      let updata = {
        up_time: yapi.commons.time()
      };
      if (params.parent_id) {
        updata.parent_id = params.parent_id;
      }
      if (params.name) {
        updata.name = params.name;
        updata.desc = params.desc;
      }

      let result = await this.catModel.up(params.catid, updata);

      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 更新了分类 <a href="/project/${
          cate.project_id
        }/interface/api/cat_${params.catid}">${cate.name}</a>`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: cate.project_id
      });

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }



  async delCat(ctx) {
    try {
      let id = ctx.request.body.catid;
      let catData = await this.catModel.get(id);
      if (!catData) {
        ctx.body = yapi.commons.resReturn(null, 400, '不存在的分类');
      }

      if (catData.uid !== this.getUid()) {
        let auth = await this.checkAuth(catData.project_id, 'project', 'danger');
        if (!auth) {
          return (ctx.body = yapi.commons.resReturn(null, 400, '没有权限'));
        }
      }

      let username = this.getUsername();
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${this.getUid()}">${username}</a> 删除了分类 "${
          catData.name
        }" 及该分类及子分类及其接口`,
        type: 'project',
        uid: this.getUid(),
        username: username,
        typeid: catData.project_id
      });
      let cattreenode=await this.getCat(catData.project_id,false,id);

      let delcattree= async catdata => {
        let interfaceData = catdata.list;
        if(catdata.children&&catdata.children.length>0){
          catdata.children.forEach(subcat=>{
            delcattree(subcat)
          })
        }
        interfaceData.forEach(async item => {
          try {
            yapi.emitHook('interface_del', item._id).then();
            await this.caseModel.delByInterfaceId(item._id);
          } catch (e) {
            yapi.commons.log(e.message, 'error');
          }
        });
        await this.catModel.del(catdata._id);
        let r = await this.Model.delByCatid(catdata._id);
        return r
      }
     let r=delcattree(cattreenode);
      return (ctx.body = yapi.commons.resReturn(r));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

    /**
   * 获取关联接口的用例列表
   * @interface /interface/getCaseListId
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   id 接口id
   * @returns {Object}
   * @example ./api/interface/getCatMenu
   */

    async getCaseListId(ctx) {
      let id = ctx.params.id;
      try {
        //通过interfaceid查出关联的用例
        let ids = [];
        let caseList = await this.caseModel.getsynccaseid(id);
        caseList.forEach(item=>{
          ids.push(item._id)
        })
        return (ctx.body = yapi.commons.resReturn(ids));
      } catch (e) {
        yapi.commons.resReturn(null, 400, e.message);
      }
    }

    /**
   * 获取分类列表
   * @interface /interface/getQrcode
   * @method POST
   * @category interface
   * @foldnumber 10
   * @param {Number}   url 项目id，不能为空
   * @returns {Object}
   * @example ./api/interface/getCatMenu
   */

    async getQrcode(ctx) {
      let url = ctx.params.url;
      try {
        let res = await QRCode.toDataURL(url)
        return (ctx.body = yapi.commons.resReturn(res));
      } catch (e) {
        yapi.commons.resReturn(null, 400, e.message);
      }
    }
  
  /**
   * 获取分类列表
   * @interface /interface/getCatMenu
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @returns {Object}
   * @example ./api/interface/getCatMenu
   */

  async getCatMenu(ctx) {
    let project_id = ctx.params.project_id;

    if (!project_id || isNaN(project_id)) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }

    try {
      let project = await this.projectModel.getBaseInfo(project_id);
      if (project.project_type === 'private') {
        if ((await this.checkAuth(project._id, 'project', 'edit')) !== true) {
          return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
      }
      let res = await this.catModel.list(project_id);
      return (ctx.body = yapi.commons.resReturn(res));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

  /**
   * 获取自定义接口字段数据
   * @interface /interface/get_custom_field
   * @method GET
   * @category interface
   * @foldnumber 10
   * @param {String}   app_code = '111'
   * @returns {Object}
   *
   */
  async getCustomField(ctx) {
    let params = ctx.request.query;

    if (Object.keys(params).length !== 1) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '参数数量错误'));
    }
    let customFieldName = Object.keys(params)[0];
    let customFieldValue = params[customFieldName];

    try {
      //  查找有customFieldName的分组（group）
      let groups = await this.groupModel.getcustomFieldName(customFieldName);
      if (groups.length === 0) {
        return (ctx.body = yapi.commons.resReturn(null, 404, '没有找到对应自定义接口'));
      }

      // 在每个分组（group）下查找对应project的id值
      let interfaces = [];
      for (let i = 0; i < groups.length; i++) {
        let projects = await this.projectModel.list(groups[i]._id);

        // 在每个项目（project）中查找interface下的custom_field_value
        for (let j = 0; j < projects.length; j++) {
          let data = {};
          let inter = await this.Model.getcustomFieldValue(projects[j]._id, customFieldValue);
          if (inter.length > 0) {
            data.project_name = projects[j].name;
            data.project_id = projects[j]._id;
            inter = inter.map((item, i) => {
              item = inter[i] = inter[i].toObject();
              item.res_body = yapi.commons.json_parse(item.res_body);
              item.req_body_other = yapi.commons.json_parse(item.req_body_other);

              return item;
            });

            data.list = inter;
            interfaces.push(data);
          }
        }
      }
      return (ctx.body = yapi.commons.resReturn(interfaces));
    } catch (e) {
      yapi.commons.resReturn(null, 400, e.message);
    }
  }

  requiredSort(params) {
    return params.sort((item1, item2) => {
      return item2.required - item1.required;
    });
  }

  /**
   * 移动接口到新的项目分类
   * @interface /interface/move
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
    if (typeof params.pid === 'undefined' || params.pid === null || typeof params.cid === 'undefined' || params.cid === null) {
      return (ctx.body = yapi.commons.resReturn(null, 404, '未选择移动的分类'));
    }

    try {
      this.Model.move(params.moveId, params.pid, params.cid).then(
        //res => {},
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
   * 更新多个接口case index
   * @interface /interface/up_index
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async upIndex(ctx) {
    try {
      let params = ctx.request.body;
      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '请求参数必须是数组');
      }
      params.forEach(item => {
        if (item.id) {
          this.Model.upIndex(item.id, item.index).then(
            //res => {},
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
   * 更新多个接口cat index
   * @interface /interface/up_cat_index
   * @method POST
   * @category col
   * @foldnumber 10
   * @param {Array}  [id, index]
   * @returns {Object}
   * @example
   */

  async upCatIndex(ctx) {
    try {
      let params = ctx.request.body;
      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '请求参数必须是数组');
      }
      params.forEach(item => {
        if (item.id) {
          this.catModel.upCatIndex(item.id, item.index).then(
            //res => {},
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
   * golang项目导入接口
   * @interface /interface/importGolangApi
   * @method  post
   * @category interface
   * @foldnumber 10
   * @param {Number}   project_id 项目id，不能为空
   * @param {String}   title 接口标题，不能为空
   * @param {String}   path 接口请求路径，不能为空
   * @param {String}   method 请求方式
   * @param {Array}  [req_headers] 请求的header信息
   * @param {String}  [req_headers[].name] 请求的header信息名
   * @param {String}  [req_headers[].value] 请求的header信息值
   * @param {Boolean}  [req_headers[].required] 是否是必须，默认为否
   * @param {String}  [req_headers[].desc] header描述
   * @param {String}  [req_body_type] 请求参数方式，有["form", "json", "text", "xml"]四种
   * @param {Array} [req_params] name, desc两个参数
   * @param {Mixed}  [req_body_form] 请求参数,如果请求方式是form，参数是Array数组，其他格式请求参数是字符串
   * @param {String} [req_body_form[].name] 请求参数名
   * @param {String} [req_body_form[].value] 请求参数值，可填写生成规则（mock）。如@email，随机生成一条email
   * @param {String} [req_body_form[].type] 请求参数类型，有["text", "list","file"]三种
   * @param {String} [req_body_other]  非form类型的请求参数可保存到此字段
   * @param {String}  [res_body_type] 相应信息的数据格式，有["json", "text", "xml"]三种
   * @param {String} [res_body] 响应信息，可填写任意字符串，如果res_body_type是json,则会调用mock功能
   * @param  {String} [desc] 接口描述
   * @returns {Object}
   */

async importGolangApi(ctx) {

  let params = ctx.request.body;
  if (!this.$tokenAuth) {
    let auth = await this.checkAuth(params.project_id, 'project', 'edit');
    if (!auth) {
      return (ctx.body = yapi.commons.resReturn(null, 40033, '没有权限'));
    }
  }
  let Apidoc;
  //读取文件
  Apidoc = await fs.readFile(path.join(__dirname, '../../GolangApi', 'Api.proto'),'utf8');

  //原文件查找引用的file文件名
  const mapreg = /import\s+"([^"]+)";/g;
  let filelist = [];
  let match;
  while ((match = mapreg.exec(Apidoc)) !== null) {
    let importedFile = match[1];
    const regex = /\/([^\/.]+)\.[^.]+$/;
    let impfile = importedFile.match(regex);
    impfile = impfile ? impfile[1] : null;
    filelist.push(impfile);
  }
  console.log('filelist',filelist);
  let apilist = params.apijson;
  let project_id = params.project_id;
  let catid = params.catid;
  let uid = this.getUid();

  let resultoj = {};
  resultoj.success = 0;
  resultoj.fail = 0;
  resultoj.executing = 0;
  resultoj.skip = 0;
  resultoj.faildetail = [];

  for(let i=0;i<apilist.length;i++){
    let path = apilist[i].path;
    try{
      let api = {};
      api.project_id = project_id;
      api.catid = catid;
      api.uid = uid;
      api.method=apilist[i].method;
      api.path=apilist[i].path;
      api.title=apilist[i].handler;
      api.req_body_is_json_schema=true;
      api.res_body_is_json_schema=true;
      api.up_time=yapi.commons.time();
      api.res_body_type="json";
      api.req_body_type="json";
      api.req_headers = [
        {
            "name":"Content-Type",
            "required":"1",
            "value":"application/json"
        },
        {
          "name":"X-Token",
          "required":"1",
          "value":"2bIFEdKu8qUsPwPhobFIKQfyTPu"
        }//暂时写死，公司规则
      ];

      let http_path = url.parse(apilist[i].path, true);
      if (!yapi.commons.verifyPath(http_path.pathname)) {
        continue;
      }

      //判断是否有map,取出mapkey
      let mapr=[];
      const mapreg = /map<(.+)>\s(.*?)\s/g;///>\s(.+)\s\=/g;
      let mapch;
      while ((mapch = mapreg.exec(Apidoc)) !== null) {
        mapr.push(mapch[2]);
      }
      //判断是否需要修改下划线为驼峰
      mapr.forEach((item,index)=>{
        if(item.indexOf('_')>=0){
          mapr[index] = commons.convertToCamelCase(item);
        }
      })
      let messagename;
      //处理请求
      if(apilist[i].req !== 'Empty'){
        messagename = apilist[i].req;
        //在文件中找到message对应的对象
        const regex = new RegExp(`message ${messagename} \\{([^}]+)\\}`);
        const regex1 = new RegExp(`message ${messagename}\\{([^}]+)\\}`);
        let matches = Apidoc.match(regex);
        if(!matches){
          matches = Apidoc.match(regex1);
        }
        //若文档中有该messageAPI
        if (matches) {
          let content = matches[1].trim();
          //处理请求参数
          let req = mocker({
            cmd:apilist[i].req,
            entry:path=>path.resolve(__dirname,'../../GolangApi/Api.proto'),
            times:1
          })

          req = JSON.stringify(req);
          let reqData = JSON.parse(req);

          //遍历所有key,并处理驼峰和map
          let keys = [];
          function traverseKeys(obj) {
            for (let key in obj) {
              //处理驼峰
              // 使用正则表达式匹配驼峰命名规则
              let re = /^[a-z][a-zA-Z0-9]*$/;
              // 判断字符串是否符合驼峰命名规则
              if(re.test(key)){
                let vu = obj[key];
                //转换驼峰
                let newkey = commons.convertToSnakeCase(key);
                //若有对象map，取出map对象重组
                if(mapr&&mapr.length>0){
                  mapr.forEach(item=>{
                    //取出map对象重组
                    if(item&&item==key){
                      let failobj = obj[key];
                      for (let failkey in failobj){
                        let surobj = failobj[failkey];
                        obj[key] = surobj;
                      }
                    }
                  })
                }
                delete obj[key];
                obj[newkey] = vu;
                keys.push(newkey);
              }else{
                //取出map对象重组
                if(mapr&&mapr.length>0){
                  mapr.forEach(item=>{
                    //取出map对象重组
                    if(item&&item==key){
                      let failobj = obj[key];
                      for (let failkey in failobj){
                        let surobj = failobj[failkey];
                        obj[key] = surobj;
                      }
                    }
                  })
                }
                keys.push(key);
              }
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                traverseKeys(obj[key]); // 递归遍历子对象的 key
              }
            }
          }
          traverseKeys(reqData);
          //生成schema
          reqData = GenerateSchema(reqData);
          //取出所有注释
          for(let j=0;j<keys.length;j++){
            // 使用正则表达式匹配
            let regex;
            try{
              regex= new RegExp(`${keys[j]}\\s+=\\s+\\d+;\\s+\\/\\/\\s*(.+)`);
            }catch(err){
              console.log('path',api.path);
              console.log('keysname',keys[j]);
            }
            
            let match = content.match(regex);
            if(!match){
              //转换驼峰为下划线
              const snakeCaseParam = commons.convertToSnakeCase(keys[j]);
              regex = new RegExp(`${snakeCaseParam}\\s+=\\s+\\d+;\\s+\\/\\/\\s*(.+)`);
              match = content.match(regex);
            }
            if (match && match.length > 1) {
              let comment = match[1].trim();
              let paramname = keys[j];
              //重组schema对象加入注释
              commons.findValueByKey(reqData,paramname,comment);
            }
          }

          api.req_body_other = JSON.stringify(reqData);
        }
        
      }
      
      //处理接口命名，正则匹配
      let Apiname;
      if(apilist[i].resp !== 'Empty'){
        Apiname = apilist[i].resp;
        const reg = new RegExp(` returns \\(${Apiname}\\)\\;\\s+\\/\\/\\s*(.+)`);
        const matche = Apidoc.match(reg);
        if(matche){
          Apiname = matche[1].trim();
        }
      }else{
        Apiname = apilist[i].req;
        const reg = new RegExp(`\\(${Apiname}\\) returns \\(Empty\\)\\;\\s+\\/\\/\\s*(.+)`);
        const matche = Apidoc.match(reg);
        if(matche){
          Apiname = matche[1].trim();
        }
      }
      if(Apiname){
        api.title = Apiname;
      }
      
      // 处理响应
      if(apilist[i].resp !== 'Empty'){
        messagename = apilist[i].resp;
        const regex = new RegExp(`message ${messagename} \\{([^}]+)\\}`);
        const regex1 = new RegExp(`message ${messagename}\\{([^}]+)\\}`);
        let matches = Apidoc.match(regex);
        if(!matches){
          matches = Apidoc.match(regex1);
        }
        if(!matches){
        //处理引用类型的参数
          for(let z=0;z<filelist.length;z++){
            messagename = filelist[z]+apilist[i].resp;
            const regex3 = new RegExp(`message ${messagename} \\{([^}]+)\\}`);
            const regex4 = new RegExp(`message ${messagename}\\{([^}]+)\\}`);
            matches = Apidoc.match(regex3);
            if(matches){
              break;
            }else{
              matches = Apidoc.match(regex4);
            }
          }
        }
        if (matches) {
          const content = matches[1].trim();
          //处理响应参数
          let resp = mocker({
            cmd:messagename,
            entry:path=>path.resolve(__dirname,'../../GolangApi/Api.proto'),
            times:1
          })
          resp = JSON.stringify(resp);;
          let respData = JSON.parse(resp);
          //遍历所有key,并处理map
          let keys = [];
          function traverseKeys(obj) {
            for (let key in obj) {
              if(mapr&&mapr.length>0){
                mapr.forEach(item=>{
                  //取出map对象重组
                  if(item&&item==key){
                    let failobj = obj[key];
                    for (let failkey in failobj){
                      let surobj = failobj[failkey];
                      obj[key] = surobj;
                    }
                  }
                })
              }
              //返回数据不用处理驼峰
                keys.push(key);
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                traverseKeys(obj[key]); // 递归遍历子对象的 key
              }
            }
          }
          traverseKeys(respData);
          //公司项目响应规则
          let responseData = {};
          responseData.message='success';
          responseData.code = 0;
          responseData.data = respData;
          responseData = GenerateSchema(responseData);
          //取出所有注释
          for(let j=0;j<keys.length;j++){
            // 使用正则表达式匹配
            let regex;
            try{
              regex = new RegExp(`${keys[j]}\\s+=\\s+\\d+;\\s+\\/\\/\\s*(.+)`);
            }catch(err){
              console.log('path',api.path);
              console.log('keysname',keys[j]);
            }

            let match = content.match(regex);
            if(!match){
              //转换驼峰
              const snakeCaseParam = commons.convertToSnakeCase(keys[j]);
              regex = new RegExp(`${snakeCaseParam}\\s+=\\s+\\d+;\\s+\\/\\/\\s*(.+)`);
              match = content.match(regex);
            }
            if (match && match.length > 1) {
              let comment = match[1].trim();
              let paramname = keys[j];
              //重组schema对象加入注释
              commons.findValueByKey(responseData,paramname,comment);
            }
          }
          
          api.res_body = JSON.stringify(responseData);
        }
        
      }else{
        //公司项目响应规则
        let Data = {};
        Data.message='success';
        Data.code = 0;
        Data.data = {};
        Data = GenerateSchema(Data);
        api.res_body = JSON.stringify(Data);
      }
      //判断新增还是更新
      let datalist = await this.Model.getbypathid(project_id, catid, path);

      if(datalist&&datalist.length>0){
        let id = datalist[0]._id;
        delete api.title;
        await this.Model.up(id,api);
      }else{
        await this.Model.save(api);
      }
      resultoj.success = resultoj.success + 1;
    }catch(err){
      resultoj.fail = resultoj.fail + 1;
      resultoj.faildetail.push(err.toString());
      continue;
    }
  }

  ctx.body = yapi.commons.resReturn(resultoj,0,'complete');
}
/**
   * golang项目导入接口
   * @interface /interface/importGolangApifile
   * @method  post
   * @category interface
   * @foldnumber 10
   * @param {String}   filebase 文件base64
   * @returns {Object}
   */
  async importGolangApifile(ctx){
    let params = ctx.request.body;
    if (!this.$tokenAuth) {
      let auth = await this.checkAuth(params.project_id, 'project', 'edit');
      if (!auth) {
        return (ctx.body = yapi.commons.resReturn(null, 40033, '没有权限'));
      }
    }
    //处理上传的文件
    let file = params.filebase;
    let buffer = Buffer.from(file.split(',')[1], 'base64');
    if(!params.next){
      await fs.promises.writeFile(path.join(__dirname, '../../GolangApi', 'Api.proto'), buffer, function (err) {
        if (err) 
          return (ctx.body = yapi.commons.resReturn(null, 400, err));
      })
      //判断是否需要继续导入文件
      let Continue =  await this.CheckDoc();
      if(Continue&&Continue.length>0){
        return (ctx.body = yapi.commons.resReturn(Continue, 0, 'Continue'));
      }
      return (ctx.body = yapi.commons.resReturn(null, 0, 'complete'))
    }else{
      let filename = params.name;
      await fs.promises.writeFile(path.join(__dirname, '../../GolangApi', filename), buffer, function (err) {
        if (err) 
          return (ctx.body = yapi.commons.resReturn(null, 400, err));
      })
      //将新文件内容加入之前的文件中
      await this.ReplaceApi(filename);
      return (ctx.body = yapi.commons.resReturn(null, 0, 'Continue'))
    }
    ;
  }

  async CheckDoc(){
    let Apidoc;
    //读取文件
    Apidoc = await fs.readFile(path.join(__dirname, '../../GolangApi', 'Api.proto'),'utf8');
    const mapreg = /(?<!\/{2}\s)(?<!\/{2})import\s+"([^"]+)";/g;
    let match;
    let filelist = [];
    // match = mapreg.exec(Apidoc)[1];
    while ((match = mapreg.exec(Apidoc)) !== null) {
      const importedFile = match[1];
      filelist.push(importedFile)
    }
    return filelist;
  }

  //替换文件特定内容
  async ReplaceApi(filename){
    //若出现其他WS修改为String
    let Apidoc;
    //原文件
    Apidoc =  await fs.readFile(path.join(__dirname, '../../GolangApi', 'Api.proto'),'utf8');
    //加入文件
    let Apidocnext = await fs.readFile(path.join(__dirname, '../../GolangApi', filename),'utf8');
    
    //原文件查找需要替换的improt的字段
    const mapreg = /import\s+"([^"]+)";/g;
    let filelist = [];
    let match;
    let messagelist = [];
    while ((match = mapreg.exec(Apidoc)) !== null) {
      let importedFile = match[1];
      const regex = /\/([^\/.]+)\.[^.]+$/;
      let impfile = importedFile.match(regex);
      impfile = impfile ? impfile[1] : null;
      filelist.push(impfile);
    }

    // 原文件中找到需要替换的message
    filelist.forEach(item => {
      //在新增的文件中找到item.后面匹配的message，并加入到该文件中
      //在旧文件中找到该引入的message名
      var text = new RegExp(`${item}\\.(\\w+)\\s`,"g");
      while ((match = text.exec(Apidoc)) !== null) {
        messagelist.push(match[1]);
      }
      var text1 = new RegExp(`${item}\\.(\\w+)\\)`,"g");
      while ((match = text1.exec(Apidoc)) !== null) {
        messagelist.push(match[1]);
      }
      messagelist = [...new Set(messagelist)];
    });
    console.log(messagelist);

    // 读取原文件内容
    fs.readFile(path.join(__dirname, '../../GolangApi', 'Api.proto'), 'utf8', async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      let replacedData;
      filename = filename.split('.')[0]; 
      let typec = messagelist;
      data = this.Replaceobj(messagelist,Apidocnext,filename,data,typec);

      // 替换字段ws.
      var ws = filename+'\\.';
      var text = new RegExp(ws, "g");
      replacedData = data.replace(text, filename);

      // 替换文件名，还原import文件名
      var ws1 = filename+'proto';
      var text1 = new RegExp(ws1, "g");
      replacedData = replacedData.replace(text1, filename+'.proto');

      // 将替换后的内容写入新文件
      await fs.writeFile(path.join(__dirname, '../../GolangApi', 'Api.proto'), replacedData, 'utf8', (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log('替换完成！');
      });
    });

  }

  //查找字符并替换
  Replaceobj(messagelist,doc,filename,data,typec){
    let messageobj;
    messagelist.forEach(item =>{
      //在新增文件中找到message对象
      const regex1 = new RegExp(`message ${item} \\{([^}]+)\\}`);
      const regex2 = new RegExp(`message ${item}\\{([^}]+)\\}`);
      let matches = doc.match(regex1);
      if(!matches){
        matches = doc.match(regex2);
      }
      if (matches) {
        messageobj = matches[1].trim();
        //遍历message，替换字段
        messagelist.forEach(items =>{
          var replaceitem = new RegExp(`(?<!\\w)${items}\\s`, "g");
          var replaceitem1 = new RegExp(`\\s${items}\\s`, "g");
          var replaceitem2 = new RegExp(`\\n${items}\\s`, "g");
          messageobj = messageobj.replace(replaceitem,filename+items+' ').replace(replaceitem1,filename+items+' ').replace(replaceitem2,filename+items+' ');
          //取出obj中所有的字段
          let r = new RegExp(`\\s(\\w.*?)\\s`,"g");
          let m;
          let typel=[];
          while ((m = r.exec(messageobj)) !== null) {
            typel.push(m[1]);
          }
          //判断是否有map,取出mapkey
          const mapreg = /map<(.+)>\s(.*?)\s/g;
          let mapch;
          while ((mapch = mapreg.exec(messageobj)) !== null) {
            typel.push(mapch[2]);
          }
          typel = [...new Set(typel)];
          //需要判断字段是否属于message
          typel.forEach(item =>{
            //在新增文件中找到message对象
            const r1 = new RegExp(`message ${item} \\{([^}]+)\\}`);
            const r2 = new RegExp(`message ${item}\\{([^}]+)\\}`);
            const r3 = new RegExp(`message ${filename}+${item} \\{([^}]+)\\}`);
            const r4 = new RegExp(`message ${filename}+${item}\\{([^}]+)\\}`);
            let m = doc.match(r1);
            if(!m){
              m = doc.match(r2);
            }
            if(!m){
              m = doc.match(r3);
            }
            if(!m){
              m = doc.match(r4);
            }
            if (m) {
              messageobj = messageobj.replace(item,filename+item)
              if (!typec.includes(item)) {
                typec.push(item);
                let list = [item];
                data = this.Replaceobj(list,doc,filename,data,typec);
              }
            }
          })
          
        })
        let messagename = filename+item;
        //重组对象
        messageobj = '\n message '+messagename+ ' {\n '+messageobj+'\n}';
        data = data + messageobj ;
      }
    })
    return data;
  }

  async schema2json(ctx) {
    let schema = ctx.request.body.schema;
    let required = ctx.request.body.required;

    let res = yapi.commons.schemaToJson(schema, {
      alwaysFakeOptionals: _.isUndefined(required) ? true : required
    });
    // console.log('res',res)
    return (ctx.body = res);
  }

  // 获取开放接口数据
  async listByOpen(ctx) {
    let project_id = ctx.request.query.project_id;

    if (!project_id) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '项目id不能为空'));
    }

    let project = await this.projectModel.getBaseInfo(project_id);
    if (!project) {
      return (ctx.body = yapi.commons.resReturn(null, 406, '不存在的项目'));
    }
    if (project.project_type === 'private') {
      if ((await this.checkAuth(project._id, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
      }
    }

    let basepath = project.basepath;
    try {
      let result = await this.catModel.list(project_id),
        newResult = [];

      for (let i = 0, item, list; i < result.length; i++) {
        item = result[i].toObject();
        list = await this.Model.listByInterStatus(item._id, 'open');
        for (let j = 0; j < list.length; j++) {
          list[j] = list[j].toObject();
          list[j].basepath = basepath;
        }

        newResult = [].concat(newResult, list);
      }

      ctx.body = yapi.commons.resReturn(newResult);
    } catch (err) {
      ctx.body = yapi.commons.resReturn(null, 402, err.message);
    }
  }


}

module.exports = interfaceController;
