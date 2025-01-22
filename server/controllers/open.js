const projectModel = require('../models/project.js');
const interfaceColModel = require('../models/interfaceCol.js');
const interfaceCaseModel = require('../models/interfaceCase.js');
const interfaceModel = require('../models/interface.js');
const interfaceCatModel = require('../models/interfaceCat.js');
const followModel = require('../models/follow.js');
const userModel = require('../models/user.js');
const yapi = require('../yapi.js');
const baseController = require('./base.js');
const caselib = require('../models/caselib.js');
const coltestReport = require('../models/coltestReport.js');
const {
  handleParams,
  crossRequest,
  handleCurrDomain,
  checkNameIsExistInArray,
  setGlobalScript,
  setsocket,
  getsocket
} = require('../../common/postmanLib');
var nodews = require('ws');
const { handleParamsValue, ArrayToObject } = require('../../common/utils.js');
const renderToHtml = require('../utils/reportHtml');
const HanldeImportData = require('../../common/HandleImportData');
const _ = require('underscore');
const createContext = require('../../common/createContext')

/**
 * {
 *    postman: require('./m')
 * }
 */
const importDataModule = {};
yapi.emitHook('import_data', importDataModule);


class openController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.projectModel = yapi.getInst(projectModel);
    this.interfaceColModel = yapi.getInst(interfaceColModel);
    this.interfaceCaseModel = yapi.getInst(interfaceCaseModel);
    this.interfaceModel = yapi.getInst(interfaceModel);
    this.interfaceCatModel = yapi.getInst(interfaceCatModel);
    this.followModel = yapi.getInst(followModel);
    this.userModel = yapi.getInst(userModel);
    this.caselibModel = yapi.getInst(caselib);
    this.colReportModel = yapi.getInst(coltestReport);
    this.handleValue = this.handleValue.bind(this);
    this.schemaMap = {
      runAutoTest: {
        '*id': 'number',
        project_id: 'string',
        token: 'string',
        mode: {
          type: 'string',
          default: 'html'
        },
        email: {
          type: 'boolean',
          default: false
        },
        download: {
          type: 'boolean',
          default: false
        },
        subset: {
          type: 'boolean',
          default: false
        },
        descendants: {
          type: 'boolean',
          default: false
        },
        failedinterrupt: {
          type: 'boolean',
          default: false
        },
        serverlog: {
          type: 'boolean',
          default: false
        },
        logurl: {
          type: 'string',
          default: ''
        },
        jobname: {
          type: 'string',
          default: ''
        },
        closeRemoveAdditional: true
      },
      importData: {
        '*type': 'string',
        url: 'string',
        '*token': 'string',
        json: 'string',
        project_id: 'string',
        merge: {
          type: 'string',
          default: 'normal'
        }
      }
    };
  }
