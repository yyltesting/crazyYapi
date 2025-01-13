import React, {PureComponent as Component} from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Collapse,
  Form,
  Icon,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Switch,
  Tabs,
  Tooltip,
  message
} from 'antd';
import ReactFileReader from "react-file-reader";
import constants from '../../constants/variable.js';
import AceEditor from 'client/components/AceEditor/AceEditor';
import _ from 'loadsh';
import {deepCopyJson, isJson, json5_parse} from '../../common.js';
import axios from 'axios';
import ModalPostman from '../ModalPostman/index.js';
import './Postman.scss';
import ProjectEnv from '../../containers/Project/Setting/ProjectEnv/index.js';
import json5 from 'json5';

const { TextArea } = Input;
const FormItem = Form.Item;
const { handleParamsValue, ArrayToObject, schemaValidator } = require('common/utils.js');
const {
  handleParams,
  checkRequestBodyIsRaw,
  handleContentType,
  crossRequest,
  checkNameIsExistInArray,
  setsocket,
  getsocket,
  cleansocket
} = require('common/postmanLib.js');
const createContext = require('common/createContext')

const HTTP_METHOD = constants.HTTP_METHOD;
const InputGroup = Input.Group;
const Option = Select.Option;
const Panel = Collapse.Panel;

export const InsertCodeMap = [
  {
    code: 'storage.getItem()',
    title: '从storage取值'
  },
  {
    code: 'assert.equal(status, 200)',
    title: '断言 httpCode 等于 200'
  },
  {
    code: 'assert.equal(body.code, 0)',
    title: '断言返回数据 code 是 0'
  },
  {
    code: 'assert.notEqual(status, 404)',
    title: '断言 httpCode 不是 404'
  },
  {
    code: 'assert.notEqual(body.code, 40000)',
    title: '断言返回数据 code 不是 40000'
  },
  {
    code: 'assert.deepEqual(body, {"code": 0})',
    title: '断言对象 body 等于 {"code": 0}'
  },
  {
    code: 'assert.notDeepEqual(body, {"code": 0})',
    title: '断言对象 body 不等于 {"code": 0}'
  },
  {
  code: 'utils.',
    title: '使用utils工具函数'
  },
  {
    code: 'storage.getItem(\'LoopSetting\')',
    title: 'storage循环测试判断，Loopnum当前循环次数，LoopSetting循环总次数'
  },
  {
   code: 'var query;\n assert.rejects(\n  mysqlOpt(envid,query),\n  (err)=>{\n   assert.equal(err,"success");\n   return true;\n  });',
    title: 'assert.rejects断言数据库查询值等于(注意必须以异常的形式抛值),query为sql语句.(redis同理)'
  },
  {
   code:'var rsp = JSON.stringify(body.data.item);\nvar response =  records[143].params.title;//需要寻找的值\nassert.notEqual(rsp.indexOf(response) ,-1);',
    title: '典型--从json值中判断是否有需要寻找的数据'
  },
  {
    code:'var articlename = \'test\';\nvar filterList = body.data.item.filter(item => item.name === articlename);\nvar id = filterList[0].id;\nassert.equal(id,2);',
     title: '典型--从数组对象中通过某值匹配找出某值通过name找id'
   },
  {
    code:'var api = utils.axios({\n  method:\'\',\n  url:\'\',\n  headers:{"Cookie":""},\n  data:{}\n});//发起请求\napi.then(function(result) {\n  assert.equal(body.message,result.data.data);\n});',
      title: '发起请求，进行断言'
  }
];

