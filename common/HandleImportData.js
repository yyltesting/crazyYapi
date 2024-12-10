const _ = require('underscore');
const axios = require('axios');


const isNode = typeof global == 'object' && global.global === global;
const GenerateSchema = require('generate-schema/src/schemas/json.js');
const { json_parse } = require('./utils.js');
const transformJsonToSchema = json => {
  json = json || {};
  let jsonData = json_parse(json);

  jsonData = GenerateSchema(jsonData);

  let schemaData = JSON.stringify(jsonData);

  return schemaData;
};
async function handle(
  res,
  projectId,
  importType,
  colid,
  envid,
  addHeaders,
  selectCatid,
  menuList,
  basePath,
  dataSync,
  messageError,
  messageSuccess,
  callback,
  token,
  port
) {
  const taskNotice = _.throttle((index, len)=>{
    messageSuccess(`正在导入，已执行任务 ${index+1} 个，共 ${len} 个`)
  }, 3000)
  const handleAddCat = async cats => {
    let catsObj = {};
    if (cats && Array.isArray(cats)) {
      for (let i = 0; i < cats.length; i++) {
        let cat = cats[i];
        let findCat = _.find(menuList, menu => menu.name === cat.name);
        catsObj[cat.name] = cat;
        if (findCat) {
          cat.id = findCat._id;
        } else {
          let apipath = '/api/interface/add_cat';
          if (isNode) {
            apipath = 'http://127.0.0.1:' + port + apipath;
          }

          let data = {
            name: cat.name,
            project_id: projectId,
            desc: cat.desc,
            token
          };
          let result = await axios.post(apipath, data);

          if (result.data.errcode) {
            messageError(result.data.errmsg);
            callback({ showLoading: false });
            return false;
          }
          cat.id = result.data.data._id;
        }
      }
    }
    return catsObj;
  };

  const handleAddInterface = async info => {
    const cats = await handleAddCat(info.cats);
    if (cats === false) {
      return;
    }
    const res = info.apis;
    let len = res.length;
    let count = 0;
    let successNum = len;
    let existNum = 0;
    if (len === 0) {
      messageError(`解析数据为空`);
      callback({ showLoading: false });
      return;
    }
    if(info.basePath){
      let projectApiPath = '/api/project/up';
      if (isNode) {
        projectApiPath = 'http://127.0.0.1:' + port + projectApiPath;
      }

      await axios.post(projectApiPath, {
        id: projectId,
        basepath: info.basePath,
        token
      })
    }
    for (let index = 0; index < res.length; index++) {
      let item = res[index];
      let data = Object.assign(item, {
        project_id: projectId,
        catid: selectCatid
      });
      if (basePath) {
        data.path =
          data.path.indexOf(basePath) === 0 ? data.path.substr(basePath.length) : data.path;
      }
      if (
        data.catname &&
        cats[data.catname] &&
        typeof cats[data.catname] === 'object' &&
        cats[data.catname].id
      ) {
        data.catid = cats[data.catname].id;
      }
      data.token = token;

      if (dataSync !== 'normal') {
        // 开启同步功能
        count++;
        let apipath = '/api/interface/save';
        if (isNode) {
          apipath = 'http://127.0.0.1:' + port + apipath;
        }
        data.dataSync = dataSync;
        let result = await axios.post(apipath, data);
        if (result.data.errcode) {
          successNum--;
          callback({ showLoading: false });
          messageError(result.data.errmsg);
        } else {
          existNum = existNum + result.data.data.length;
        }
      } else {
        // 未开启同步功能
        count++;
        let apipath = '/api/interface/add';
        if (isNode) {
          apipath = 'http://127.0.0.1:' + port + apipath;
        }
        let result = await axios.post(apipath, data);
        if (result.data.errcode) {
          successNum--;
          if (result.data.errcode == 40022) {
            existNum++;
          }
          if (result.data.errcode == 40033) {
            callback({ showLoading: false });
            messageError('没有权限');
            break;
          }
        }
      }
      if (count === len) {
        callback({ showLoading: false });
        messageSuccess(`成功导入接口 ${successNum} 个, 已存在的接口 ${existNum} 个`);
        return;
      }
      taskNotice(index, res.length)
    }
  };
  const handleAddInterfaceSimple = async info => {
    //默认导入到公共分类
    let data = Object.assign(info, {
      project_id: projectId,
      catid: selectCatid
    });
    if (basePath) {
      data.path =
        data.path.indexOf(basePath) === 0 ? data.path.substr(basePath.length) : data.path;
    }

    data.catid = selectCatid;

    // 未开启同步功能
    let apipath = '/api/interface/add';
    if (isNode) {
      apipath = 'http://127.0.0.1:' + port + apipath;
    }
    let result = await axios.post(apipath, data);
    if (result.data.errcode) {
      return false
    }else{
      return result.data.data
    }
    
  
  };
  const handleAddInterfaceCol = async info => {
    let interfaceList;
    const result = await axios.get('/api/interface/list/simple?project_id='+projectId);
    if(result.data.errcode){
      return;
    }else{
      interfaceList = result.data.data;
    }

    let res = info.apis;
    let len = res.length;
    let count = 0;
    let successNum = len;

    if (len === 0) {
      messageError(`解析数据为空`);
      callback({ showLoading: false });
      return;
    }

    for (let index = 0; index < res.length; index++) {
      let item = res[index];
      let headerdata = JSON.parse(JSON.stringify(item.req_headers));
      if(!addHeaders){
        item.req_headers = headerdata.filter(items => items.name.toLowerCase() == 'Content-Type'.toLowerCase());
      }else{
        let addHeaderKey = addHeaders.split(',');
        let headers = [];
        for(let i =0;i<headerdata.length;i++){
          for(let j=0;j<addHeaderKey.length;j++){
            if(headerdata[i].name.toLowerCase() == addHeaderKey[j].toLowerCase()){
              headers.push(headerdata[i]);
            }
          }
        }
        item.req_headers = headers;
      }
      for(let i=0;i< item.req_headers.length;i++){
        if(item.req_headers[i].name.toLowerCase()=='Content-Type'.toLowerCase()){
          item.req_headers[i].name = 'Content-Type';
        }
        if(item.req_headers[i].name.toLowerCase()=='x-token'.toLowerCase()){
          item.req_headers[i].name = 'X-Token';
        }//业务需要
      }
      interfaceList.forEach(interfacedata => {
        if(interfacedata.path == item.path){
          item['interface_id']=interfacedata._id;
        }
      });
      if(!item['interface_id']){
        //需要添加接口
        let interfacedata = JSON.parse(JSON.stringify(item));
        interfacedata.req_body_other = transformJsonToSchema(interfacedata.req_body_other);
        interfacedata.res_body = transformJsonToSchema(interfacedata.res_body);
        let addInterface = await handleAddInterfaceSimple(interfacedata);
        if(!addInterface){
          successNum--;
          continue;
        }
        item['interface_id']=addInterface._id;
      }

      let data = Object.assign(item, {
        project_id: projectId,
        case_env: envid,
        col_id: colid,
        casename: item.path
      });

      if (basePath) {
        data.path =
          data.path.indexOf(basePath) === 0 ? data.path.substr(basePath.length) : data.path;
      }

      count++;
      let apipath = '/api/col/add_case';
      if (isNode) {
        apipath = 'http://127.0.0.1:' + port + apipath;
      }
      let result = await axios.post(apipath, data);
      if (result.data.errcode) {
        successNum--;
        continue;
      }

      if (count === len) {
        callback({ showLoading: false });
        messageSuccess(`成功导入用例 ${successNum} 个`);
        return;
      }
      taskNotice(index, res.length)
    }
  };
  if(importType=='col'){
    return await handleAddInterfaceCol(res);
  }else{
    return await handleAddInterface(res);
  }
}

module.exports = handle;
