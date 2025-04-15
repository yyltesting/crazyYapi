const { isJson5, json_parse, handleJson, joinPath, safeArray } = require('./utils');
const constants = require('../client/constants/variable.js');
const _ = require('loadsh');
const URL = require('url');
const utils = require('./power-string.js').utils;
const HTTP_METHOD = constants.HTTP_METHOD;
const axios = require('axios');
const qs = require('qs');
const CryptoJS = require('crypto-js');
const jsrsasign = require('jsrsasign');
const https = require('https');

const isNode = typeof global == 'object' && global.global === global;
//保存数据到一个数组json对象中
let jsonData = [];
function saveData(item) {
  //item是数组[]
  jsonData.push(item);
}
function getData() { 
  return jsonData;
}
function clearData() {
  jsonData = [];
}
//存留全局方法
var global_script={};
function setGlobalScript(id,str){
  global_script[id] = str;
}
function getGlobalScript(){
  return global_script;
}
//存留websocket客户端 注意前端和后端是分开的
var socket = [];
//存留websocket消息
let message = {};
function setsocket(ws){
  socket.push(ws);
  let key = ws.url;
  message[key] = [];
  // 接受消息，可以一直监听,消息统一在这里接收
  ws.onmessage = (e) => {
    message[key].push(e.data);
  };
  // 启动定时器
  if(!timerId){
    startTimer();
  }
}
function getsocket(){
  return socket;
}
// 定时器ID
let timerId;
// 保持连接的心跳和清理数据
function startTimer() {
  timerId = setInterval(() => {
    socket.forEach((item,index)=>{
      if (item.readyState == 3) {
        //清理message里面的消息
        delete message[item.url];
        socket.splice(index,1);
      }
      // if(item.readyState === WebSocket.OPEN){
      //   //ping
      // }
    })
    if(socket.length == 0 ){
      stopTimer()
    }
  }, 5000);
}
// 停止定时器
function stopTimer() {
  clearInterval(timerId);
  timerId = undefined;
}
function cleansocket(i){
  //清理message里面的消息,展示手动断开才清理数据，以免自动化测试过程中断开message被清空无法获取
  delete message[socket[i].url];
  socket.splice(i,1);
}
  //获取消息集
function wsmsg(url,str){
  let msg = message[url];
  if(str == "all"){
    return msg;
  }else if(str == "length"){
    return msg.length;
  }else if(str == "status"){
    for (let item of socket) {
      if (item.url == url) {
        return item.readyState;
      }
    }
    return 0;//0表示没有找到状态
  }else{
    return msg;
  }
}
if (!isNode) {
  axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    config.headers = {
      ...config.headers,
      'Yapi-User': localStorage.getItem('YAPI_USER') || ''
    }
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });
}

const ContentTypeMap = {
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/html': 'html',
  'text/html': 'html',
  other: 'text'
};

const getStorage = async (id)=>{
  try{
    if(isNode){
      let storage = global.storageCreator(id);
      let data = await storage.getItem();
      return {
        getItem: (name)=> data[name],
        setItem: (name, value)=>{
          data[name] = value;
          storage.setItem(data,name,value)
        },
        removeItem: ()=>storage.removeItem(id)
      }
    }else{
      return {
        getItem: (name)=> window.localStorage.getItem(name),
        setItem: (name, value)=>  window.localStorage.setItem(name, value)
      }
    }
  }catch(e){
    console.error(e)
    return {
      getItem: (name)=>{
        console.error(name, e)
      },
      setItem: (name, value)=>{
        console.error(name, value, e)
      }
    }
  }
}