//导入接口文档
  async importData(ctx) {
    let type = ctx.params.type;
    let content = ctx.params.json;
    let project_id = ctx.params.project_id;
    let dataSync = ctx.params.merge;

    let warnMessage = ''

    /**
     * 因为以前接口文档写错了，做下兼容
     */
    try{
      if(!dataSync &&ctx.params.dataSync){
        warnMessage = 'importData Api 已废弃 dataSync 传参，请联系管理员将 dataSync 改为 merge.'
        dataSync = ctx.params.dataSync
      }
    }catch(e){}

    let token = ctx.params.token;
    if (!type || !importDataModule[type]) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, '不存在的导入方式'));
    }

    if (!content && !ctx.params.url) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, 'json 或者 url 参数，不能都为空'));
    }
    try {
      let request = require("request");// let Promise = require('Promise');
      let syncGet = function (url){
          return new Promise(function(resolve, reject){
              request.get({url : url}, function(error, response, body){
                  if(error){
                      reject(error);
                  }else{
                      resolve(body);
                  }
              });
          });
      }
      if(ctx.params.url){
        content = await syncGet(ctx.params.url);
      }else if(content.indexOf('http://') === 0 || content.indexOf('https://') === 0){
        content = await syncGet(content);
      }
      content = JSON.parse(content);
    } catch (e) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, 'json 格式有误:' + e));
    }

    let menuList = await this.interfaceCatModel.list(project_id);
    let selectCatid = menuList[0]._id;
    let projectData = await this.projectModel.get(project_id);
    let res = await importDataModule[type](content);

    let successMessage;
    let errorMessage = [];
    await HanldeImportData(
      res,
      project_id,
      selectCatid,
      menuList,
      projectData.basePath,
      dataSync,
      err => {
        errorMessage.push(err);
      },
      msg => {
        successMessage = msg;
      },
      () => {},
      token,
      yapi.WEBCONFIG.port
    );

    if (errorMessage.length > 0) {
      return (ctx.body = yapi.commons.resReturn(null, 404, errorMessage.join('\n')));
    }
    ctx.body = yapi.commons.resReturn(null, 0, successMessage + warnMessage);
  }

  async projectInterfaceData(ctx) {
    ctx.body = 'projectInterfaceData';
  }

  handleValue(val, global) {
    let globalValue = ArrayToObject(global);
    let context = Object.assign({}, {global: globalValue}, this.records);
    return handleParamsValue(val, context);
  }

  handleEvnParams(params) {
    let result = [];
    Object.keys(params).map(item => {
      if (/env_/gi.test(item)) {
        let curEnv = yapi.commons.trim(params[item]);
        let value = { curEnv, project_id: item.split('_')[1] };
        result.push(value);
      }
    });
    return result;
  }
  async runAutoTest(ctx) {
    if (!this.$tokenAuth) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, 'token 验证失败'));
    }
    // console.log(1231312)
    const token = ctx.query.token;
    const subset = ctx.params.subset;
    const projectId = ctx.params.project_id;
    const failedinterrupt = ctx.params.failedinterrupt;
    const startTime = new Date().getTime();
    const testList = [];
    const records = (this.records = {});
    const reports = (this.reports = {});
    let rootid = ctx.params.id;
    let curEnvList = this.handleEvnParams(ctx.params);
    var socketlist = [];

    let colids=[];
    let colData2;
    var colName;
    //获取工程全局key 并设置进lib
    let projectInfo = await this.projectModel.getBaseInfo(projectId);
    if(projectInfo.global_script){
      setGlobalScript(projectId,projectInfo.global_script);
    }
       //是否包含子测试集合，若包含获取子集合id
    if(ctx.params.descendants) {
      // colids = colids.concat(colData2.descendants);
      colData2 = await yapi.commons.getCol(projectId,false,rootid);
      if(colData2.descendants){
        colids = colData2.descendants;
      }else{
        colids.push(colData2._id);
      }
    }else{
      colids.push(parseInt(rootid));
    }
   // console.log({ctx,projectId,'ctx.params':ctx.params});
    let projectData = await this.projectModel.get(projectId);
    let colData = await this.interfaceColModel.get(rootid);
    //前置执行集合
    if(colData.pre_col){
      let preCollist = colData.pre_col;
      let prelist = preCollist.split(',');
      colids.unshift(...prelist);
    }

    colName = colData.name;
//--------------
    var isbreak = false;
    for(let c=0;c<colids.length;c++){
      if(isbreak){
        break;
      }
      let id=colids[c];
      let caseList = await yapi.commons.getCaseList(id);
      if (caseList.errcode !== 0) {
        ctx.body = caseList;
      }
      caseList = caseList.data;
      for (let i = 0, l = caseList.length; i < l; i++) {
        if(colData.pre_col&&colData.pre_col.indexOf(caseList[i].col_id)>=0){
          caseList[i].casename = "前置colCase--"+caseList[i].casename;
        }
        // console.log(caseList[i]);
        let item = caseList[i];
        let curEnvItem = _.find(curEnvList, key => {
          return key.project_id == item.project_id;
        });
        let result;
        if(subset){
          result = await this.caseItemrun(socketlist,caseList[i], curEnvItem, projectData.pre_script,projectData.after_script,caseList[i].colpre_script,caseList[i].colafter_script,records,reports);
        }else{
          result = await this.caseItemrun(socketlist,caseList[i], curEnvItem, projectData.pre_script,projectData.after_script,colData.colpre_script,colData.colafter_script,records,reports);
        }


        testList.push(result);
        if (failedinterrupt === true&&result.code !== 0) {
          isbreak = true;
          break;
        }
      }
    }
    //执行结束关闭连接
    if(socketlist.length>0){
      socketlist.forEach(item=>{
        item.close();
      })
    }
