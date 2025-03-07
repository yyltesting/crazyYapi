const schedule = require('node-schedule');
const projectModel = require('models/project.js');
const oauthModel = require('../model/oauthModel.js');
const yapi = require('yapi.js');
const https = require('https');
const jobMap = new Map();
const {crossRequest,setGlobalScript} = require('../../../common/postmanLib');
const createContext = require('../../../common/createContext')

class syncTokenUtils {
  constructor(ctx) {
    yapi.commons.log(
      '-------------------------------------tokenSyncUtils constructor-----------------------------------------------'
    );
    this.ctx = ctx;
    this.oauthModel = yapi.getInst(oauthModel);
    this.projectModel = yapi.getInst(projectModel);
    this.init();
  }

  //初始化token获取定时任务
  async init() {
    let allSyncJob = await this.oauthModel.listAll();
    for (let i = 0, len = allSyncJob.length; i < len; i++) {
      let syncItem = allSyncJob[i];
      if (syncItem.is_oauth_open) {
        this.addSyncJob(syncItem);
      }
    }
  }

  async addSyncJob(oauthData) {
    let hourExpr = '0 0 */{parameter} * * *';
    let minExpr = '*/{parameter} * * * *'

    let cornExpression = minExpr;
    if (!oauthData.token_valid_unit || oauthData.token_valid_unit == 'hour') {
      cornExpression = hourExpr;
    }
    
    cornExpression = cornExpression.replace(
      '{parameter}',
      oauthData.token_valid_hour
    );
    //立即执行一次
    this.refreshOauthToken(oauthData);
    let scheduleItem = schedule.scheduleJob(cornExpression, async () => {
      this.refreshOauthToken(oauthData);
    });

    //判断是否已经存在这个任务
    let uniqueId = this.getUniqueId(oauthData.project_id, oauthData.env_id);
    let jobItem = jobMap.get(uniqueId);
    if (jobItem) {
      jobItem.cancel();
    }
    jobMap.set(uniqueId, scheduleItem);
  }

  getSyncJob(oauthData) {
    let uniqueId = this.getUniqueId(oauthData.project_id, oauthData.env_id);
    return jobMap.get(uniqueId);
  }

  deleteSyncJob(oauthData) {
    let uniqueId = this.getUniqueId(oauthData.project_id, oauthData.env_id);
    let jobItem = jobMap.get(uniqueId);
    if (jobItem) {
      jobItem.cancel();
    }
  }