const ParamsNameComponent = props => {
  const { example, desc, name } = props;
  const isNull = !example && !desc;
  const TooltipTitle = () => {
    return (
      <div>
        {example && (
          <div>
            示例：点击可在示例值/用例值间切换
            <div><span className="table-desc">{example}</span></div>
          </div>
        )}
        {desc && (
          <div>
            备注： <span className="table-desc">{desc}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {isNull ? (
        <Input disabled value={name} className="key" />
      ) : (
        <Tooltip placement="topLeft" title={<TooltipTitle />}>
          <Input disabled value={name} className="key" />
        </Tooltip>
      )}
    </div>
  );
};
ParamsNameComponent.propTypes = {
  example: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element
  ]),
  desc: PropTypes.string,
  name: PropTypes.string
};

export default class Run extends Component {
  static propTypes = {
    data: PropTypes.object, //接口原有数据
    save: PropTypes.func, //保存回调方法
    type: PropTypes.string, //enum[case, inter], 判断是在接口页面使用还是在测试集
    projectToken:PropTypes.string,
    curUid: PropTypes.number.isRequired,
    interfaceId: PropTypes.number.isRequired,
    projectId: PropTypes.number.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      method:'',
      preview:false,
      sql:'',
      sqlquery:false,
      resultsql:'',
      disable: false,
      loading: false,
      rediskey:'',
      redisquery:false,
      resultredis:'',
      redisloading: false,
      resStatusCode: null,
      test_valid_msg: null,
      test_script_msg: null,
      resStatusText: '',
      case_env: '',
      mock_verify: false,
      enable_script: false,
      test_script: '',
      case_pre_script: '',
      case_post_script: '',
      hasPlugin: true,
      inputValue: '',
      qrcode:'',
      qr_code:'',
      showQrcode:false,
      cursurPosition: { row: 1, column: -1 },
      envModalVisible: false,
      test_res_header: null,
      test_res_body: null,
      testcaseid :null,
      Connect: false,
      Disconnect: true,
      socketmessage :[],
      ...this.props.data
    };
  }

  checkInterfaceData(data) {
    if (!data || typeof data !== 'object' || !data._id) {
      return false;
    }
    return true;
  }

  // 整合header信息
  handleReqHeader = (value, env) => {
    let index = value
      ? env.findIndex(item => {
          return item._id === value;
        })
      : 0;
    index = index === -1 ? 0 : index;

    let req_header = [].concat(this.props.data.req_headers || []);
    let header = [].concat(env[index].header || []);
    header.forEach(item => {
      if (!checkNameIsExistInArray(item.name, req_header)) {
        //如果两个名字一样也需要加进数组，且以环境header为主
        item = {
          ...item,
          abled: true
        };
        req_header = req_header.filter(obj =>obj.name !== item.name);
        req_header.push(item);
      }
    });
    req_header = req_header.filter(item => {
      return item && typeof item === 'object';
    });
    return req_header;
  };

  selectDomain = value => {
    let headers = this.handleReqHeader(value, this.state.env);
    this.setState({
      case_env: value,
      req_headers: headers
    });
  };

  async initState(data) {
    if (!this.checkInterfaceData(data)) {
      return null;
    }
    const { req_body_other, req_body_type, req_body_is_json_schema ,case_post_script,case_pre_script,tpl_body_other,test_script,testcaseid,method,sql,rediskey} = data;
    let body = req_body_other;
    // 运行时才会进行转换
    if (
      this.props.type === 'inter' &&
      req_body_type === 'json' &&
      req_body_other &&
      req_body_is_json_schema
    ) {
      let schema = {};
      try {
        schema = json5.parse(req_body_other);
      } catch (e) {
        console.log('e', e);
        return;
      }
      let result = await axios.post('/api/interface/schema2json', {
        schema: schema,
        required: true
      });

      body = JSON.stringify(result.data);
    }

    data.case_pre_script= typeof case_pre_script === "undefined"?'':case_pre_script;
    data.case_post_script= typeof case_post_script === "undefined"?'':case_post_script;

    await this.setState(
      {
        ...this.state,
        req_body_other_schema:req_body_other,
        test_res_header: null,
        test_res_body: null,
        ...data,
        case_pre_script:case_pre_script,
        case_post_script:case_post_script,
        req_body_other: body,
        tpl_body_other: tpl_body_other,
        resStatusCode: null,
        test_valid_msg: null,
        test_script_msg:null,
        test_script:test_script,
        testcaseid:testcaseid,
        resStatusText: '',
        body_other: body,
        tpl: false,
        method:method,
        sql: sql,
        rediskey: rediskey
      },
      () => this.props.type === 'inter' && this.initEnvState(data.case_env, data.env)
    );
    let options = handleParams(this.state, this.handleValue);
    //遍历weocket对象数组
    let s =getsocket();
    let ws;
    for(let i=0;i<s.length;i++){
      if(s[i].url==options.url){
        ws = s[i]
      }
    }
    if(ws&&ws.readyState==WebSocket.OPEN){
      this.setState({
        Connect: true,
        Disconnect: false
      });
      //接受消息，获取当前状态。可以一直监听
      // let message = [];
      // await new Promise((resolve) => {
      //   ws.onmessage = (e) =>{
      //     console.log('socket消息',e);
      //     message.push(e.data);
      //     this.setState({
      //       socketmessage : message
      //     })
      //     resolve(message);
      //   };
      // })
    }else{
      this.setState({
        Connect: false,
        Disconnect: true
      });
    }
  }

  initEnvState(case_env, env) {
    let headers = this.handleReqHeader(case_env, env);

    this.setState(
      {
        req_headers: headers,
        env: env
      },
      () => {
        let s = !_.find(env, item => item._id === this.state.case_env);
        if (!this.state.case_env || s) {
          this.setState({
            case_env: this.state.env[0]._id
          });
        }
      }
    );
  }

   componentWillMount() {

    this.initState(this.props.data);

  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    clearInterval(this._crossRequestInterval);
  }

  //props发生变化时执行
  async componentWillReceiveProps(nextProps) {
    if (this.checkInterfaceData(nextProps.data) && this.checkInterfaceData(this.props.data)) {
      if (nextProps.data._id !== this.props.data._id) {
        await this.initState(nextProps.data);
      } else if (nextProps.data.interface_up_time !== this.props.data.interface_up_time) {
        await this.initState(nextProps.data);
      }
      //  else if (nextProps.data.up_time !== this.props.data.up_time) {
      //   this.initState(nextProps.data);
      // }
      if (nextProps.data.env !== this.props.data.env) {
        this.initEnvState(this.state.case_env, nextProps.data.env);
      }
    }
  }

  handleValue(val, global) {
    let globalValue = ArrayToObject(global);
    return handleParamsValue(val, {
      global: globalValue
    });
  }

  handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault(); // 阻止默认的保存行为
      this.props.save();
      // 在这里执行你想要的操作
    }
  }
  onOpenTest = d => {
    this.setState({
      test_script: d.text
    });
  };


  handleInsertCode = code => {
    this.aceEditor.editor.insertCode(code);
  };

  handleRequestBody = d => {
    this.setState({
      req_body_other: d.text
    });
  };

  relationcase = e =>{
    // {value} = {value}-0;
    // console.log(e.target.value);
    if(isNaN(e.target.value-0))
    {
      message.error("请输入数字");
    }else if(e.target.value-0>0){
      this.setState({
        testcaseid: e.target.value-0
      })
    }else{
      this.setState({
        testcaseid: null
      })
    }
  };
  changePath = v =>{
    this.setState({path:v})
  }
  savesql = e =>{
    this.setState({
      sql:e.target.value
    })
  };
  runMysql = async () =>{
    this.setState({ loading: true});
    try{
      let result = await axios.post('/api/utils/mysql', {
        query: this.state.sql,
        envid: this.state.case_env
      });
      this.setState({ sqlquery: true,loading: false,resultsql: JSON.stringify(result.data.data)});
    }catch(err){
      this.setState({ sqlquery: true,loading: false,resultsql: '数据库查询出错，请检查sql语句' });
    }
  };
  closesqlquery=()=>{
    this.setState({ sqlquery: false});
  }
  saveredis = e =>{
    this.setState({
      rediskey:e.target.value
    })
  };
  runRedis = async () =>{
    this.setState({ redisloading: true});
    try{
      let result = await axios.post('/api/utils/redis', {
        query: this.state.rediskey,
        envid: this.state.case_env,
        type: 'get'
      });
      this.setState({ redisquery: true,redisloading: false,resultredis: JSON.stringify(result.data.data)});
    }catch(err){
      this.setState({ redisquery: true,redisloading: false,resultredis: 'Redis查询出错，请检查rediskey' });
    }
  };
  closeredisquery=()=>{
    this.setState({ redisquery: false});
  }
  closeQrcode=()=>{
    this.setState({showQrcode:false})
  }
  openpreview=()=>{
    this.setState({ preview: true})
  }
  closepreview=()=>{
    this.setState({ preview: false});
  }
  reqRealInterface = async () => {
    const {pre_script,after_script,case_pre_script,case_post_script}=this.state;
    if (this.state.loading === true) {
      this.setState({
        loading: false
      });
      return null;
    }
    this.setState({
      loading: true
    });
    console.log('this.state,',this.state);
    let options = handleParams(this.state, this.handleValue),
      result;

    try {
      options.taskId = this.props.curUid;
      console.log('options',options);
      //遍历weocket对象数组
      let s = getsocket();
      let ws;
      for(let i=0;i<s.length;i++){
        if(s[i].url==options.url){
          ws = s[i]
        }
      }
      result = await crossRequest(options, pre_script, after_script,case_pre_script,case_post_script,'','',ws,createContext(
        this.props.curUid,
        this.props.projectId,
        this.props.interfaceId
      ));
      result = {
        header: result.res.header,
        body: result.res.body,
        status: result.res.status,
        statusText: result.res.statusText,
        runTime: result.runTime
      };
    } catch (data) {
      result = {
        header: data.header,
        body: data.body,
        status: null,
        statusText: data.message
      };
    }
    if (this.state.loading === true) {
      this.setState({
        loading: false
      });
    } else {
      return null;
    }

    let tempJson = result.body;
    if (tempJson && typeof tempJson === 'object') {
      result.body = JSON.stringify(tempJson, null, '  ');
      this.setState({
        res_body_type: 'json'
      });
    } else if (isJson(result.body)) {
      this.setState({
        res_body_type: 'json'
      });
    }

    // 对 返回值数据结构 和定义的 返回数据结构 进行 格式校验
    let validResult = this.resBodyValidator(this.props.data, result.body);
    if (!validResult.valid) {
      this.setState({ test_valid_msg: `返回参数 ${validResult.message}` });
    } else {
      this.setState({ test_valid_msg: '' });
    }
    // var socketmessage = [];
    // socketmessage.push(result.body);
    this.setState({
      resStatusCode: result.status,
      resStatusText: result.statusText,
      test_res_header: result.header,
      test_res_body: result.body
      // socketmessage: socketmessage
    });
  };

  // reqRealInterfaceinserver = async () => {
  //   const {pre_script,after_script}=this.state;
  //
  //   let curitem = Object.assign(
  //     {},
  //     {caseitme:this.state},
  //     {
  //       pre_script: pre_script,
  //       after_script: after_script
  //     },
  //     {
  //       token: this.props.projectToken,
  //       taskId: this.props.curUid
  //     }
  //   );
  //
  //   curitem.caseitme.taskId = this.props.curUid;
  //     console.log({"用例请求数据":curitem});
  //    let result = await axios.post('/api/open/run_case', {params:curitem});
  //     result=result.data.data;
  //
  //   console.log({"用例执行结果数据":result});
  //
  //   if (this.state.loading === true) {
  //     this.setState({
  //       loading: false
  //     });
  //     return null;
  //   }
  //   this.setState({
  //     loading: true
  //   });
  //
  //
  //
  //   if (this.state.loading === true) {
  //     this.setState({
  //       loading: false
  //     });
  //   } else {
  //     return null;
  //   }
  //
  //   let tempJson = result.res_body;
  //   if (tempJson && typeof tempJson === 'object') {
  //     result.res_body = JSON.stringify(tempJson, null, '  ');
  //     this.setState({
  //       res_body_type: 'json'
  //     });
  //   } else if (isJson(result.res_body)) {
  //     this.setState({
  //       res_body_type: 'json'
  //     });
  //   }
  //
  //   // 对 返回值数据结构 和定义的 返回数据结构 进行 格式校验
  //   let validResult = this.resBodyValidator(this.props.data, result.res_body);
  //   if (!validResult.valid) {
  //     this.setState({ test_valid_msg: `返回参数 ${validResult.message}` });
  //   } else {
  //     this.setState({ test_valid_msg: '' });
  //   }
  //
  //   let validRes=result.validRes;
  //   if (validRes.length>1) {
  //     this.setState({ test_script_msg: JSON.stringify(validRes,null,2) });
  //   } else {
  //     this.setState({ test_script_msg: '' });
  //   }
  //
  //   this.setState({
  //     resStatusCode: result.status,
  //     resStatusText: result.statusText,
  //     test_res_header: result.res_header,
  //     test_res_body: result.res_body
  //   });
  // };


  connect =()=>{
    console.log(this.state);
    let options = handleParams(this.state, this.handleValue);
    console.log(options);
    let s;
    //客户端websocket连接逻辑
    try {
      // var opts = { reconnection: false, transports: ['websocket'], extraHeaders: { 'Origin': 'http://coolaf.com' } };
      //打开一个web socket连接
      s = new WebSocket(
        options.url
      );
      //onopen时客户端与服务端建立连接后触发
      s.onopen = () => {
        this.WebSocket = s;
        // //使用send方法发送数据，连接时发送
        // this.WebSocket.send("我是客户端");
        message.success('websocket 连接成功');
        // window.localStorage.setItem(options.url, 'true');
        setsocket(this.WebSocket);
        this.setState({
          Connect : true,
          Disconnect : false
        })
      };
      
      //接受消息，获取当前状态。可以一直监听
      // s.onmessage = e => {
      //   // message.success(e.data);
      //   this.setState({
      //     test_res_body : e.data
      //   })
      // };

      s.onerror = () => {
        message.error('websocket 连接失败');
      };

    } catch (e) {
      message.error('websocket 连接失败');
      // localStorage.removeItem(options.url);
      // this.setState({
      //   Connect : false,
      //   Disconnect : true
      // })
    }
  }
  disconnect =()=>{
    let options = handleParams(this.state, this.handleValue);
    try{
      //遍历weocket对象数组
      let s = getsocket();
      let ws;
      for(let i=0;i<s.length;i++){
        if(s[i].url==options.url){
          ws = s[i]
          //获取状态
          console.log('s.readyState',ws.readyState);
          if(ws){
            //关闭连接
            // localStorage.removeItem(options.url);
            ws.close();
            cleansocket(i);
            this.setState({
              Connect : false,
              Disconnect : true
            })
            message.success('websocket 连接已断开');
          }
        }
      }
    }catch(e){
      message.error(e);
    }
  }
  // getmessage = ()=>{
  //   let options = handleParams(this.state, this.handleValue);
  //   try{
  //     //遍历weocket对象数组
  //     let s = getsocket();
  //     let ws;
  //     for(let i=0;i<s.length;i++){
  //       if(s[i].url==options.url){
  //         ws = s[i]
  //         //获取状态
  //         console.log('s.readyState',ws.readyState);
  //         if(ws){
  //           //接受消息，获取当前状态。可以一直监听
  //           ws.onmessage = e => {
  //             var messages = this.state.socketmessage
  //             messages.push(e.data);
  //             console.log('messages',messages);
  //             this.setState({
  //               socketmessage : messages,
  //               test_res_body : e.data
  //             })
  //           };
  //         }
  //       }
  //     }
  //   }catch(e){
  //     message.error(e);
  //   }
  // }

  // 返回数据与定义数据的比较判断
  resBodyValidator = (interfaceData, test_res_body) => {
    const { res_body_type, res_body_is_json_schema, res_body } = interfaceData;
    let validResult = { valid: true };

    if (res_body_type === 'json' && res_body_is_json_schema) {
      const schema = json5_parse(res_body);
      const params = json5_parse(test_res_body);
      validResult = schemaValidator(schema, params);
    }

    return validResult;
  };

  scriptexp =(type)=>{
    let ps = this.state.case_pre_script;
    let scriptexp;
    if(type=='delayed'){
      scriptexp ="context.promise = new Promise(function(resolve) { \n    setTimeout(function() { \n        console.log('delay 3000ms'); \n        resolve('ok'); \n    }, 3000); \n });";
    }else if(type=='redis'){
      scriptexp = "var key='rediskey';\ncontext.promise = new Promise(function(resolve) {\n  var api =context.utils.axios({\n    method: 'post',\n    url: '/api/utils/redis',\n    data: {\n    query: key,\n    envid: 'redis环境id',\n    type:'get',\n    token:'openAPI token'\n  }\n});\napi.then(function(result) {\n if(result.data.data){\n   storage.setItem('value',result.data.data.code);\n }\n console.log('打印result',result);\n resolve();\n });\n});";
    }else if(type=='mysql'){
      scriptexp = "var sql='sql语句;';\ncontext.promise = new Promise(function(resolve) {\n  var api =context.utils.axios({\n    method: 'post',\n    url: '/api/utils/mysql',\n    data: {\n    query: sql,\n    envid: 'mysql环境id',\n    token:'openAPI token'\n  }\n});\napi.then(function(result) {\n if(result.data.data){\n   storage.setItem('value',result.data.data);\n }\n console.log('打印result',result);\n resolve();\n });\n});";
    }else if(type=='delayjudgment'){
      scriptexp = "context.promise = new Promise(function(resolve) { \r\n    let timer = setTimeout(function() { \r\n        console.log('delay 10000ms'); \r\n        resolve('ok'); \r\n    }, 10000);\r\n    // 获取当前时间的秒级时间戳\r\n    const currentTimeStamp = Math.floor(Date.now() / 1000);\r\n    // 计算三秒后时间\r\n    const backwardTimeStamp = currentTimeStamp + 3;\r\n    // 在这里添加你的条件判断\r\n    let i = 1;\r\n    //延时函数每次调用\r\n    function delay(ms) {\r\n      return new Promise(resolve => setTimeout(resolve, ms));\r\n    }\r\n\r\n    async function delayedLoop(i) {\r\n      while(true){\r\n        console.log(i);\r\n        await delay(1000);\r\n        //这里可以判断取第三方接口信息\r\n        if(Math.floor(Date.now() / 1000)==backwardTimeStamp){\r\n            clearTimeout(timer); // 如果满足条件，就清除定时器\r\n            console.log(1111);\r\n            resolve('ok'); \r\n            break;\r\n        }\r\n        //以防万一没判断到，退出循环\r\n        if(i==15){\r\n            resolve('ok'); \r\n            break;\r\n        }\r\n        i++;\r\n      }\r\n    }\r\n    delayedLoop(i);\r\n\r\n });";
    }else if(type=='ethsign'){
      scriptexp = "context.promise = new Promise(function(resolve) {\r\n  var str = context.requestBody.sign_str;\r\n  var api = context.utils.ethsign(str);\r\n  api.then(function(result) {\r\n    //...\r\n    console.log(result);\r\n    context.requestBody.sign_str=result;\r\n    resolve();\r\n  });\r\n});";
    }else if(type=='timeoutlimit'){
      scriptexp = "var timeoutLimit = '6000';//在脚本中无实际意义且固定格式，用于判断接口超时处理。优先级用例>集合>工程";
    }else if(type=='es'){
      scriptexp = `var str={\n  "from": 0,\n  "size": 100,\n  "query":{\n  "bool": {\n    "must": [\n      {\n      "match": {\n          "name":"16"\n        }\n     }\n\n    ]\n  }\n}\n};\ncontext.promise = new Promise(function(resolve) {\n  var api =context.utils.axios({\n    method: 'post',\n    url: '/api/utils/es',\n    data: {\n    body: str,\n    index:'haboxufile',\n    envid: '6412d1fde1882d57ccef0908',\n  }\n});\napi.then(function(result) {\n console.log('打印result',result);\n resolve();\n });\n});`;
    }

    if(ps){
      ps = ps+"\n"+scriptexp;
    }else{
      ps = scriptexp;
    }
    
    this.setState({
      case_pre_script : ps
    })
  }
  // 模态框的相关操作
  showModal = (val, index, type) => {
    let inputValue = '';
    let cursurPosition;
    if (type === 'req_body_other') {
      // req_body
      let editor = this.aceEditor.editor.editor;
      cursurPosition = editor.session.doc.positionToIndex(editor.selection.getCursor());
      // 获取选中的数据
      inputValue = this.getInstallValue(val || '', cursurPosition).val;
    } else {
      // 其他input 输入
      let oTxt1 = document.getElementById(`${type}_${index}`);
      cursurPosition = oTxt1.selectionStart;
      inputValue = this.getInstallValue(val || '', cursurPosition).val;
      // cursurPosition = {row: 1, column: position}
    }

    this.setState({
      modalVisible: true,
      inputIndex: index,
      inputValue,
      cursurPosition,
      modalType: type
    });
  };

  // 点击插入
  handleModalOk = val => {
    const { inputIndex, modalType } = this.state;
    if (modalType === 'req_body_other') {
      this.changeInstallBody(modalType, val);
    } else {
      this.changeInstallParam(modalType, val, inputIndex);
    }

    this.setState({ modalVisible: false });
  };

  // 根据鼠标位置往req_body中动态插入数据
  changeInstallBody = (type, value) => {
    const pathParam = deepCopyJson(this.state[type]);
    // console.log(pathParam)
    let oldValue = pathParam || '';
    let newValue = this.getInstallValue(oldValue, this.state.cursurPosition);
    let left = newValue.left;
    let right = newValue.right;
    this.setState({
      [type]: `${left}${value}${right}`
    });
  };

  // 获取截取的字符串
  getInstallValue = (oldValue, cursurPosition) => {
    let left = oldValue.substr(0, cursurPosition);
    let right = oldValue.substr(cursurPosition);

    let leftPostion = left.lastIndexOf('{{');
    let leftPostion2 = left.lastIndexOf('}}');
    let rightPostion = right.indexOf('}}');
    // console.log(leftPostion, leftPostion2,rightPostion, rightPostion2);
    let val = '';
    // 需要切除原来的变量
    if (leftPostion !== -1 && rightPostion !== -1 && leftPostion > leftPostion2) {
      left = left.substr(0, leftPostion);
      right = right.substr(rightPostion + 2);
      val = oldValue.substring(leftPostion, cursurPosition + rightPostion + 2);
    }
    return {
      left,
      right,
      val
    };
  };

  // 根据鼠标位置动态插入数据
  changeInstallParam = (name, v, index, key) => {
    key = key || 'value';
    const pathParam = deepCopyJson(this.state[name]);
    let oldValue = pathParam[index][key] || '';
    let newValue = this.getInstallValue(oldValue, this.state.cursurPosition);
    let left = newValue.left;
    let right = newValue.right;
    pathParam[index][key] = `${left}${v}${right}`;
    this.setState({
      [name]: pathParam
    });
  };

  // 取消参数插入
  handleModalCancel = () => {
    this.setState({ modalVisible: false, cursurPosition: -1 });
  };

  // 环境变量模态框相关操作
  showEnvModal = () => {
    this.setState({
      envModalVisible: true
    });
  };

  handleEnvOk = (newEnv, index) => {
    this.setState({
      envModalVisible: false,
      case_env: newEnv[index]._id
    });
  };

  disablecase = () => {
    this.setState({
      disable: true
    });
  };
  enablecase = () => {
    this.setState({
      disable: false
    });
  };
  handleEnvCancel = () => {
    this.setState({
      envModalVisible: false
    });
  };
  changeParam = (name, v, index, key) => {

    key = key || 'value';
    const pathParam = deepCopyJson(this.state[name]);
    pathParam[index][key] = v;
    pathParam[index].isexampler=v===pathParam[index].example;
    if (key === 'value') {
      pathParam[index].enable = !!v;
    }
    this.setState({
      [name]: pathParam
    });
  };

  swichitemvalue=item=>{
    //console.log({item});
    item.tempValue=item.value===item.example?item.tempValue:item.value;
    item.isexampler=item.isexampler?false:true;
    if(item.value!==item.example){
      item.value = item.example;
    }else{
      item.value = item.tempValue;
    }
  }

  isexampler = () => {
    const req_params = deepCopyJson(this.state.req_params);
    const req_query = deepCopyJson(this.state.req_query);
    // const req_headers = deepCopyJson(this.state.req_headers);
    const bodyForm = deepCopyJson(this.state.req_body_form);
    const tpl_body_other = this.state.tpl_body_other;
    const body_other = this.state.body_other;
    let req_body_other = this.state.req_body_other;
    let tpl = this.state.tpl;

    //   console.log({pathParam,name, v, index, key});
    for(let i=0;i<req_params.length;i++){
      this.swichitemvalue(req_params[i]);
    }
    for(let i=0;i<req_query.length;i++){
      this.swichitemvalue(req_query[i]);
    }
    //header本身有参数值，参数全量切换，不需要切换header的示例值
    // for(let i=0;i<req_headers.length;i++){
    //   this.swichitemvalue(req_headers[i]);
    // }
    for(let i=0;i<bodyForm.length;i++){
      this.swichitemvalue(bodyForm[i]);
    }
    //新增切换参数json类型
    if(tpl){
      req_body_other = body_other;
      this.setState({
        tpl:false
      });
    }else{
      req_body_other = tpl_body_other;
      this.setState({
        tpl:true
      });
    }
    this.setState({
      req_params : req_params,
      req_query:req_query,
      // req_headers:req_headers,
      req_body_form:bodyForm,
      req_body_other:req_body_other
    });
  };

  changeBody = async(v, index, key) => {
    const bodyForm = deepCopyJson(this.state.req_body_form);
    key = key || 'value';
    bodyForm[index].isexampler=v===bodyForm[index].example;
    if (key === 'value') {
      bodyForm[index].enable = !!v;
      if (bodyForm[index].type === 'file') {
        var filebase64 = await this.uploadFile64(v.files[index]);//转baes54
        // var fileblob=this.dataURLtoBlob(filebase64);//转blob
        // var blob= await this.uploadFile(fileblob);//转文本输出
        bodyForm[index].value = filebase64;//'file_'+index;
      } else {
        bodyForm[index].value = v;
      }
    } else if (key === 'enable') {
      bodyForm[index].enable = v;
    }
    this.setState({ req_body_form: bodyForm });
  };
  //base64转二进制流
  dataURLtoBlob=(base64Data)=> {
    // console.log(base64Data, 'base64Data'); // data:image/png;base64,
    var byteString;
    if (base64Data.split(',')[0].indexOf('base64') >= 0) byteString = Buffer.from(base64Data.split(',')[1], 'base64').toString('binary');
    // base64 解码
    else {
      byteString = decodeURIComponent(base64Data.split(',')[1])
    }
    var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0]; // mime类型 -- image/png
    var ia = new Uint8Array(byteString.length); // 创建视图
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    var blob = new Blob([ia], {
      type: mimeString
    });
    console.log(blob, '二进制');
    return blob
  }
  //读取二进制流
  uploadFile(file) {    
    return new Promise(function(resolve) {    
    let reader = new FileReader()//读取文件实例
    reader.readAsText(file)//原文打印
    reader.onload = function() {
      resolve(this.result)
    }
  })}
  //读取base64
  uploadFile64(file) {    
    return new Promise(function(resolve) {    
    let reader = new FileReader()//读取文件实例
    reader.readAsDataURL(file)//原文打印
    reader.onload = function() {
      resolve(this.result)
    }
  })}
  //返回二进制字符串
  uploadFileblob(file) {    
    return new Promise(function(resolve) {    
    let reader = new FileReader()//读取文件实例
    reader.readAsBinaryString(file)//原文打印
    reader.onload = function() {
      resolve(this.result)
    }
  })}
  //通过other方式上传二进制流文件
  loadonChange=async(files)=>{
    console.log(files.fileList[0].name);
    var filebase= files.base64;//转base64
    this.setState({ req_body_other:  filebase});//传参
  }

  //二维码地址转换
  inputQrvalue=(e)=>{
    this.setState({qr_code:e.target.value})
  }
  qrcodeCreate=async ()=>{
    if(this.state.qr_code == ''){
      message.error('请输入二维码地址')
      return
    }
    try{
      let params = {
        url: this.state.qr_code
      };
      let result = await axios.post('/api/interface/getQrcode', params);
      result = result.data.data;
      // const myQRCode = await QRCode.toDataURL(this.state.qr_code)
      this.setState({showQrcode:true,qrcode:result})
    }catch(e){
      message.error(e)
    }
   
  }
  changetv = (item,name, index, key) => {
    item.tempValue=item.value===item.example?item.tempValue:item.value;
    item.isexampler=item.isexampler?false:true;
    if(item.value!==item.example){
      name==='req_body_form'?this.changeBody(item.example, index, key):this.changeParam(name,item.example,index,key);
    }else{
      name==='req_body_form'?this.changeBody(item.tempValue, index, key):this.changeParam(name,item.tempValue,index,key);
    }
  };

  content = (item, name, index, key) => {
    return (
      <div >
        <Icon type="swap" style={{ color: item.isexampler?'rgba(255, 0, 0,0.7)':'rgba(0, 0, 0,0.7)'}} onClick={e => {
          e.stopPropagation();
          this.changetv(item,name, index, key);
        }} />
        {' '+ item.example}
      </div>
    )
  };

    prefix=(item, name, index)=>{
     //console.log({item})
      return (
        <Icon type="swap" style={{ color: item.isexampler?'rgba(255, 0, 0,0.7)':'rgba(0, 0, 0,0.7)'}}
              onClick={e => {
                e.stopPropagation();
                this.changetv(item,name, index);
              }}/>
      )
    }

  render() {
    const {
      method,
      env,
      path,
      req_params = [],
      req_headers = [],
      req_query = [],
      req_body_type,
      req_body_form = [],
      loading,
      case_env,
      inputValue,
      hasPlugin,
      case_pre_script,
      case_post_script
    } = this.state;
    return (
      <div className="interface-test postman">
        {this.state.modalVisible && (
          <ModalPostman
            visible={this.state.modalVisible}
            handleCancel={this.handleModalCancel}
            handleOk={this.handleModalOk}
            inputValue={inputValue}
            envType={this.props.type}
            id={+this.state._id}
            col_id={this.props.data.col_id}
          />
        )}

        {this.state.envModalVisible && (
          <Modal
            title="环境设置"
            visible={this.state.envModalVisible}
            onOk={this.handleEnvOk}
            onCancel={this.handleEnvCancel}
            footer={null}
            width={800}
            className="env-modal"
          >
            <ProjectEnv projectId={this.props.data.project_id} onOk={this.handleEnvOk}/>
          </Modal>
        )}

        {/* {this.props.type === 'case' ? (
          <div className="case-relation">
            <Row className="setting-case-relation">
              <Tooltip title='用例关联key'>
                <Input  onChange={e=>this.relationcase(e.target.value)} value={this.state.testcaseid} placeholder="关联测试用例key" style={{ width: 100 ,marginLeft: '25px'}}/>
              </Tooltip>
            </Row>
          </div>
        ):null} */}

        <div className="url">
          <InputGroup compact style={{ display: 'flex' , marginLeft: 5}}>
            <Select disabled value={method} style={{ flexBasis: 60 }}>
              {Object.keys(HTTP_METHOD).map(name => {
                <Option value={name.toUpperCase()}>{name.toUpperCase()}</Option>;
              })}
            </Select>
            <Select
              value={case_env}
              style={{ width: 180, flexGrow: 1 }}
              onSelect={this.selectDomain}
            >
              {env.map((item, index) => (
                <Option value={item._id} key={index}>
                  {item.name + '：' + item.domain}
                </Option>
              ))}
              <Option value="环境配置" disabled style={{ cursor: 'pointer', color: '#2395f1'}}>
                <Button type="primary" onClick={this.showEnvModal}>
                  环境配置
                </Button>
              </Option>
            </Select>

            <Input
              value={path}
              onChange={e => this.changePath( e.target.value)}
              spellCheck="false"
              style={{ width: 180, flexGrow: 1 }}
            />
          </InputGroup>

          <Tooltip
            placement="bottom"
            title='示例数据和参数值间切换'
          >
            <Button
              onClick={this.isexampler}
              type="primary"
              style={{ marginLeft: 10 }}

            >
              切换参数
            </Button>
          </Tooltip>

          {this.state.method=='WS'||this.state.method=='WSS'?(
            <Tooltip
            placement="bottom"
            title='连接 websocket'
          >
              <Button
              onClick={this.connect}
              type="primary"
              style={{ marginLeft: 10 }}
              disabled = {this.state.Connect}
              >
                Connect
              </Button>
            </Tooltip>
          ):null}

          {this.state.method=='WS'||this.state.method=='WSS'?(
            <Tooltip
            placement="bottom"
            title='断开 websocket'
          >
              <Button
                onClick={this.disconnect}
                type="primary"
                style={{ marginLeft: 10 }}
                disabled = {this.state.Disconnect}
              >
                Disconnect
              </Button>
            </Tooltip>
          ):null}

          {this.state.Connect==true?(
            <Button
            disabled={!hasPlugin}
            onClick={this.reqRealInterface}
            type="primary"
            style={{ marginLeft: 10 }}
            icon={loading ? 'loading' : ''}
          >
              {loading ? '取消' : '发送Message'}
            </Button>):null}
          
          {this.state.method=='WS'||this.state.method=='WSS'?null:(
            <Tooltip
                placement="bottom"
                title={(() => {
                  if (hasPlugin) {
                    return '发送请求';
                  } else {
                    return '请安装 cross-request 插件';
                  }
                })()}
            >
              <Button
                disabled={!hasPlugin}
                onClick={this.reqRealInterface}
                type="primary"
                style={{ marginLeft: 10 }}
                icon={loading ? 'loading' : ''}
              >
                {loading ? '取消' : '发送'}
              </Button>
            </Tooltip>
          )}

          <Tooltip
            placement="bottom"
            title={() => {
              return this.props.type === 'inter' ? '保存到测试集' : '更新该用例';
            }}
          >
            <Button onClick={this.props.save} type="primary" style={{ marginLeft: 10 }}>
              {this.props.type === 'inter' ? '保存' : '更新'}
            </Button>
          </Tooltip>

        </div>
        {this.props.type === 'case' ? (
          <div className="case-setting">
            <Row className="setting-case">
              <Col className="setting-case" span={4} style={{ width: '10%'}}>
                <label>是否禁用用例:&nbsp;<Tooltip title={'更新后禁用该用例'} >
                  <Icon type="question-circle-o" style={{ width: '10px'}} />
                </Tooltip></label>
              </Col>
              <Col className="setting-case"  span={18}>
                <Switch onChange={e=>{
                  let {disable} = this.state.disable;
                    this.setState({
                      ...disable,
                      disable: e
                    })
                }} checked={this.state.disable}  checkedChildren="禁" unCheckedChildren="启" />
              </Col>
            </Row>
          </div>
        ):null}

        {this.props.type === 'case' ? (
          <div className="case-setting">
            <Row className="setting-case-relation">
              <Col className="setting-case-relation" span={4} style={{ width: '10%'}}>
                <label>关联用例库KEY:&nbsp;<Tooltip title={'更新后关联该用例'} >
                  <Icon type="question-circle-o" style={{ width: '10px'}} />
                </Tooltip></label>
              </Col>
              <Col className="setting-case-relation"  span={18}>
                <Input  
                  onChange={this.relationcase} 
                  value={this.state.testcaseid} 
                  placeholder="关联测试用例key" 
                  style={{ width: 100 }}/>
              </Col>
            </Row>
          </div>
        ):null}
        
        <Collapse defaultActiveKey={['0', '1', '2', '3']} bordered={true}>
          <Panel
            header="PATH PARAMETERS"
            key="0"
            className={req_params.length === 0 ? 'hidden' : ''}
          >
            {req_params.map((item, index) => {
              return (
                <div key={index} className="key-value-wrap">
                  {/* <Tooltip
                    placement="topLeft"
                    title={<TooltipContent example={item.example} desc={item.desc} />}
                  >
                    <Input disabled value={item.name} className="key" />
                  </Tooltip> */}
                  <ParamsNameComponent example={this.content(item, 'req_params',index)} desc={item.desc} name={item.name}/>
                  <span className="eq-symbol">=</span>
                  <Input
                    value={item.isexampler?item.example:item.value}
                    prefix={this.prefix(item, 'req_params',index)}
                    className="value"
                    onChange={e => this.changeParam('req_params', e.target.value, index)}
                    placeholder="参数值"
                    id={`req_params_${index}`}
                    addonAfter={
                      <Icon
                        type="edit"
                        onClick={() => this.showModal(item.value, index, 'req_params')}
                      />
                    }
                  />

                </div>
              );
            })}
            <Button
              style={{ display: 'none' }}
              type="primary"
              icon="plus"
              onClick={this.addPathParam}
            >
              添加Path参数
            </Button>
          </Panel>
          <Panel
            header="QUERY PARAMETERS"
            key="1"
            className={req_query.length === 0 ? 'hidden' : ''}
          >
            {req_query.map((item, index) => {
              return (
                <div key={index} className="key-value-wrap">
                  {/* <Tooltip
                    placement="topLeft"
                    title={<TooltipContent example={item.example} desc={item.desc} />}
                  >
                    <Input disabled value={item.name} className="key" />
                  </Tooltip> */}
                  <ParamsNameComponent example={this.content(item, 'req_query',index)} desc={item.desc} name={item.name} />
                  &nbsp;
                  {item.required == 1 ? (
                    <Checkbox className="params-enable" checked={true} disabled />
                  ) : (
                    <Checkbox
                      className="params-enable"
                      checked={item.enable}
                      onChange={e =>
                        this.changeParam('req_query', e.target.checked, index, 'enable')
                      }
                    />
                  )}
                  <span className="eq-symbol">=</span>
                  <Input
                    value={item.isexampler?item.example:item.value}
                    prefix={this.prefix(item, 'req_query',index)}
                    className="value"
                    onChange={e => this.changeParam('req_query', e.target.value, index)}
                    placeholder="参数值"
                    id={`req_query_${index}`}
                    addonAfter={
                      <Icon
                        type="edit"
                        onClick={() => this.showModal(item.value, index, 'req_query')}
                      />
                    }
                  />
                </div>
              );
            })}
            <Button style={{ display: 'none' }} type="primary" icon="plus" onClick={this.addQuery}>
              添加Query参数
            </Button>
          </Panel>
          <Panel header="HEADERS" key="2" className={req_headers.length === 0 ? 'hidden' : ''}>
            {req_headers.map((item, index) => {
              return (
                <div key={index} className="key-value-wrap">
                  {/* <Tooltip
                    placement="topLeft"
                    title={<TooltipContent example={item.example} desc={item.desc} />}
                  >
                    <Input disabled value={item.name} className="key" />
                  </Tooltip> */}
                  <ParamsNameComponent example={this.content(item, 'req_headers',index)} desc={item.desc} name={item.name} />
                  <span className="eq-symbol">=</span>
                  <Input
                    value={item.isexampler?item.example:item.value}
                    prefix={this.prefix(item, 'req_headers',index)}
                    disabled={!!item.abled}
                    className="value"
                    onChange={e => this.changeParam('req_headers', e.target.value, index)}
                    placeholder="参数值"
                    id={`req_headers_${index}`}
                    addonAfter={
                      !item.abled && (
                        <Icon
                          type="edit"
                          onClick={() => this.showModal(item.value, index, 'req_headers')}
                        />
                      )
                    }
                  />
                </div>
              );
            })}
            <Button style={{ display: 'none' }} type="primary" icon="plus" onClick={this.addHeader}>
              添加Header
            </Button>
          </Panel>
          <Panel
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Tooltip title="F9 全屏编辑">BODY(F9)</Tooltip>
              </div>
            }
            key="3"
            className={
              HTTP_METHOD[method].request_body &&
              ((req_body_type === 'form' && req_body_form.length > 0) || req_body_type !== 'form')
                ? 'POST'
                : 'hidden'
            }
          >
            <div
              style={{ display: checkRequestBodyIsRaw(method, req_body_type) ? 'block' : 'none' }}
            >
              {req_body_type === 'json' && (
                <div className="adv-button">
                  <Button
                    onClick={() => this.showModal(this.state.req_body_other, 0, 'req_body_other')}
                  >
                    高级参数设置
                  </Button>
                  <Tooltip title="高级参数设置只在json字段值中生效">
                    {'  '}
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </div>
              )}

              <AceEditor
                className="pretty-editor"
                ref={editor => (this.aceEditor = editor)}
                data={this.state.req_body_other}
                mode={req_body_type === 'json' ? null : 'text'}
                onChange={this.handleRequestBody}
                fullScreen={true}
              />
            </div>

            {HTTP_METHOD[method].request_body &&
              req_body_type === 'form' && (
                <div>
                  {req_body_form.map((item, index) => {
                    return (
                      <div key={index} className="key-value-wrap">
                        {/* <Tooltip
                          placement="topLeft"
                          title={<TooltipContent example={item.example} desc={item.desc} />}
                        >
                          <Input disabled value={item.name} className="key" />
                        </Tooltip> */}
                        <ParamsNameComponent
                          example={this.content(item, 'req_body_form',index)}
                          desc={item.desc}
                          name={item.name}
                        />
                        &nbsp;
                        {item.required == 1 ? (
                          <Checkbox className="params-enable" checked={true} disabled />
                        ) : (
                          <Checkbox
                            className="params-enable"
                            checked={item.enable}
                            onChange={e => this.changeBody(e.target.checked, index, 'enable')}
                          />
                        )}
                        <span className="eq-symbol">=</span>
                        <Tooltip title = '请注意开启跨域插件cros-anywhere或者whistle'>
                          {item.type === 'file' ? (
  //                          '谷歌安全策略，暂不支持文件上传'
                            <Input
                              type="file"
                              id={'file_' + index}
                              onChange={e => this.changeBody(e.target, index,'value')}
                              multiple={false}
                              className="value"
                              value=""
                            />
                          ) : (
                            <Input
                              value={item.isexampler?item.example:item.value}
                              prefix={this.prefix(item, 'req_body_form',index)}
                              className="value"
                              onChange={e => this.changeBody(e.target.value, index)}
                              placeholder="参数值"
                              id={`req_body_form_${index}`}
                              addonAfter={
                                <Icon
                                  type="edit"
                                  onClick={() => this.showModal(item.value, index, 'req_body_form')}
                                />
                              }
                            />
                          )}
                        </Tooltip>
                      </div>
                    );
                  })}
                  <Button
                    style={{ display: 'none' }}
                    type="primary"
                    icon="plus"
                    onClick={this.addBody}
                  >
                    添加Form参数
                  </Button>
                </div>
              )}
            {HTTP_METHOD[method].request_body &&
              req_body_type === 'file' && (
                <div>
                  <ReactFileReader
                    base64
                    multipleFiles={!1}
                    handleFiles={this.loadonChange}>
                    <Tooltip title={'请注意开启跨域插件cros-anywhere或者whistle\n'+this.state.req_body_other.split(',')[0]}><Button loading={loading}>上传文件</Button></Tooltip>
                  </ReactFileReader>
                </div>
              )}
          </Panel>
          <Panel header="用例前置/后置js处理器" key="4">
            <div className="project-request">
              <Form >
                <FormItem  label="前置处理器:">
                  <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('delayed')}>延时处理</Button>
                  <Tooltip title="js处理器utils已禁用此函数，需发起请求调用。对应接口已加入openapi，服务端测试需传入params:token和具体url">
                    <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('redis')}>Redis操作</Button>
                    <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('mysql')}>Mysql操作</Button>
                    <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('es')}>Es操作</Button>
                  </Tooltip>
                  <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('delayjudgment')}>延时判断</Button>
                  <Tooltip title="服务端测试暂不支持该方法以及oauth2SignIn和revokeAccess">
                    <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('ethsign')}>钱包签名</Button>
                  </Tooltip>
                  <Button className='scriptexp' style={{marginRight: '10px'}} onClick={()=>this.scriptexp('timeoutlimit')}>超时设置</Button>
                  <AceEditor
                      data={case_pre_script}
                      onChange={editor => this.setState({ case_pre_script: editor.text }) }
                      fullScreen={true}
                      className="request-editor"
                      ref={aceEditor => {
                        this.aceEditor = aceEditor;
                      }}
                  />
                </FormItem>
                <FormItem  label="后置处理器">
                  <AceEditor
                      data={case_post_script}
                      onChange={editor => this.setState({ case_post_script: editor.text })}
                      fullScreen={true}
                      className="request-editor"
                      ref={aceEditor => {
                        this.aceEditor = aceEditor;
                      }}
                  />
                </FormItem>
              </Form>
            </div>
          </Panel>
        </Collapse>

        <Tabs size="large" defaultActiveKey="res" className="response-tab">
          <Tabs.TabPane tab="Response" key="res">
            <Spin spinning={this.state.loading}>
              <h2
                style={{ display: this.state.resStatusCode ? '' : 'none' }}
                className={
                  'res-code ' +
                  (this.state.resStatusCode >= 200 &&
                  this.state.resStatusCode < 400 &&
                  !this.state.loading
                    ? 'success'
                    : 'fail')
                }
              >
                {this.state.resStatusCode + '  ' + this.state.resStatusText}
              </h2>
              <div>
                请通过按键【F12】/【插件】 进入开发者工具，在console中查看原始请求数据和响应
              </div>
              <div className='container'>
                <Input style={{width:400}} placeholder={'二维码地址'} onChange={this.inputQrvalue}></Input >
                <Button
                  style={{marginLeft:10}}
                  onClick={this.qrcodeCreate}
                >
                  预览二维码
                </Button>
              </div>
              {this.state.test_valid_msg && (
                <Alert
                  message={
                    <span>
                      Warning &nbsp;
                      <Tooltip title="针对定义为 json schema 的返回数据进行格式校验">
                        <Icon type="question-circle-o" />
                      </Tooltip>
                    </span>
                  }
                  type="warning"
                  showIcon
                  description={this.state.test_valid_msg}
                />
              )}
              {this.state.test_script_msg && (
                <Alert
                  message="Error"
                  type="error"
                  showIcon
                  description={<pre>{this.state.test_script_msg}</pre>}
                />
              )}

              <div className="container-header-body">
                <div className="header">
                  <div className="container-title">
                    <h4>Headers</h4>
                  </div>
                  <AceEditor
                    callback={editor => {
                      editor.renderer.setShowGutter(false);
                    }}
                    readOnly={true}
                    className="pretty-editor-header"
                    data={this.state.test_res_header}
                    mode="json"
                  />
                </div>
                <div className="resizer">
                  <div className="container-title">
                    <h4 style={{ visibility: 'hidden' }}>1</h4>
                  </div>
                </div>
                <div className="body">
                  <div className="container-title">
                    <h4>Body</h4>
                  </div>
                  {this.state.test_res_body&&this.state.test_res_body.indexOf(',')>=0&&this.state.test_res_body.split(',')[0].indexOf('base64') >= 0&&this.state.test_res_body.split(',')[0].indexOf('image') >= 0?(
                    <img src={this.state.test_res_body} />
                    ):(
                      <AceEditor
                        readOnly={true}
                        className="pretty-editor-body"
                        data={this.state.test_res_body}
                        mode={handleContentType(this.state.test_res_header)}
                        // mode="html"
                      />)
                  }
                </div>
              </div>
            </Spin>
          </Tabs.TabPane>
          {this.props.type === 'case' ? (
            <Tabs.TabPane
              className="response-test"
              tab={<Tooltip title="测试脚本，可断言返回结果，使用方法请查看文档">Test</Tooltip>}
              key="test"
            >
              {/* <h3 style={{ margin: '5px' }}>
                &nbsp;是否开启:&nbsp;
                <Switch
                  checked={this.state.enable_script}
                  onChange={e => this.setState({ enable_script: e})}
                />
              </h3> */}
              <p style={{ margin: '10px' }}>注：Test 脚本只有做自动化测试才执行</p>
              <span style={{ margin: '10px' }}><a href='https://nodejs.org/api/assert.html' >assert帮助文档</a></span>
              <span style={{ margin: '10px' }}><a href='https://www.chaijs.com/guide/styles/' >chai帮助文档</a></span>
              <Row>
                <Col span={18}>
                  <AceEditor
                    onChange={this.onOpenTest}
                    className="case-script"
                    data={this.state.test_script}
                    ref={aceEditor => {
                      this.aceEditor = aceEditor;
                    }}
                  />
                </Col>
                <Col span={6}>
                  <div className="insert-code">
                    {InsertCodeMap.map(item => {
                      return (
                        <div
                          style={{ cursor: 'pointer' }}
                          className="code-item"
                          key={item.title}
                          onClick={() => {
                            this.handleInsertCode('\n' + item.code);
                          }}
                        >
                          {item.title}
                        </div>
                      );
                    })}
                  </div>
                </Col>
              </Row>
            </Tabs.TabPane>
          ) : null}
          <Tabs.TabPane
            className="response-test"
            tab={<Tooltip title="使用Mysql语句进行查询数据">Mysqlquery</Tooltip>}
            key="mysqlquery"
          >
            <p style={{ margin: '10px' }}>注：使用Mysql语句进行查询数据</p>
            <Row>
              <Col span={18}>
                <TextArea
                  className = "sql-script"
                  value={this.state.sql}
                  onChange={this.savesql}
                  placeholder="sql查询语句"
                />
              </Col>
            </Row>
            <Button style={{ margin: '10px' }} type="primary" loading={this.state.loading} onClick={this.runMysql}>
              查询
            </Button>
          </Tabs.TabPane>
          
          <Tabs.TabPane
            className="response-test"
            tab={<Tooltip title="使用RedisKey进行查询数据">Redisquery</Tooltip>}
            key="redisquery"
          >
            <p style={{ margin: '10px' }}>注：使用RedisKey进行查询数据</p>
            <Row>
              <Col span={18}>
                <TextArea
                  className = "key-script"
                  value={this.state.rediskey}
                  onChange={this.saveredis}
                  placeholder="redis key"
                />
              </Col>
            </Row>
            <Button style={{ margin: '10px' }} type="primary" loading={this.state.redisloading} onClick={this.runRedis}>
              查询
            </Button>
          </Tabs.TabPane>

          {/* {this.props.type === 'case' && this.state.method=='WS'||this.state.method=='WSS'?(
            <Tabs.TabPane
            className="response-test"
            tab={<Tooltip title="websocket消息列表">websocket消息列</Tooltip>}
            key="websocket"
          >
              <p style={{ margin: '10px' }}>注：当前消息记录</p>
              <List
                bordered
                dataSource={this.state.socketmessage}
                renderItem={item => <List.Item>{item}</List.Item>}
              />
            </Tabs.TabPane>
          ) : null}       */}

        </Tabs>
        <Modal title="查询结果集" visible={this.state.sqlquery} onOk={this.closesqlquery} onCancel={this.closesqlquery}>
          <p>{this.state.resultsql}</p>
        </Modal>
        <Modal title="查询结果集" visible={this.state.redisquery} onOk={this.closeredisquery} onCancel={this.closeredisquery}>
          <p>{this.state.resultredis}</p>
        </Modal>
        <Modal
            title="二维码"
            visible={this.state.showQrcode}
            onOk={this.closeQrcode}
            onCancel={this.closeQrcode}
            footer={null}
            bodyStyle={{ alignContent: "center", display: 'flex', justifyContent: 'center' }}
          >
          <img className="qrcode" src={this.state.qrcode} />
        </Modal>
      </div>
    );
  }
}