//-----------------------
    function getMessage(testList) {
      let successNum = 0,
        failedNum = 0,
        len = 0,
        msg = '';
      testList.forEach(item => {
        len++;
        if (item.code === 0) {
          successNum++;
        }
        else {
          failedNum++;
        }
      });
      if (failedNum === 0) {
        msg = `一共 ${len} 测试用例，全部验证通过`;
      } else {
        msg = `一共 ${len} 测试用例，${successNum} 个验证通过， ${failedNum} 个未通过。`;
      }

      return { msg, len, successNum, failedNum };
    }

    const endTime = new Date().getTime();
    const executionTime = (endTime - startTime) / 1000;

    let reportsResult = {
      colName: colName,
      message: getMessage(testList),
      runTime: executionTime + 's',
      numbs: testList.length,
      list: testList,
      startTime:startTime,
      endTime:endTime
    };

    let executor = '服务端执行',status=1,failedNum=0;
    testList.forEach(item => {
      if (item.code !== 0) {
        failedNum++;
      }
    });
    if (failedNum === 0) {
      status = 0;
    }
    let saveColReport = {
      colid : rootid,
      run_end : endTime,
      run_start : startTime,
      add_time : yapi.commons.time(),
      executor : executor,
      status: status,
      test_report :JSON.stringify(reports)
    }
    this.colReportModel.save(saveColReport);//保存报告记录

    if (ctx.params.email === true && reportsResult.message.failedNum !== 0) {
      let autoTestUrl = `${
        ctx.request.origin
      }/api/open/run_auto_test?id=${rootid}&token=${token}&mode=${ctx.params.mode}`;
      yapi.commons.sendNotice(projectId, {
        title: `YApi 自动化测试报告`,
        content: `
        <html>
        <head>
        <title>${colName} 测试报告</title>
        <meta charset="utf-8" />
        <body>
        <div>
        <h3>测试结果：</h3>
        <p>${reportsResult.message.msg}</p>
        <h3>测试结果详情如下：</h3>
        <p>${autoTestUrl}</p>
        </div>
        </body>
        </html>`
      });
    }
    let mode = ctx.params.mode || 'html';
    if(ctx.params.download === true) {
      ctx.set('Content-Disposition', `attachment; filename=test.${mode}`);
    }
    if (ctx.params.mode === 'json') {
      return (ctx.body = reportsResult);
    } else {
      if(ctx.params.serverlog === true && ctx.params.logurl !=='' && ctx.params.jobname !== ''){
        let logurl = ctx.params.logurl;
        let jobname = ctx.params.jobname;
        return (ctx.body = renderToHtml(reportsResult,logurl,jobname));
      }else{
        return (ctx.body = renderToHtml(reportsResult));
      }
    }
  }

  async caseItemrun(socketlist,caseme, curEnvItem, pre_script,after_script,colpre_script,colafter_script,records,reports) {

    let item = caseme;
    let projectEvn = await this.projectModel.getByEnv(item.project_id);
    item.id = item._id;
    item.case_env = curEnvItem ? curEnvItem.curEnv || item.case_env : item.case_env;
    item.req_headers = this.handleReqHeader(item.req_headers, projectEvn.env, item.case_env);
    item.pre_script = pre_script;
    item.after_script = after_script;
    item.colpre_script = colpre_script;
    item.colafter_script = colafter_script;
    item.env = projectEvn.env;
    item.socketlist = socketlist;
    let result;
    // console.log('item',item.case_env)
    try {
      result = await this.handleTest(item);
    } catch (err) {
      result = err;
    }
    reports[item.id] = result;
    records[item.id] = {
      params: result.params,
      body: result.res_body
    };
    return result
  }

  async handleTest(caseItemData) {
    let requestParams = {};
    let options;
    options = handleParams(caseItemData, this.handleValue, requestParams);
    let result = {
      id: caseItemData.id,
      name: caseItemData.casename,
      path: caseItemData.path,
      code: 400,
      validRes: [],
      intf_id:caseItemData.interface_id,
      uid:caseItemData.uid
    };

    try {
      options.taskId = this.getUid();
      requestParams.taskId= this.getUid();
      let data;
      var sock;
      // console.log('options',options);
      if(options.method=='WS'||options.method=='WSS'){
        //判断当前是否已连接
        //遍历weocket对象数组
        let s = getsocket();
        for(let i=0;i<s.length;i++){
          if(s[i].url==options.url){
            sock = s[i]
            //获取状态
            console.log('s.readyState',sock.readyState);
          }
        }
        if(!sock||sock.readyState==3){
          // 创建了一个客户端的socket,然后让这个客户端去连接服务器的socket
          let op = {headers:options.headers};
          sock = new nodews(options.url,op);
          try{
            await new Promise((resolve,reject) => {
              sock.on("error", function(err) {
                reject(err);
              });
              sock.on("open", async function () {
                console.log("connect success !!!!");
                this.WebSocket = sock;
                setsocket(this.WebSocket);
                // sock.onmessage = (e) =>{
                //   resolve('socket连接消息',e);
                // };
                resolve('ws连接成功');
              })
            })
          }catch(err){
            console.log('ws连接失败',err);
          }
        }
        sock.on("error", function(err) {
          console.log("wserror: ", err);
        });
        
        sock.on("close", function() {
          console.log("wsclose");
        });
        await new Promise(async (resolve) => {
            data =await crossRequest(options, caseItemData.pre_script, caseItemData.after_script,caseItemData.case_pre_script,caseItemData.case_post_script,caseItemData.colpre_script,caseItemData.colafter_script,sock,createContext(
              requestParams.taskId,
              caseItemData.project_id,
              caseItemData.interface_id||caseItemData.id
            ));
            // console.log('data',data)
            resolve(data)
        })
      }else{
        data = await crossRequest(options, caseItemData.pre_script, caseItemData.after_script,caseItemData.case_pre_script,caseItemData.case_post_script,caseItemData.colpre_script,caseItemData.colafter_script,sock,createContext(
          this.getUid(),
          caseItemData.project_id,
          caseItemData.interface_id||caseItemData.id
        ));
      }
      let res = data.res;

      result = Object.assign(result, {
        status: res.status,
        statusText: res.statusText,
        url: data.req.url,
        method: data.req.method,
        data: data.req.data,
        headers: data.req.headers,
        res_header: res.header,
        res_body: res.body
      });
      if (options.data && typeof options.data === 'object') {
        requestParams = Object.assign(requestParams, options.data);
      }

      let validRes = [];

      let responseData = Object.assign(
        {},
        {
          status: res.status,
          body: res.body,
          header: res.header,
          statusText: res.statusText
        }
      );

//      if(caseItemData.test_script&&caseItemData.test_script.length>0){
//        console.log('走到handleScriptTest');
      await this.handleScriptTest(caseItemData, responseData, validRes, requestParams);
//      }
      result.params = requestParams;
      // console.log('result',result);
      if (validRes.length === 0) {
        result.code = 0;
        result.validRes = [{ message: '验证通过' }];
        result.statusText='OK'
        //验证通过同步用例
        if(caseItemData.testcaseid>0){
          const params = 'pass';
          let caseData = await this.caselibModel.get(caseItemData.testcaseid);
          if (caseData) {
            await this.caselibModel.upStatus(caseItemData.testcaseid, params);
            console.log('用例同步状态成功');
          } 
        }
      } else if (validRes.length > 0) {
        result.code = 1;
        result.validRes = validRes;
        result.statusText='test脚本出错：奈何兄弟没文化！一句xx走天下！'
        //验证失败同步用例
        if(caseItemData.testcaseid>0){
          const params = 'fail';
          let caseData = await this.caselibModel.get(caseItemData.testcaseid);
          if (caseData) {
            await this.caselibModel.upStatus(caseItemData.testcaseid, params);
            console.log('用例同步状态成功');
          }
        }
      }
    } catch (data) {
      result = Object.assign(options, result, {
        res_header: data.header,
        res_body: data.body || data.message,
        status: null,
        statusText: data.message,
        code: 400
      });
    }
    if(sock&&sock.readyState==1){
      // sock.close();
      caseItemData.socketlist.push(sock)
    }
    return result;
  }

  async handleScriptTest(caseItemData, response, validRes, requestParams) {
//      console.log('caseItemData',caseItemData)
      try {

        let test = await yapi.commons.runCaseScript({
            response: response,
            records: this.records,
            script: caseItemData.test_script,
            params: requestParams,
            taskId : requestParams.taskId
        }, caseItemData.col_id, caseItemData.interface_id, this.getUid());
//        console.log('test',test)
        if (test.errcode !== 0) {
            test.data.logs.forEach(item => {
                validRes.push({
                    message: 'false:'+item
                });
            });
        }
      } catch (err) {
        validRes.push({
            message: 'Error: ' + err.message
        });
      }
  }

  handleReqHeader(req_header, envData, curEnvName) {
    envData = JSON.stringify(envData);
    envData = JSON.parse(envData);
    let currDomain = handleCurrDomain(envData, curEnvName);
    let header = currDomain.header;
    header.forEach(item => {
      if (!checkNameIsExistInArray(item.name, req_header)) {
        item.abled = true;
        //如果两个名字一样也需要加进数组，且以环境header为主
        req_header = req_header.filter(obj =>obj.name !== item.name);
        req_header.push(item);
      }
    });
    req_header = req_header.filter(item => {
      return item && typeof item === 'object';
    });
    return req_header;
  }
}

module.exports = openController;
