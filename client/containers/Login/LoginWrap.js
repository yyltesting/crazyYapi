import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tabs,Button,Modal } from 'antd';
import LoginForm from './Login';
import RegForm from './Reg';
import './Login.scss';
import ForgetpwdForm from './Forgetpwd';
const TabPane = Tabs.TabPane;

@connect(state => ({
  loginWrapActiveKey: state.user.loginWrapActiveKey,
  canRegister: state.user.canRegister
}))
export default class LoginWrap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fotgetpwd:false
    };
  }

  static propTypes = {
    form: PropTypes.object,
    loginWrapActiveKey: PropTypes.string,
    canRegister: PropTypes.bool
  };
  Openforgetpasswd = () =>{
    this.setState(
      {
        fotgetpwd:true
      }
    )
  }
  render() {
    const { loginWrapActiveKey, canRegister } = this.props;
    {/** show only login when register is disabled */}
    return (
      <div>
        <Tabs
          defaultActiveKey={loginWrapActiveKey}
          className="login-form"
          tabBarStyle={{ border: 'none' }}
        >
          <TabPane tab="登录" key="1">
            <LoginForm />
            <Button
              className="login-forget-button"
              onClick={this.Openforgetpasswd}
              type="text"
            >
              忘记密码
            </Button>
          </TabPane>
          <TabPane tab={"注册"} key="2">
            {canRegister ? <RegForm /> : <div style={{minHeight: 200}}>管理员已禁止注册，请联系管理员</div>}
          </TabPane>
        </Tabs>

        <Modal
          title="重置密码"
          onCancel={() => this.setState({ fotgetpwd: false })}
          footer={null}
          className="Resetpwd"
          open={this.state.fotgetpwd}
        >
          <ForgetpwdForm
            onCancel={() => this.setState({ fotgetpwd: false })}
          />
        </Modal>
      </div>
    );
  }
}