async function httpRequestByNode(options,ws) {
  function handleRes(response,options) {
    //console.log({response});
    if (!response || typeof response !== 'object') {
      return {
        res: {
          status: 500,
          body: isNode
            ? '请求出错, 内网服务器自动化测试无法访问到，请检查是否为内网服务器！'
            : '请求出错'
        }
      };
    }
    else if(options&&options.headers['binary']){
      let body = uploadFile64(response.data);
      return {
        res: {
          header: response.headers,
          status: response.status,
          body:'data:'+options.headers['binary']+';base64,'+body,
          statusText:response.statusText
        }
      }
    }else{
      return {
        res: {
          header: response.headers,
          status: response.status,
          body: response.data,
          statusText:response.statusText
        }
      };
    }
  }
  //二进制转base64
  function uploadFile64(file) {    
    var byteString = Buffer.from(file, 'binary').toString('base64');
    return byteString;
}
//base64转二进制流
  function dataURLtoBlob(base64Data) {
    // console.log(base64Data, 'base64Data'); // data:image/png;base64,
    try{
      // var byteString;
      // if (base64Data.split(',')[0].indexOf('base64') >= 0) byteString = Buffer.from(base64Data.split(',')[1], 'base64').toString('binary');//atob(base64Data.split(',')[1]);
      // // base64 解码
      // else {
      //   byteString = decodeURIComponent(base64Data.split(',')[1])
      // }
      // var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0]; // mime类型 -- image/png
      // var ia = new Uint8Array(byteString.length); // 创建视图
      // for (var i = 0; i < byteString.length; i++) {
      //   ia[i] = byteString.charCodeAt(i)
      // }
      // var blob = new Blob([ia], {
      //   type: mimeString
      // });
      // console.log('二进制',blob);
      //nodejs转二进制方法
      let buffer = Buffer.from(base64Data.split(',')[1], 'base64');
      let blob = Uint8Array.from(buffer).buffer;
      // console.log('二进制',blob);
      return blob
    }catch(err){
      console.log('err',err);
      return base64Data
    }
  }
  function handleData() {
    // console.log('options',options);
    let contentTypeItem;
    if (!options) return;
    if (typeof options.headers === 'object' && options.headers) {
      Object.keys(options.headers).forEach(key => {
        if (/content-type/i.test(key)) {
          if (options.headers[key]) {
            contentTypeItem = options.headers[key]
              .split(';')[0]
              .trim()
              .toLowerCase();
          }
        }
        if (!options.headers[key]) delete options.headers[key];
      });

      if (
        contentTypeItem === 'application/x-www-form-urlencoded' &&
        typeof options.data === 'object' &&
        options.data
      ) {
        options.data = qs.stringify(options.data, { indices: false });
      }else if(contentTypeItem === 'multipart/form-data' &&
        typeof options.data === 'object' &&
        options.data){
        let formdata=new FormData();
        Object.keys(options.data).forEach(k=>{
          formdata.append(k,dataURLtoBlob(options.data[k]))
        })
        options.data=formdata;
      }else if(contentTypeItem === 'binary/octet-stream'){
        options.data=dataURLtoBlob(options.data);
    }
    }
  }
  try {
    handleData(options);
    if(options.headers['binary']){
      var responseType="arraybuffer";
    }
    let axioscontent={
      method: options.method,
      url: options.url,
      headers: options.headers,
      timeout: 120000,
      maxRedirects: 0,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      data: options.data,
      responseType:responseType
    }
    let response;
    
    if(options.method=='WS'||options.method=='WSS'){
      if(ws&&ws.readyState==1){
        //判断是否为接收类型还是又发送又接收
        if(!options.data){
          let newurl = options.url;
          if(options.url.indexOf('//')== -1){
            newurl = options.url.replace(`:`,`://`)
          }
          //获取历史最新消息
          let historymessage = message[newurl];
          if(historymessage){
            response = historymessage[historymessage.length - 1];
          }else{
            response = null;
          }
          if(isJSON(response)){
            response = JSON.parse(response);
          }

        }else{
          try{
            if(typeof options.data =='object' && Object.prototype.toString.call(options.data) === '[object Object]'){
              await ws.send(JSON.stringify(options.data));
            }else{
              await ws.send(options.data);
            }
          }catch(e){
            await ws.send(options.data);
          }
  
          await new Promise((resolve) => {
            let newurl = options.url;
            if(options.url.indexOf('//')== -1){
              newurl = options.url.replace(`:`,`://`)
            }
            //获取历史最新消息
            setTimeout(() => {
              let historymessage = message[newurl];
              if(historymessage){
                response = historymessage[historymessage.length - 1];
              }else{
                response = null;
              }
              if(isJSON(response)){
                response = JSON.parse(response);
              }
              resolve(response);
            }, 1000);
          })
        }
        return handleRes({
          headers: {},
          status: 200,
          data: response,
          statusText: 'OK'
        },options);
      }else{
        console.log('未连接');
        return handleRes({
          headers: {},
          status: 500,
          data: '未连接websocket'
        },options);
      }

    }else{
      // {
      //   let url = URL.parse(axioscontent.url);
      //   console.log({"axios 请求：":{...axioscontent, queryParams: qs.parse(url.query)}});
      // }
      let start = new Date().getTime();
      // console.log('axioscontent',axioscontent);
      response = await axios(axioscontent);
      let end = new Date().getTime();
      let time = (end - start)+"ms";
      response.headers.runtime = time;
      // console.log('response',response);
      return handleRes(response,options);
    }
  } catch (err) {
    // console.log('{err}',{err});
    if (err.response === undefined) {
      if(err.message==="Network Error"){
        err.message={"err":err.message,"des":"请参考教程开启chrome 跨域请求：https://blog.csdn.net/qq_32786873/article/details/70173151"}
      }
      return handleRes({
        headers: {},
        status: null,
        data: err.message
      });
    }
    return handleRes(err.response);
  }
}

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function handleContentType(headers) {
  if (!headers || typeof headers !== 'object') return ContentTypeMap.other;
  let contentTypeItem = 'other';
  try {
    Object.keys(headers).forEach(key => {
      if (/content-type/i.test(key)) {
        contentTypeItem = headers[key]
          .split(';')[0]
          .trim()
          .toLowerCase();
      }
    });
    return ContentTypeMap[contentTypeItem] ? ContentTypeMap[contentTypeItem] : ContentTypeMap.other;
  } catch (err) {
    return ContentTypeMap.other;
  }
}