  getTokenByPath(result, token_path) {
    let accessToken = '';
    //将字符串转成数组
    let paths = token_path.split('+');
    paths.forEach(path => {
      let token = result;
      path = path.trim();
      let tokenPath = path.replace(/\[/g, '.');
      tokenPath = tokenPath.replace(/\]/g, '');
      let tokenPathList = tokenPath.split('.');
      if (tokenPathList[0] === 'body') {
        tokenPathList[0] = 'data';
        tokenPathList.forEach(item => {
          token = token[item];
        });
        accessToken += token;
      } else if (tokenPathList[0] === 'header') {
        tokenPathList[0] = 'headers';
        tokenPathList.forEach(item => {
          token = token[item];
        });
        if (typeof token == 'object') {
          token.forEach((item, index) => {
            if (index === token.length - 1) {
              accessToken += item.split(';')[0];
            } else {
              accessToken += item.split(';')[0] + '; ';
            }
          });
        } else {
          accessToken += token; 
        }
        
      } else {
        let tokenPath = path.replace(/'/g, '').replace(/"/g, '');
        accessToken += tokenPath;
      }
    });
    return accessToken;
  }
  sandboxByNode(sandbox = {}, script) {
    if(script.indexOf('process')>=0||script.indexOf('exec')>=0||script.indexOf('require')>=0) { 
      throw new Error("执行失败，脚本中含敏感操作....");
    }
    const vm = require('vm');
    script = new vm.Script(script);
    const context = new vm.createContext(sandbox);
    script.runInContext(context, {
      timeout: 120000
    });
    return sandbox;
  }
  //修复异步处理超时不生效--启用浏览器设置
  async sandbox(context = {}, script) {
    try {
      context.context = await context;
      context.console = console;
      context.Promise = Promise;
      context.setTimeout = setTimeout;
      context = this.sandboxByNode(context, script);
    } catch (err) {
      err.message = `Script: ${script}
      message: ${err.message}`;
      throw err;
    }
    if (context.promise && typeof context.promise === 'object' && context.promise.then) {
      try {
        await context.promise;
      } catch (err) {
        err.message = `Script: ${script}
        message: ${err.message}`;
        throw err;
      }
    }
    return context;
  }
  arrToObject(arr) {
    const obj = {};
    arr.forEach(item => {
      if (item && item.keyName) {
        obj[item.keyName] = item.value.trim().replace('{time}', new Date().getTime());
      }
    });
    return obj;
  }
  /**
   * 刷新oauth的token值
   * @param {*} oauthData
   */
  async refreshOauthToken(oauthData) {
    yapi.commons.log(
      'token更新定时器触发, getTokenUrl:' + oauthData.get_token_url
    );
    //对定时任务存在的必要性做判断
    let projectData;
    try {
      projectData = await this.preRefresh(oauthData);
    } catch (e) {
      return;
    }

    let projectId = projectData._id;
    let getTokenUrl = oauthData.get_token_url;
    let method = oauthData.request_type;
    let result;
    let crossResult;
    let headers_data 
    let options;
    let projectInfo
    try {
      //获取工程信息
      projectInfo = await this.projectModel.get(projectId);
      if(projectInfo.global_script){
        setGlobalScript(projectId,projectInfo.global_script);
      }
      if (method === 'GET') {
        headers_data = oauthData.headers_data;
        let params = oauthData.params;
        result = await this.execGetToken(getTokenUrl, method, headers_data, params);
      } else if(oauthData.dataType === 'data_json'){
        headers_data = this.arrToObject(oauthData.headers_data);
        options = {
          caseId: oauthData._id,
          headers: headers_data,
          method: oauthData.request_type,
          url: oauthData.get_token_url,
          data: JSON.parse(oauthData.data_json),
          taskId: projectInfo.uid
        };
      }else{
        headers_data = this.arrToObject(oauthData.headers_data);
        formData = this.arrToObject(oauthData.form_data);
        options = {
          caseId: oauthData._id,
          headers: headers_data,
          method: oauthData.request_type,
          url: oauthData.get_token_url,
          data: formData,
          taskId: projectInfo.uid
        };
      }

      crossResult = await crossRequest(options, '', '',oauthData.case_pre_script,oauthData.case_post_script,"","","",createContext(
        projectInfo.uid,
        projectInfo._id,
        oauthData._id
      ));
      result = {
        data : crossResult.res.body,
        headers : crossResult.res.header,
        status : crossResult.res.status
      }
      if(result.status!==200){
        yapi.commons.log('环境：【' + oauthData.env_name + '】获取数据失败，请确认 getTokenUrl 是否正确');
      }
      let accessToken = this.getTokenByPath(result, oauthData.token_path);
      //更新到对应的env上;
      await this.updateProjectToken(accessToken, oauthData, projectData);
      this.saveSyncLog(0, '环境：【' + oauthData.env_name + '】更新新的token【' + accessToken + '】成功', '1', projectId);
      yapi.commons.log('环境：【' + oauthData.env_name + '】更新token成功');
    } catch (e) {
      this.saveSyncLog(-1, '环境：【' + oauthData.env_name + '】数据格式出错，请检查', '1', projectId);
      yapi.commons.log('环境：【' + oauthData.env_name + '】获取数据失败' + e.message);
    }
  }

  /**
   * 更新获取到的token到数据库中
   * @param {*} accessToken
   * @param {*} oauthData
   * @param {*} projectData
   */
  async updateProjectToken(accessToken, oauthData, projectData) {
    for (let i = 0; i < projectData.env.length; i++) {
      if (projectData.env[i]._id == oauthData.env_id || projectData.env[i]._id.toString() == oauthData.env_id.toString()) {
        let newItem = {
          name: oauthData.token_header,
          value: accessToken
        };

        //更新或者插入这个header
        let updateFlag = false;
        for (
          let j = 0, len = projectData.env[i]['header'].length;
          j < len;
          j++
        ) {
          if (projectData.env[i]['header'][j]['name'] == newItem.name) {
            updateFlag = true;
            projectData.env[i]['header'][j]['value'] = newItem.value;
            break;
          }
        }

        if (!updateFlag) {
          projectData.env[i]['header'].push(newItem);
        }
        await this.projectModel.up(projectData._id, projectData);
        break;
      }
    }
  }

  /**
   * 记录同步日志
   * @param {*} errcode
   * @param {*} syncMode
   * @param {*} moremsg
   * @param {*} uid
   * @param {*} projectId
   */
  saveSyncLog(errcode, moremsg, uid, projectId) {
    yapi.commons.saveLog({
      content:
        '自动获取token状态:' +
        (errcode == 0 ? '成功' : '失败') +
        ',更多信息:' +
        moremsg,
      type: 'project',
      uid: uid,
      username: '自动同步用户',
      typeid: projectId
    });
  }

  /**
   * 刷新token之前 进行一些必要的判断
   * @param {*} oauthData 更新任务
   */
  async preRefresh(oauthData) {
    let projectId = oauthData.project_id;
    let projectData;
    //判断项目是否还存在
    try {
      projectData = await this.projectModel.get(projectId);
    } catch (e) {
      yapi.commons.log('获取项目:' + projectId + '失败');
      await this.deleteSyncJobAndRemoveData(oauthData);
      throw new Error(`获取项目失败`);
    }

    //如果项目已经删除
    if (!projectData) {
      yapi.commons.log('项目:' + projectId + '不存在');
      await this.deleteSyncJobAndRemoveData(oauthData);
      throw new Error(`项目已经不存在`);
    }

    //如果环境变量已经删除
    let envArray = projectData.env;
    for (let i = 0; i < envArray.length; i++) {
      if (envArray[i]._id == oauthData.env_id) {
        return projectData;
      }
    }

    yapi.commons.log(
      '项目:' + projectId + ',环境变量：' + oauthData.env_name + '已经不存在'
    );
    await this.deleteSyncJobAndRemoveData(oauthData);
    return projectData;
  }

  /**
   * 删除定时任务并且移除数据库的定时记录
   * @param {} oauthData
   */
  async deleteSyncJobAndRemoveData(oauthData) {
    this.deleteSyncJob(oauthData);
    //删除数据库定时任务
    await this.oauthModel.delByProjectIdAndEnvId(
      oauthData.project_id,
      oauthData.env_id
    );
  }

  /**
   * 请求获取token值的接口
   * @param {*} getTokenUrl 获取token的路径
   */
  async execGetToken(getTokenUrl, type, headers_data, data, dataJson, dataType) {
    getTokenUrl = getTokenUrl.trim().replace('{time}', new Date().getTime());
    const axios = require('axios');
    try {
      let response;
      let headersData = headers_data;

      // 以支持压缩的response
      headersData['Accept-Encoding'] = 'gzip, deflate';
      if (type === 'GET') {
        let params = {};
        data.forEach(item => {
          if (item.keyName !== '') {
            params[item.keyName] = item.value
                .trim()
                .replace('{time}', new Date().getTime());
          }
        });
        response = await axios.get(getTokenUrl, {
          params: params,
          headers: headersData,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false
          })
        });
      } else {
        if (dataType === 'data_json') {
          headersData['Content-Type'] = 'application/json';
          const instance = axios.create({
            headers: headersData,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          });
          response = await instance.post(getTokenUrl, dataJson);
        } else {
          let formData = [];
          data.forEach(item => {
            if (item.keyName !== '') {
              formData.push(item.keyName + "=" + item.value.trim().replace('{time}', new Date().getTime()));
            }
          });
          headersData['Content-Type'] = 'application/x-www-form-urlencoded';
          response = await axios.post(getTokenUrl, formData.join('&'),
          { 
            headers: headersData,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false
            })
          });
        }
      }
      if (response.status > 400) {
        throw new Error(
          `http status "${response.status}"` +
            '获取数据失败，请确认 getTokenUrl 是否正确'
        );
      }
      return response;
    } catch (e) {
      let response = e.response;
      throw new Error(
        `http status "${response.status}"` +
          '获取数据失败，请确认 getTokenUrl 是否正确'
      );
    }
  }

  getUniqueId(projectId, envId) {
    return projectId + '-' + envId;
  }
}

module.exports = syncTokenUtils;
