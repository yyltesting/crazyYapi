import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './index.scss';
import { DeleteOutlined, QuestionCircleOutlined, SaveOutlined, SwapOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Row, Col, Input, Select, Button, AutoComplete, Tooltip, message } from 'antd';
const FormItem = Form.Item;
const Option = Select.Option;
import constants from 'client/constants/variable.js';
import axios from 'axios';
import * as firebase from 'firebase';
import { setFirebaseApp } from '../../../../reducer/modules/project';
import {connect} from 'react-redux';

const initMap = {
  header: [
    {
      name: '',
      value: ''
    }
  ],
  cookie: [
    {
      name: '',
      value: ''
    }
  ],
  global: [
    {
      name: '',
      value: ''
    }
  ],
  mysql: [
    {
      name: '',
      value: ''
    }
  ],
  redis: [
    {
      name: '',
      value: ''
    }
  ],
  firebase:[
    {
      name:'',
      value:'' 
    }
  ],
  es:[
    {
      name:'',
      value:'' 
    }
  ],
  logs:[
    {
      name:'',
      value:'' 
    }
  ]
};
@connect(
  state => {
    return {
      firebaseApp: state.project.firebaseApp
    };
  },
  {
    setFirebaseApp
  }
)
class ProjectEnvContent extends Component {
  static propTypes = {
    projectMsg: PropTypes.object,
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    handleEnvInput: PropTypes.func,
    setFirebaseApp: PropTypes.func,
    firebaseApp: PropTypes.object
  };

  initState(curdata) {
    let header = [
      {
        name: '',
        value: ''
      }
    ];
    let cookie = [
      {
        name: '',
        value: ''
      }
    ];

    let global = [
      {
        name: '',
        value: ''
      }
    ];

    let mysql = [
      {
        name: '',
        value: ''
      }
    ];

    let redis = [
      {
        name: '',
        value: ''
      }
    ];

    let firebase = [
      {
        name: '',
        value: ''
      }
    ];

    let es = [
      {
        name: '',
        value: ''
      }
    ];

    let logs = [
      {
        name: '',
        value: ''
      }
    ];

    const curheader = curdata.header;
    const curGlobal = curdata.global;
    const curMysql = curdata.mysql;
    const curRedis = curdata.redis;
    const curFirebase = curdata.firebase;
    const curEs = curdata.es;
    const curLogs = curdata.logs;

    if (curheader && curheader.length !== 0) {
      curheader.forEach(item => {
        if (item.name === 'Cookie') {
          let cookieStr = item.value;
          if (cookieStr) {
            cookieStr = cookieStr.split(';').forEach(c => {
              if (c) {
                c = c.split('=');
                cookie.unshift({
                  name: c[0] ? c[0].trim() : '',
                  value: c[1] ? c[1].trim() : ''
                });
              }
            });
          }
        } else {
          header.unshift(item);
        }
      });
    }

    if (curGlobal && curGlobal.length !== 0) {
      curGlobal.forEach(item => {
        global.unshift(item);
      });
    }
    if (curMysql && curMysql.length !== 0) {
      curMysql.forEach(item => {
        mysql.unshift(item);
      });
    }
    if (curRedis && curRedis.length !== 0) {
      curRedis.forEach(item => {
        redis.unshift(item);
      });
    }
    if (curEs && curEs.length !== 0) {
      curEs.forEach(item => {
        es.unshift(item);
      });
    }
    if (curFirebase && curFirebase.length !== 0) {
      curFirebase.forEach(item => {
        firebase.unshift(item);
      });
    }
    if (curLogs && curLogs.length !== 0) {
      curLogs.forEach(item => {
        logs.unshift(item);
      });
    }
    return { header, cookie, global, mysql, redis, firebase,es,logs };
  }

  constructor(props) {
    super(props);
    this.state = Object.assign({}, initMap);
  }
  addHeader = (value, index, name) => {
    let nextHeader = this.state[name][index + 1];
    if (nextHeader && typeof nextHeader === 'object') {
      return;
    }
    let newValue = {};
    let data = { name: '', value: '' };
    newValue[name] = [].concat(this.state[name], data);
    this.setState(newValue);
  };

  delHeader = (key, name) => {
    let curValue = this.props.form.getFieldValue(name);
    let newValue = {};
    newValue[name] = curValue.filter((val, index) => {
      return index !== key;
    });
    this.props.form.setFieldsValue(newValue);
    this.setState(newValue);
  };

  handleInit(data) {
    this.props.form.resetFields();
    let newValue = this.initState(data);
    this.setState({ ...newValue });
  }

