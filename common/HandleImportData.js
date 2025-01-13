const _ = require('loadsh');
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
  colImportType,
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
  const handleAddInterfaceColYapi = async info => {
    //获取项目接口集
    let interfaceList=[];
    const result = await axios.get('/api/interface/list/simple?project_id='+projectId);
    if(result.data.errcode){
      return;
    }else{
      if(result.data.data&&result.data.data.length>0){
        result.data.data.forEach(item=>{
          interfaceList.push({path:item.path,_id:item._id});
        })
      }
    }
    let len = info.length;
    let count = 0;
    let failNum = 0;
    let index = 0;
    let colids = 0;
    let oldPreCol = {};
    let newPreCol = {};
    if (len === 0) {
      messageError(`解析数据为空`);
      callback({ showLoading: false });
      return;
    }
    //先遍历集合再遍历接口
    async function traverse(data,pid,projectId,index) {
      const handleColReplaceStr = (str) => {
        let preCols = str.split(',');
        return preCols.reduce((newStr, item) => {
            const replaced = newPreCol[oldPreCol[item]] || '';
            return newStr? `${newStr},${replaced}` : replaced;
        }, '');
      };
      for(let j=0;j<data.length;j++){
        colids++;
        oldPreCol[data[j]._id] = colids;
        let coldata = {
          name :data[j].name,
          case_env :envid,
          parent_id:pid,
          project_id:projectId,
          colpre_script:data[j].colpre_script,
          colafter_script:data[j].colafter_script,
          checkHttpCodeIs200:data[j].checkHttpCodeIs200,
          checkResponseSchema:data[j].checkResponseSchema,
          checkResponseField:data[j].checkResponseField,
          checkScript:data[j].checkScript,
          pre_col:data[j].pre_col? handleColReplaceStr(data[j].pre_col):''
        }
        let result = await axios.post('/api/col/add_col',coldata);
        
        if (result.data.errcode) {
          failNum++;
        }else{
          count++;
          const newCaseList = [];
          const oldCaseObj = {};
          let obj = {};
          newPreCol[colids]=result.data.data._id;
          const handleTypeParams = (data, name) => {
            let res = data[name];
            // res = handleReplaceStr(res);
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
          const handleParams = async data => {
            let haveInterface=false;
            interfaceList.forEach(interfacedata => {
              if(interfacedata.path == data.path){
                data['interface_id']=interfacedata._id;
                haveInterface = true;
              }
            });
            if(!haveInterface){
              //需要添加接口
              let interfacedata = JSON.parse(JSON.stringify(data));
              interfacedata['title']=interfacedata.casename;
              interfacedata['method']='POST';//默认都是post
              interfacedata['req_body_type']='json';
              interfacedata['req_body_is_json_schema']=true;
              interfacedata['res_body_is_json_schema']=true;
              delete interfacedata.interface_id;
              delete interfacedata.casename;
              delete interfacedata.case_env;
              delete interfacedata._id;
              delete interfacedata.add_time;
              delete interfacedata.up_time;
              delete interfacedata.__v;
              delete interfacedata.disable;
              delete interfacedata.testcaseid;
              delete interfaceList.col_id;
              delete interfaceList.uid;
              interfacedata.req_body_other = transformJsonToSchema(interfacedata.req_body_other);
              interfacedata.res_body = transformJsonToSchema(interfacedata.res_body);
              let addInterface = await handleAddInterfaceSimple(interfacedata);
              interfaceList.push({path:interfacedata.path,_id:addInterface._id});
              data['interface_id']=addInterface._id;
            }
            data.col_id = result.data.data._id;
            delete data.uid;
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
          if(data[j].caseList&&data[j].caseList.length>0){
            for (let i = 0; i < data[j].caseList.length; i++) {
              obj = data[j].caseList[i];
              // 将被克隆的id和位置绑定
              oldCaseObj[obj._id] = i;
              let caseData =await handleParams(obj);
              let newCase = await axios.post('/api/col/importcaseone',caseData);
              newCaseList.push(newCase.data.data._id);
            }
          }
        }
        // count++;
        index++;
        // 判断是否有嵌套的 children
        if (data[j].children && data[j].children.length > 0) {
          // 递归遍历 children
          await traverse(data[j].children,result.data.data._id,projectId,index);
        }
            
      }
    }
    if(colid==0){
      await traverse(info,-1,projectId,index);
    }else{
      await traverse(info,colid,projectId,index);
    }
    
    callback({ showLoading: false });
    messageSuccess(`成功导入集合 ${count} 个,出错 ${failNum} 个`);
  }

  if(importType=='col'){
    if(colImportType=='json'){
      return await handleAddInterfaceColYapi(res);
    }else{
      return await handleAddInterfaceCol(res);
    }
  }else{
    return await handleAddInterface(res);
  }
}

module.exports = handle;
