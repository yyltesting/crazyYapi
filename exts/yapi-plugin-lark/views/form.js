import React, { Component } from "react";
import { Row, Col, Form, Select, Icon, Button, Input, message, Tooltip,Switch } from "antd";
const Option = Select.Option;
import axios from 'axios';
import PropTypes from 'prop-types';

class larkRobotView extends Component {
  static propTypes = {
    projectId: PropTypes.number,
    form: PropTypes.object
  };
  constructor(props) {
    super(props);
    this.state = {
      larkHooks: [],
      loading: false
    };
    this.id = 0;
  }

  /**
   * 生命周期函数
   */
  async componentDidMount() {
      const projectId = this.props.projectId;
      let resp = await axios.get('/api/plugin/lark_robots/detail', {params: {project_id: projectId}});
      if (resp.data.errcode == 0 && resp.data.data) {
          let hooks = resp.data.data.hooks || [];
          if (hooks && hooks.length > 0) {
              hooks = hooks.map((h) => {
                  return {
                      id: this.id++,
                      value: h,
                      state: 'normal'
                  }
              })
              this.setState({larkHooks: hooks})
          }
      }else{
        this.setState({larkHooks: []})
      }
  }

  add = () => {
    let hooks = this.state.larkHooks;
    let id;
    if(hooks.length>0){
      id = hooks[hooks.length-1].id+1;
    }else{
      id = 0;
    }
    hooks.push({
      id: id,
      value: {open:true},
      state: 'normal'
    });
    this.setState({larkHooks: hooks});
  }

  remove = (id) => {
    const hooks = this.state.larkHooks;
    this.setState({larkHooks: hooks.filter(obj => obj.id != id)})
  }

  test = (id) => {
      this.setHookObjState(id, {state: 'testing'});
      const url = this.props.form.getFieldValue(`hooks[${id}]`);
      if (url) {
          axios.post('/api/plugin/lark_robots/test', {url}).then((resp) => {
              if (resp && resp.data && resp.data.errcode === 0) {
                  this.setHookObjState(id, {state: 'success'});
              } else {
                  this.setHookObjState(id, {state: 'error'});
                  message.error(`${resp.data.errmsg}`);
              }
          }).catch((err) => {
              console.log(err);
              this.setHookObjState(id, {state: 'error'});
          });
      }
  }

  inputOnChange = (id) => {
      this.setHookObjState(id, {state: 'normal'});
      console.log('id',id);
  }

  setHookObjState = (id, attr) => {
      const hooks = this.state.larkHooks.map((hook) => {
          if (hook.id != id) {
              return hook;
          }
          return Object.assign(hook, attr);
      });
      this.setState({larkHooks: hooks});
  }
  deleteHook = (id)=>{
    let hookArr = this.state.larkHooks;
    hookArr.splice(id,1);
    this.setState({larkHooks:hookArr});
  }
  onChangeOpenHook =(id,checked)=>{
    const hooks = this.state.larkHooks.map((hook) => {
      if (hook.id != id) {
          return hook;
      }
      hook.value.open=checked;
      return Object.assign(hook);
    });
    this.setState({larkHooks: hooks});
  }
  submit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (err) {
          console.log(err);
          return;
      }
      const currentProjectId = this.props.projectId;
      let payload = {
        project_id: currentProjectId,
        hooks: values.hooks
      };
      this.submitData('/api/plugin/lark_robots/up', payload);
    })
  }

  submitData = async (url, data) => {
    this.setState({loading: true})
    let result =  await axios.post(url, data);
    if (result.data.errcode != 0) {
      message.error(`更新失败: ${result.data.errmsg}`);
    } else {
      message.success(`更新成功`);
    }
    this.setState({loading: false})
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 }
      }
    };
    const formItemLayoutWithOutLabel = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 20, offset: 4 }
      }
    };
    const formItems = this.state.larkHooks.map((obj, idx) => {
      let testButton = null;
      switch (obj.state) {
        case 'testing':
          testButton = <Icon type="loading"/>;
          break;
        case 'success':
          testButton = <Icon type="check-circle-o" style={{color: '#00CC33'}}/>;
          break;
        case 'error':
          testButton = (
            <Tooltip title="点击推送测试消息">
              <Icon type="close-circle-o" onClick={(e) => this.test(obj.id, e)} style={{cursor: 'pointer', color: '#FF0033'}}/>
            </Tooltip>
          );
          break;
        default:
          testButton = (
            <Tooltip title="点击推送测试消息">
              <Icon type="question-circle-o" onClick={(e) => this.test(obj.id, e)} style={{cursor: 'pointer'}}/>
            </Tooltip>
          );
          break;
    }
      return (
        <Form.Item
          key={obj.id}
          label={idx === 0 ? '机器人' : ''}
          {...(idx === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
        >
          <Row gutter={8}>
            <Col span={8}>
              {getFieldDecorator(`hooks[${obj.id}].url`, {
                validateTrigger: ['onChange', 'onBlur'],
                rules: [{
                  required: true,
                  message: '请输入飞书机器人 Webhook'
                }],
                initialValue: obj.value.url
              })(
                <Input
                  placeholder="飞书机器人 Webhook"
                  style={{ width: '100%' }}
                  suffix={testButton}
                  onChange={(e) => this.inputOnChange(obj.id, e)}
                />
              )}
            </Col>
            <Col span={8}>
              {getFieldDecorator(`hooks[${obj.id}].options`, {
                initialValue: obj.value.options,
                rules: [{ required: true, message: '请选择通知类型' }]
              })(
                <Select mode="multiple" placeholder="请选择通知类型" style={{ width: '100%' }}>
                  <Option value="interface">接口</Option>
                  <Option value="interfacecol">测试集</Option>
                  <Option value="caselib">用例库</Option>
                  <Option value="wiki">wiki</Option>
                </Select>
              )}
            </Col>
            <Col span={8}>
              {getFieldDecorator(`hooks[${obj.id}].open`, {
                  initialValue: obj.value.open
                })(
                  <Switch checked={obj.value.open} onChange={(e)=>this.onChangeOpenHook(obj.id,e)} />
                )}
            </Col>
            <Col span={8} style={{display: 'flex', alignItems: 'center'}}>
              <Button icon="delete" onClick={(e)=>this.deleteHook(obj.id,e)}>删除</Button>
            </Col>
          </Row>
        </Form.Item>
        
      );
    });

    return (
      <div className="m-panel">
        <Form onSubmit={this.submit}>
          {formItems}
          <Form.Item {...formItemLayoutWithOutLabel}>
            <Button type="dashed" onClick={this.add}>
              <Icon type="plus" /> 添加机器人
            </Button>
          </Form.Item>
          <Form.Item {...formItemLayoutWithOutLabel}>
            <Button type="primary" htmlType="submit" size="large" disabled={this.state.loading ? true : false}>
              {this.state.loading ? (
                <Icon type="loading"/>
              ) : (
                <Icon type="save"/>
              )
              }
              {this.state.loading ? '保存中...' : '保存'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default Form.create()(larkRobotView);