  componentWillReceiveProps(nextProps) {
    let curEnvName = this.props.projectMsg.name;
    let nextEnvName = nextProps.projectMsg.name;
    if (curEnvName !== nextEnvName) {
      this.handleInit(nextProps.projectMsg);
    }
  }

  handleOk = e => {
    e.preventDefault();
    const { form, onSubmit, projectMsg } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        let header = values.header.filter(val => {
          return val.name !== '';
        });
        let cookie = values.cookie.filter(val => {
          return val.name !== '';
        });
        let global = values.global.filter(val => {
          return val.name !== '';
        });
        let mysql = values.mysql.filter(val => {
          return val.name !== '';
        });
        let redis = values.redis.filter(val => {
          return val.name !== '';
        });
        let es = values.es.filter(val => {
          return val.name !== '';
        });
        let firebase = values.firebase.filter(val => {
          return val.name !== '';
        });
        let logs = values.logs.filter(val => {
          return val.name !== '';
        });
        if (cookie.length > 0) {
          header.push({
            name: 'Cookie',
            value: cookie.map(item => item.name + '=' + item.value).join(';')
          });
        }
        let assignValue = {};
        assignValue.env = Object.assign(
          { _id: projectMsg._id },
          {
            name: values.env.name,
            domain: values.env.protocol + values.env.domain,
            header: header,
            global,
            mysql,
            redis,
            es,
            firebase,
            logs
          }
        );
        this.setState({
            mysql : assignValue.env.mysql,
            redis : assignValue.env.redis,
            es : assignValue.env.es,
            firebase : assignValue.env.firebase,
            logs: assignValue.env.logs
        })
        onSubmit(assignValue);
      }
    });
  };

  Connection = async e =>{
    e.preventDefault();
    this.setState({
      mysqlloading : true
    })
    let data = this.state.mysql.reduce((obj, item) => (obj[item.name] = item.value,obj), {});
    data.envid = this.props.projectMsg._id;
    let axioscontent={
      method: 'post',
      url: '/api/project/mysqlconnection',
      data: data
    }
    await axios(axioscontent).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}`);
      }
      let result = res.data.data;
      message.success(result);
    });
    this.setState({
      mysqlloading :false
    })
  }
  Initfirebase = async e=>{
    e.preventDefault();
    this.setState({
      firebaseloading : true
    })
    let data = this.state.firebase.reduce((obj, item) => (obj[item.name] = item.value,obj), {});
    data.envid = this.props.projectMsg._id;
    try{
      const firebaseConfig = {
        apiKey: data.apiKey,
        authDomain: data.authDomain,
        projectId: data.projectId,
        storageBucket: data.storageBucket,
        messagingSenderId: data.messagingSenderId,
        appId: data.appId
      };
      // 初始化 Firebase 应用
      const app =firebase.initializeApp(firebaseConfig);
      message.success('初始化firebase成功');
      //注册到redux持久化，以便后续应用使用
      await this.props.setFirebaseApp(app);
      console.log('已成功加载firebase',this.props.firebaseApp);
    }catch(e){
      message.error(e)
    }
    this.setState({
      firebaseloading : false
    })
  }
  RedisConnection = async e =>{
    e.preventDefault();
    this.setState({
      redisloading : true
    })
    let data = this.state.redis.reduce((obj, item) => (obj[item.name] = item.value,obj), {});
    data.envid = this.props.projectMsg._id;
    let axioscontent={
      method: 'post',
      url: '/api/project/redisconnection',
      data: data
    }
    await axios(axioscontent).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}`);
      }
      let result = res.data.data;
      message.success(result);
    });
    this.setState({
      redisloading :false
    })
  }
  EsConnection = async e =>{
    e.preventDefault();
    this.setState({
      esloading : true
    })
    let data = this.state.es.reduce((obj, item) => (obj[item.name] = item.value,obj), {});
    data.envid = this.props.projectMsg._id;
    let axioscontent={
      method: 'post',
      url: '/api/project/esconnection',
      data: data
    }
    await axios(axioscontent).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}`);
      }
      let result = res.data.data;
      message.success(result);
    });
    this.setState({
      esloading :false
    })
  }
  render() {
    const connectconfigname = ['host','port','user','password','Cluster'];
    const { projectMsg } = this.props;
    const { getFieldDecorator } = this.props.form;
    const headerTpl = (item, index) => {
      const headerLength = this.state.header.length - 1;
      return (
        <Row gutter={2} key={index}>
          <Col span={10}>
            <FormItem>
              {getFieldDecorator('header[' + index + '].name', {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: item.name || ''
              })(
                <AutoComplete
                  style={{ width: '200px' }}
                  allowClear={true}
                  dataSource={constants.HTTP_REQUEST_HEADER}
                  placeholder="请输入header名称"
                  onChange={() => this.addHeader(item, index, 'header')}
                  filterOption={(inputValue, option) =>
                    option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                />
              )}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem>
              {getFieldDecorator('header[' + index + '].value', {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: item.value || ''
              })(<Input placeholder="请输入参数内容" style={{ width: '90%', marginRight: 8 }} />)}
            </FormItem>
          </Col>
          <Col span={2} className={index === headerLength ? ' env-last-row' : null}>
            {/* 新增的项中，只有最后一项没有有删除按钮 */}
            <DeleteOutlined
              className="dynamic-delete-button delete"
              onClick={e => {
                e.stopPropagation();
                this.delHeader(index, 'header');
              }} />
          </Col>
        </Row>
      );
    };

    const commonTpl = (item, index, name) => {
      const length = this.state[name].length - 1;
      return (
        <Row gutter={2} key={index}>
          <Col span={10}>
            <FormItem>
              {getFieldDecorator(`${name}[${index}].name`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: item.name || ''
              })(
                <Input
                  placeholder={`请输入 ${name} Name`}
                  style={{ width: '200px' }}
                  onChange={() => this.addHeader(item, index, name)}
                />
              )}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem>
              {getFieldDecorator(`${name}[${index}].value`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: item.value || ''
              })(<Input placeholder="请输入参数内容" style={{ width: '90%', marginRight: 8 }} />)}
            </FormItem>
          </Col>
          <Col span={2} className={index === length ? ' env-last-row' : null}>
            {/* 新增的项中，只有最后一项没有有删除按钮 */}
            <DeleteOutlined
              className="dynamic-delete-button delete"
              onClick={e => {
                e.stopPropagation();
                this.delHeader(index, name);
              }} />
          </Col>
        </Row>
      );
    };

    const connectTpl = (item, index, name) => {
      var configname = connectconfigname;
      if(name =='firebase'){
        configname = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
      }
      if(name =='es'){
        configname = ['url'];
      }
      if(name =='logs'){
        configname = ['url','jobName'];
      }
      return (
        <Row gutter={2} key={index}>
          <Col span={10}>
            <FormItem>
              {getFieldDecorator(`${name}[${index}].name`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: item.name || ''
              })(
                <AutoComplete
                style={{ width: '200px' }}
                allowClear={true}
                dataSource={configname}
                placeholder="请输入ConfigName"
                onChange={() => this.addHeader(item, index, name)}
                filterOption={(inputValue, option) =>
                  option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
              />
              )}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem>
              {getFieldDecorator(`${name}[${index}].value`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: item.value || ''
              })(<Input placeholder="请输入参数内容" style={{ width: '90%', marginRight: 8 }} />)}
            </FormItem>
          </Col>
          <Col span={2} className={index === length ? ' env-last-row' : null}>
            {/* 新增的项中，只有最后一项没有有删除按钮 */}
            <DeleteOutlined
              className="dynamic-delete-button delete"
              onClick={e => {
                e.stopPropagation();
                this.delHeader(index, name);
              }} />
          </Col>
        </Row>
      );
    };

    const envTpl = data => {
      return (
        <div>
          <h3 className="env-label">环境名称</h3>
          <FormItem required={false}>
            {getFieldDecorator('env.name', {
              validateTrigger: ['onChange', 'onBlur'],
              initialValue: data.name === '新环境' ? '' : data.name || '',
              rules: [
                {
                  required: false,
                  whitespace: true,
                  validator(rule, value, callback) {
                    if (value) {
                      if (value.length === 0) {
                        callback('请输入环境名称');
                      } else if (!/\S/.test(value)) {
                        callback('请输入环境名称');
                      } else {
                        return callback();
                      }
                    } else {
                      callback('请输入环境名称');
                    }
                  }
                }
              ]
            })(
              <Input
                onChange={e => this.props.handleEnvInput(e.target.value)}
                placeholder="请输入环境名称"
                style={{ width: '90%', marginRight: 8 }}
              />
            )}
          </FormItem>
          <h3 className="env-label">环境域名</h3>
          <FormItem required={false}>
            {getFieldDecorator('env.domain', {
              validateTrigger: ['onChange', 'onBlur'],
              initialValue: data.domain ? data.domain.split('//')[1] : '',
              rules: [
                {
                  required: false,
                  whitespace: true,
                  validator(rule, value, callback) {
                    if (value) {
                      if (value.length === 0) {
                        callback('请输入环境域名!');
                      } else if (/\s/.test(value)) {
                        callback('环境域名不允许出现空格!');
                      } else {
                        return callback();
                      }
                    } else {
                      callback('请输入环境域名!');
                    }
                  }
                }
              ]
            })(
              <Input
                placeholder="请输入环境域名"
                style={{ width: '90%', marginRight: 8 }}
                addonBefore={getFieldDecorator('env.protocol', {
                  initialValue: data.domain ? data.domain.split('//')[0] + '//' : 'http://',
                  rules: [
                    {
                      required: true
                    }
                  ]
                })(
                  <Select>
                    <Option value="http://">{'http://'}</Option>
                    <Option value="https://">{'https://'}</Option>
                    <Option value="ws://">{'ws://'}</Option>
                    <Option value="wss://">{'wss://'}</Option>
                  </Select>
                )}
              />
            )}
          </FormItem>
          <h3 className="env-label">Header</h3>
          {this.state.header.map((item, index) => {
            return headerTpl(item, index);
          })}

          <h3 className="env-label">Cookie</h3>
          {this.state.cookie.map((item, index) => {
            return commonTpl(item, index, 'cookie');
          })}

          <h3 className="env-label">
            global
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://hellosean1025.github.io/yapi/documents/project.html#%e9%85%8d%e7%bd%ae%e7%8e%af%e5%a2%83"
              style={{ marginLeft: 8 }}
            >
              <Tooltip title="点击查看文档">
                <QuestionCircleOutlined style={{fontSize: '13px'}} />
              </Tooltip>
            </a>
          </h3>
          {this.state.global.map((item, index) => {
            return commonTpl(item, index, 'global');
          })}

          <h3 className="env-label">
            Logs
          </h3>
          {this.state.logs.map((item, index) => {
            return connectTpl(item, index, 'logs');
          })}

          <h3 className="env-label">
            Mysql
            <Tooltip title="点击mysql连接，请先保存再操作。。。">
              <Button
                className="m-btn btn-mysqltest"
                icon={<SwapOutlined />}
                type="primary"
                shape="circle"
                loading={this.state.mysqlloading}
                style={{ marginLeft: 8 }}
                onClick={this.Connection}
              >
              </Button>
            </Tooltip>
          </h3>
          {this.state.mysql.map((item, index) => {
            return connectTpl(item, index, 'mysql');
          })}
          
          <h3 className="env-label">
            Redis
            <Tooltip title="点击redis连接，请先保存再操作。。。">
              <Button
                className="m-btn btn-redistest"
                icon={<SwapOutlined />}
                type="primary"
                shape="circle"
                loading={this.state.redisloading}
                style={{ marginLeft: 8 }}
                onClick={this.RedisConnection}
              >
              </Button>
            </Tooltip>
          </h3>
          {this.state.redis.map((item, index) => {
            return connectTpl(item, index, 'redis');
          })}

          <h3 className="env-label">
            Es
            <Tooltip title="点击ES连接，请先保存再操作。。。">
              <Button
                className="m-btn btn-estest"
                icon={<SwapOutlined />}
                type="primary"
                shape="circle"
                loading={this.state.esloading}
                style={{ marginLeft: 8 }}
                onClick={this.EsConnection}
              >
              </Button>
            </Tooltip>
          </h3>
          {this.state.es.map((item, index) => {
            return connectTpl(item, index, 'es');
          })}

          <h3 className="env-label">
            firebase
            <Tooltip title="点击初始化firebase，请先保存再操作。。。">
              <Button
                className="m-btn btn-firebasetest"
                icon={<SwapOutlined />}
                type="primary"
                shape="circle"
                loading={this.state.firebaseloading}
                style={{ marginLeft: 8 }}
                onClick={this.Initfirebase}
              >
              </Button>
            </Tooltip>
          </h3>
          {this.state.firebase.map((item, index) => {
            return connectTpl(item, index, 'firebase');
          })}
        </div>
      );
    };

    return (
      <div>
        {envTpl(projectMsg)}
        <div className="btnwrap-changeproject">
          <Button
            className="m-btn btn-save"
            icon={<SaveOutlined />}
            type="primary"
            size="large"
            onClick={this.handleOk}
          >
            保 存
          </Button>
        </div>
      </div>
    );
  }
}
export default Form.create()(ProjectEnvContent);