function checkRequestBodyIsRaw(method, reqBodyType) {
  if (
    reqBodyType &&
    reqBodyType !== 'file' &&
    reqBodyType !== 'form' &&
    HTTP_METHOD[method].request_body
  ) {
    return reqBodyType;
  }
  return false;
}

function checkNameIsExistInArray(name, arr) {
  let isRepeat = false;
  for (let i = 0; i < arr.length; i++) {
    let item = arr[i];
    if (item.name === name) {
      // isRepeat = true;
      break;
    }
  }
  return isRepeat;
}

function handleCurrDomain(domains, case_env) {
  let result1 = _.find(domains, item => item._id == case_env);
  //兼容自动化测试环境通过name找不到item值
  let result2 = _.find(domains, item => item.name == case_env);
  let currDomain;
  if(result1){
    currDomain = result1
  }else if(result2){
    currDomain = result2
  }else{
    currDomain = domains[0];
  }
  return currDomain;
}

function sandboxByNode(sandbox = {}, script) {
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
async function sandbox(context = {}, script) {
  if (isNode) {
    try {
      context.context = await context;
      context.console = console;
      context.Promise = Promise;
      context.setTimeout = setTimeout;
      context = sandboxByNode(context, script);
    } catch (err) {
      err.message = `Script: ${script}
      message: ${err.message}`;
      throw err;
    }
  } else {
    context = sandboxByBrowser(context, script);
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
//修复异步处理超时不生效
function sandboxByBrowser(context = {}, script) {
  if (!script || typeof script !== 'string') {
    return context;
  }
  if(script.indexOf('process')>=0||script.indexOf('exec')>=0||script.indexOf('require')>=0) { 
    throw new Error("执行失败，脚本中含敏感操作....");
  }
  let beginScript = '';
  for (var i in context) {
    beginScript += `var ${i} = context.${i};`;
  }
  try {
    eval(beginScript + script);
  } catch (err) {
    console.log(err);
    let message = `Script:
                   ----CodeBegin----:
                   ${beginScript}
                   ${script}
                   ----CodeEnd----
                  `;
    err.message = `Script: ${message}
    message: ${err.message}`;

    throw err;
  }
  return context;
}



/**
 *
 * @param {*} defaultOptions
 * @param {*} preScript
 * @param {*} afterScript
 * @param {*} commonContext  负责传递一些业务信息，crossRequest 不关注具体传什么，只负责当中间人
 */
async function crossRequest(defaultOptions, preScript, afterScript,case_pre_script,case_post_script,colpre_script,colafter_script,ws, commonContext = {}) {
  //进入该方法时
  // let t =  Object.assign({}, ws);
  let options = Object.assign({}, defaultOptions);
 // console.log({defaultOptions, preScript, afterScript,case_pre_script,case_post_script, commonContext})
  const taskId = options.taskId || Math.random() + '';
  let urlObj = URL.parse(options.url, true),
    query = {};
  query = Object.assign(query, urlObj.query);
  //console.log("context init start!");

  let context = {
    isNode,
    get href() {
      return urlObj.href;
    },
    set href(val) {
      throw new Error('context.href 不能被赋值');
    },
    get hostname() {
      return urlObj.hostname;
    },
    set hostname(val) {
      urlObj.host = val;
      urlObj.hostname = val;
      // throw new Error('context.hostname 不能被赋值');
    },

    get caseId() {
      return options.caseId;
    },

    set caseId(val) {
      throw new Error('context.caseId 不能被赋值');
    },

    method: options.method,
    pathname: urlObj.pathname,
    query: query,
    requestHeader: options.headers || {},
    requestBody: options.data,
    promise: false,
    storage: await getStorage(taskId),
    taskId: taskId,
    ws: ws,
    wsmsg: wsmsg,
    saveData:saveData,
    getData:getData,
    clearData:clearData
  };
  //console.log("context init end!");
  Object.assign(context, commonContext)

  context.utils = await Object.freeze({
    _: _,
    CryptoJS: CryptoJS,
    jsrsasign: jsrsasign,
    base64: utils.base64,
    imgBase64: utils.imgBase64,
    md5: utils.md5,
    sha1: utils.sha1,
    sha224: utils.sha224,
    sha256: utils.sha256,
    sha384: utils.sha384,
    sha512: utils.sha512,
    unbase64: utils.unbase64,
    firebasesgin: utils.firebasesgin,
    oauth2SignIn:utils.oauth2SignIn,
    revokeAccess:utils.revokeAccess,
    phone: utils.phone,
    idcard: utils.idcard,
    bancard: utils.bancard,
    timestamp: utils.timestamp,
    timestampms: utils.timestampms,
    ethsign: utils.ethsign,
    createAccounts:utils.createAccounts,
    sendTransaction:utils.sendTransaction,
    sendTransactionForkey:utils.sendTransactionForkey,
    sendTransactionForETH:utils.sendTransactionForETH,
    getBalance:utils.getBalance,
    getWalletAddress:utils.getWalletAddress,
    web3signForKey:utils.web3signForKey,
    getAccountBalance:utils.getAccountBalance,
    createSpaceWhitelistForKey:utils.createSpaceWhitelistForKey,
    createSpaceId:utils.createSpaceId,
    createSpaceIdForkey:utils.createSpaceIdForkey,
    findSpaceByOwner:utils.findSpaceByOwner,
    findSpaceByOwnerForKey:utils.findSpaceByOwnerForKey,
    updateSpaceRateForkey:utils.updateSpaceRateForkey,
    approve:utils.approve,
    approveForkey:utils.approveForkey,
    pledgeMoney:utils.pledgeMoney,
    pledgeMoneyForkey:utils.pledgeMoneyForkey,
    unpledgeMoney:utils.unpledgeMoney,
    unpledgeMoneyForkey:utils.unpledgeMoneyForkey,
    withdrawForkey:utils.withdrawForkey,
    claimReward:utils.claimReward,
    claimRewardForkey:utils.claimRewardForkey,
    claimairdropReward:utils.claimairdropReward,
    claimairdropRewardForkey:utils.claimairdropRewardForkey,
    bscPayForkey:utils.bscPayForkey,
    encodeDES: utils.encodeDES,
    encodeAES: utils.encodeAES,
    bs58Encode: utils.bs58Encode,
    tobedivisibleby: utils.tobedivisibleby,
    axios: axios
  })

  let globalScript = global_script[context.yapi_projectId] ? global_script[context.yapi_projectId] : '';
  if (preScript) {
    context = await sandbox(context, globalScript+preScript);
    defaultOptions.url = options.url = URL.format({
      protocol: urlObj.protocol,
      host: urlObj.host,
      query: context.query,
      pathname: context.pathname
    });
    defaultOptions.headers = options.headers = context.requestHeader;
    defaultOptions.data = options.data = context.requestBody;
  }
  if (colpre_script) {
    context = await sandbox(context, globalScript+colpre_script);
    defaultOptions.url = options.url = URL.format({
      protocol: urlObj.protocol,
      host: urlObj.host,
      query: context.query,
      pathname: context.pathname
    });
    defaultOptions.headers = options.headers = context.requestHeader;
    defaultOptions.data = options.data = context.requestBody;
  }
  if (case_pre_script) {
    context = await sandbox(context, globalScript+case_pre_script);
    // var y = decodeURIComponent(context.query);
    defaultOptions.url = options.url = URL.format({
      protocol: urlObj.protocol,
      host: urlObj.host,
      query:context.query,
      // search : "sign="+context.query,
      pathname: context.pathname
    });
    // console.log('options.url',options.url);
    defaultOptions.headers = options.headers = context.requestHeader;
    defaultOptions.data = options.data = context.requestBody;
  }

  let data;
  //判断是否需要跳过
  if (options.headers && options.headers['Skip']) {
    data = {res:{
      body: {
        code: 0,
        message: 'success',
        data: {}
      },
      status: 200,
      header: { Skip: true }
    }};
    return data;
  }
//关闭插件
  // data = await httpRequestByNode(options);
  // data.req = options;
  // data.utils=context.utils;
  // data.storage=context.storage;

//  if (isNode) {
//    data = await httpRequestByNode(options);
//    data.req = options;
//    data.utils=context.utils;
//    data.storage=context.storage;
//  } else {
//    data = await new Promise((resolve, reject) => {
//      options.error = options.success = function(res, header, data) {
//        let message = '';
//        if (res && typeof res === 'string') {
//          res = json_parse(data.res.body);
//          data.res.body = res;
//        }
//        if (!isNode) message = '请求异常，请检查 chrome network 错误信息... https://juejin.im/post/5c888a3e5188257dee0322af 通过该链接查看教程"）';
//        if (isNaN(data.res.status)) {
//          reject({
//            body: res || message,
//            header,
//            message
//          });
//        }
//        resolve(data);
//      };
//      console.log("调用异步");
//      window.crossRequest(options);
//    });
//  }

  var timeoutPromise;
  // 创建一个表示超时的 Promise
  async function timeoutPromisef(timeoutDuration){
    return new Promise( (resolve, reject) => {
      try{
        setTimeout(() => {
          let datas = {res:{
            header: {},
            status: 408,
            body: '请求超时timeout',
            statusText:'OK'
          },req:options}
          resolve(datas);
        }, timeoutDuration);
      }catch(e){
        reject(e);
      }
    });
  }
  //超时时间判断
  if(typeof(case_pre_script) == "string" && case_pre_script !== null && case_pre_script.trim() !== ""&&case_pre_script.indexOf('timeoutLimit')>=0){
    let t = timeoutDurationf(case_pre_script);
    timeoutPromise = timeoutPromisef(t);
  }else if(typeof(colpre_script) == "string" && colpre_script !== null && colpre_script.trim() !== ""&&colpre_script.indexOf('timeoutLimit')>=0){
    let t = timeoutDurationf(colpre_script);
    timeoutPromise = timeoutPromisef(t);
  }else if(typeof(preScript) == "string" && preScript !== null && preScript.trim() !== ""&&preScript.indexOf('timeoutLimit')>=0){
    let t = timeoutDurationf(preScript);
    timeoutPromise = timeoutPromisef(t);
  }else if(isNode||options.file||options.headers['binary']||options.method=='WS'||options.method=='WSS'){
    timeoutPromise = timeoutPromisef(120000);//node下运行最大两分钟，两分钟后超时
  }else{
    timeoutPromise = timeoutPromisef(120000);//默认两分钟超时
  }

//判断是否需要循环执行
let Loopnum = options.headers['Loopnum'] ? options.headers['Loopnum'] : 1;

for(let i=0;i<Loopnum;i++){
      //是否启用插件运行
  if (isNode || options.file||options.headers['binary']||options.method=='WS'||options.method=='WSS') {
    // data = await httpRequestByNode(options,ws);
    // data.req = options;
    const httpPromise = new Promise(async (resolve, reject) => {
      try {
        const result = await httpRequestByNode(options, ws);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    data = await Promise.race([httpPromise, timeoutPromise]);
    data.req = options;
  }else{   
    let start = new Date().getTime();
    const dataPromise = new Promise( async (resolve, reject) => {
      try {
        let res = await new Promise((innerResolve, innerReject) => {
          options.error = options.success = function(res, header, data) {
            let message = '';
            if (res && typeof res === 'string') {
              res = json_parse(data.res.body);
              data.res.body = res;
            }
            if (!isNode) message = '请求异常，请检查 chrome network 错误信息... https://juejin.im/post/5c888a3e5188257dee0322af 通过该链接查看教程"）';
            if (isNaN(data.res.status)) {
              innerReject({
                body: res || message,
                header,
                message
              });
            }
            innerResolve(data);
          };
    
          window.crossRequest(options);
        });
    
        resolve(res);
      } catch (error) {
        reject(error);
      }
    });
    // 使用 Promise.race 进行处理
    // if(timeoutPromise){
    data = await Promise.race([dataPromise, timeoutPromise]);
    // }else{
    //   data = await Promise.race([dataPromise]);
    // }
    let end = new Date().getTime();
    let time = (end - start)+"ms";
    data.res.header.runtime = time;
  }
  //判断是否需要延时处理
  if(options.headers['Timesleep']&& i!==Loopnum-1){
    await new Promise( (resolve) => {
      setTimeout(() => {
        console.log('sleep');
        resolve('ok');
      }, options.headers['Timesleep']);
    });
  }
}


  if (afterScript) {
    context.responseData = data.res.body;
    context.responseHeader = data.res.header;
    context.responseStatus = data.res.status;
    context.runTime = data.runTime;
    context = await sandbox(context, globalScript+afterScript);
    data.res.body = context.responseData;
    data.res.header = context.responseHeader;
    data.res.status = context.responseStatus;
    data.runTime = context.runTime;
  }

  if (colafter_script) {
    context.responseData = data.res.body;
    context.responseHeader = data.res.header;
    context.responseStatus = data.res.status;
    context.runTime = data.runTime;
    context = await sandbox(context, globalScript+colafter_script);
    data.res.body = context.responseData;
    data.res.header = context.responseHeader;
    data.res.status = context.responseStatus;
    data.runTime = context.runTime;
  }

  if (case_post_script) {
    context.responseData = data.res.body;
    context.responseHeader = data.res.header;
    context.responseStatus = data.res.status;
    context.runTime = data.runTime;
    context = await sandbox(context, globalScript+case_post_script);
    data.res.body = context.responseData;
    data.res.header = context.responseHeader;
    data.res.status = context.responseStatus;
    data.runTime = context.runTime;
  }
  
  return data;
}
//读取超时设置时间
function timeoutDurationf(data){
  let regex = /timeoutLimit\s=\s'([^']*)'/;
  var timeoutDuration;
  let matches = data.match(regex);
  if(matches){
    timeoutDuration = matches[1].trim();
  }
  timeoutDuration = parseInt(timeoutDuration,10);
  return timeoutDuration;
}



function handleParams(interfaceData, handleValue, requestParams) {
  let interfaceRunData = Object.assign({}, interfaceData);
  function paramsToObjectWithEnable(arr) {
    const obj = {};
    safeArray(arr).forEach(item => {
      if (item && item.name && (item.enable || item.required === '1')) {
        let value= handleValue(item.value, currDomain.global);
        if(item.type == 'list'){
          value=value.split(',');
        }
        obj[item.name] = value;
        if (requestParams) {
          requestParams[item.name] = obj[item.name];
        }
      }
    });
    return obj;
  }

  function paramsToObjectUnWithEnable(arr) {
    const obj = {};
    safeArray(arr).forEach(item => {
      if (item && item.name) {
        obj[item.name] = handleValue(item.value, currDomain.global);
        if (requestParams) {
          requestParams[item.name] = obj[item.name];
        }
      }
    });
    return obj;
  }

  let { case_env, path, env, _id } = interfaceRunData;
  let currDomain,
    requestBody,
    requestOptions = {};
  currDomain = handleCurrDomain(env, case_env);
  interfaceRunData.req_params = interfaceRunData.req_params || [];
  interfaceRunData.req_params.forEach(item => {
    let val = handleValue(item.value, currDomain.global);
    if (requestParams) {
      requestParams[item.name] = val;
    }
    path = path.replace(`:${item.name}`, val || `:${item.name}`);
    path = path.replace(`{${item.name}}`, val || `{${item.name}}`);
  });

  const urlObj = URL.parse(joinPath(currDomain.domain, path), true);
  let url;
  if(interfaceRunData.method=='WS'||interfaceRunData.method=='WSS'){
    url = URL.format({
      protocol: urlObj.protocol || 'http',
      host: urlObj.host,
      pathname: urlObj.pathname,
      query: Object.assign(urlObj.query, paramsToObjectWithEnable(interfaceRunData.req_query))
    });
    if(url.indexOf('//')== -1){
      url = url.replace(`:`,`://`)
    }
  }else{
    url = URL.format({
      protocol: urlObj.protocol || 'http',
      host: urlObj.host,
      pathname: urlObj.pathname,
      query: Object.assign(urlObj.query, paramsToObjectWithEnable(interfaceRunData.req_query))
    });
  }
  let headers = paramsToObjectUnWithEnable(interfaceRunData.req_headers);
  requestOptions = {
    url,
    caseId: _id,
    method: interfaceRunData.method,
    headers,
    timeout: 82400000
  };

  // 对 raw 类型的 form 处理
  try {
    if (interfaceRunData.req_body_type === 'raw') {
      if (headers && headers['Content-Type']) {
        if (headers['Content-Type'].indexOf('application/x-www-form-urlencoded') >= 0) {
          interfaceRunData.req_body_type = 'form';
          let reqData = json_parse(interfaceRunData.req_body_other);
          if (reqData && typeof reqData === 'object') {
            interfaceRunData.req_body_form = [];
            Object.keys(reqData).forEach(key => {
              interfaceRunData.req_body_form.push({
                name: key,
                type: 'text',
                value: JSON.stringify(reqData[key]),
                enable: true
              });
            });
          }
        } else if (headers['Content-Type'].indexOf('application/json') >= 0) {
          interfaceRunData.req_body_type = 'json';
        }
      }
    }
  } catch (e) {
    console.error('err', e);
  }

  if (HTTP_METHOD[interfaceRunData.method].request_body) {
    if (interfaceRunData.req_body_type === 'form') {
      requestBody = paramsToObjectWithEnable(
        safeArray(interfaceRunData.req_body_form).filter(item => {
          return item.type == 'text'||item.type == 'list'||item.type == 'file';
        })
      );
    } else if (interfaceRunData.req_body_type === 'json') {
      let reqBody = isJson5(interfaceRunData.req_body_other);
      if (reqBody === false) {
        requestBody = interfaceRunData.req_body_other;
      } else {
        if (requestParams) {
          requestParams = Object.assign(requestParams, reqBody);
        }
        requestBody = handleJson(reqBody, val => handleValue(val, currDomain.global));
      }
    } else {
      requestBody = interfaceRunData.req_body_other;
    }
    requestOptions.data = requestBody;
    if (interfaceRunData.req_body_type === 'form') {
      var f = paramsToObjectWithEnable(
        safeArray(interfaceRunData.req_body_form).filter(item => {
          return item.type == 'file';
        })
      );
      if(JSON.stringify(f)!=='{}'){
        requestOptions.file = 'test-file'
      }
    } 
    if (interfaceRunData.req_body_type === 'file') {
      requestOptions.file = 'test-file';
    }
  }
  return requestOptions;
}

exports.checkRequestBodyIsRaw = checkRequestBodyIsRaw;
exports.handleParams = handleParams;
exports.handleContentType = handleContentType;
exports.crossRequest = crossRequest;
exports.handleCurrDomain = handleCurrDomain;
exports.checkNameIsExistInArray = checkNameIsExistInArray;
exports.getStorage = getStorage;
exports.setGlobalScript = setGlobalScript;
exports.getGlobalScript = getGlobalScript;
exports.setsocket = setsocket;
exports.getsocket = getsocket;
exports.cleansocket = cleansocket;
exports.wsmsg = wsmsg;
exports.saveData=saveData;
exports.getData=getData;
exports.clearData=clearData;