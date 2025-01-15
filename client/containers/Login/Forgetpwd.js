import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { LockOutlined, SecurityScanOutlined, UserOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, Input, message, Row, Col } from 'antd';
import axios from 'axios';
import {encodeAes} from '../../common.js'
const FormItem = Form.Item;


import './Login.scss';


const formItemStyle = {
  marginBottom: '.16rem'
};

const changeHeight = {
  height: '.42rem'
};


class Forgetpwd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      yztime: 59,
      email:'',
      vcode:'',
      password:''
    };
  }

  static propTypes = {
    form: PropTypes.object,
    history: PropTypes.object,
    onCancel: PropTypes.func
  };

  handleSubmit = async(e) => {
    e.preventDefault();
    const form = this.props.form;
    form.validateFields(async (err, values) => {
      if (!err) {
        values.password = encodeAes(values.password);
        await axios.post('/api/user/vcodeuppassword', values).then(res => {
          if (res.data.errcode !== 0) {
            message.error(`${res.data.errmsg}`);
          }else{
            message.success('重置成功');
            console.log('this.props',this.props);
            this.props.onCancel();
          }
        });
      }
    });
  };

  //设置邮箱
  Setemail= (e)=>{
    console.log('eLoop',e);
    return (e)=>{
      let value = e;
      if(typeof e === 'object' && e){
        value = e.target.value;
      }
      this.setState({
        email: value
          })
    }
  }
  //设置验证码
  Setvcode= (e)=>{
    console.log('eLoop',e);
    return (e)=>{
      let value = e;
      if(typeof e === 'object' && e){
        value = e.target.value;
      }
      this.setState({
        vcode: value
          })
    }
  }
  //设置密码
  Setpassword= (e)=>{
    console.log('eLoop',e);
    return (e)=>{
      let value = e;
      if(typeof e === 'object' && e){
        value = e.target.value;
      }
      this.setState({
        password: value
          })
    }
  }
  //校验密码
  checkConfirm = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    // 校验密码强度
    // 1. 必须同时包含大写字母、小写字母和数字，三种组合
    // 2. 长度在6-10之间
    const passwordReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/;
    if (value) {
        if (!passwordReg.test(value)) {
            callback('密码必须同时包含大写字母、小写字母和数字');
        }
        if (value.length < 6 || value.length > 10) {
            callback('密码长度6-10位')
        }
    }
    callback();
  };
  //倒计60s
  count = () => {
    let { yztime } = this.state;
    let siv = setInterval(() => {
      this.setState({ yztime: (yztime--) }, () => {
        if (yztime <= -1) { 
          clearInterval(siv);//倒计时( setInterval() 函数会每秒执行一次函数)，用 clearInterval() 来停止执行:
          this.setState({ loading: false, yztime: 59 })
        }   
      });
    }, 1000);
  }
  sendcode=async(e)=>{
    // console.log('email',this.state.email);
    var mail = /^\w+@[a-z0-9]+\.[a-z]+$/i;
    if(mail.test(this.state.email)){
      let data={};
      data.email = this.state.email;
      await axios.post('/api/user/forget', data).then(res => {
        if (res.data.errcode !== 0) {
          message.error(`${res.data.errmsg}`);
        }else{
          message.success('发送成功');
          this.setState({ loading: true });
        }
      });
      e.preventDefault();
      // this.props.form.validateFields((err, values) => {
      if (!this.state.yztime == 0) {
        this.count();
      }
      // });
    }else{
      message.error('请输入正确邮箱地址')
    }

  }
  componentDidMount() {
    //Qsso.attach('qsso-login','/api/user/login_by_token')
  }
  handleFormLayoutChange = e => {
    this.setState({ loginType: e.target.value });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    

    const emailRule =
      this.state.loginType === 'ldap'
        ? {}
        : {
            required: true,
            message: '请输入正确的email!',
            pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/
          };
    return (
      <Form onSubmit={this.handleSubmit}>
        {/* 用户名 (Email) */}
        <FormItem style={formItemStyle}>
          {getFieldDecorator('email', { rules: [emailRule] })(
            <Input
              style={changeHeight}
              prefix={<UserOutlined style={{ fontSize: 13 }} />}
              placeholder="Email"
              onChange={this.Setemail(Event)} 
            />
          )}
        </FormItem>

        {/* 验证码 */}
        <FormItem style={formItemStyle}>
          <Row gutter={8}>
            <Col span={12}>
              {getFieldDecorator('vcode', {
                rules: [{ required: true, message: '请输入验证码!' }]
              })(
                <Input
                  style={changeHeight}
                  prefix={<SecurityScanOutlined style={{ fontSize: 13 }} />}
                  type="vcode"
                  placeholder="vcode"
                  onChange={this.Setvcode(Event)} 
                />
              )}
            </Col>
            <Col span={12}>
              <Button loading={this.state.loading} onClick={this.sendcode}>
                {this.state.loading ? this.state.yztime + "秒" : "发送验证码"}
              </Button>
            </Col>
          </Row>
        </FormItem>

        {/* 密码 */}
        <FormItem style={formItemStyle}>
          {getFieldDecorator('password', {
            rules: [
              {
                required: true,
                message: '请输入密码!'
              },
              {
                validator: this.checkConfirm
              }
            ]
          })(
            <Input
              style={changeHeight}
              prefix={<LockOutlined style={{ fontSize: 13 }} />}
              type="password"
              placeholder="Password"
              onChange={this.Setpassword(Event)}
            />
          )}
        </FormItem>

        {/* 重置按钮 */}
        <FormItem style={formItemStyle}>
          <Button
            style={changeHeight}
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            重置密码
          </Button>
        </FormItem>

      </Form>
    );
  }
}
const ForgetpwdForm = Form.create()(Forgetpwd);
export default ForgetpwdForm;
