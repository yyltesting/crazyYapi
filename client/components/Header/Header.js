import './Header.scss';
import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon as LegacyIcon } from '@ant-design/compatible';

import {
  DownOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  QuestionCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';

import {
  Layout,
  Menu,
  Dropdown,
  message,
  Tooltip,
  Popover,
  Tag,
  Button,
  Modal,
  Row,
  Input,
} from 'antd';
import { checkLoginState, logoutActions, loginTypeAction } from '../../reducer/modules/user';
import { changeMenuItem } from '../../reducer/modules/menu';
import { withRouter } from 'react-router';
import Srch from './Search/Search';
const { Header } = Layout;
import LogoSVG from '../LogoSVG/index.js';
import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import GuideBtns from '../GuideBtns/GuideBtns.js';
const plugin = require('client/plugin.js');
import { loadStripe } from '@stripe/stripe-js';

import StripeImg from '../Icon/StripeImg.js';
import MeataMaskImg from '../Icon/MeataMaskImg.js';
const {
  getsocket,
  cleansocket
} = require('common/postmanLib.js');
const version = process.env.version;
// import axios from 'axios';
// import { Elements, useStripe, useElements, CardElement  } from '@stripe/react-stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

let HeaderMenu = {
  user: {
    path: '/user/profile',
    name: '个人中心',
    icon: 'user',
    adminFlag: false
  },
  solution: {
    path: '/user/list',
    name: '用户管理',
    icon: 'solution',
    adminFlag: true
  },
  global:{
    path: '/global/config',
    name: '全局配置',
    icon: 'fileText',
    adminFlag: true
  }
};

plugin.emitHook('header_menu', HeaderMenu);


//自定义
// const CheckoutForm = ({handleClose}) => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !elements) {
//       return;
//     }

//     const cardElement = elements.getElement(CardElement);

//     const { error, paymentMethod } = await stripe.createPaymentMethod({
//       type: 'card',
//       card: cardElement
//     });

//     if (error) {
//       console.log('[error]', error);
//     } else {
//       console.log('[PaymentMethod]', paymentMethod);
//       handleClose(); // 支付成功后关闭窗口
//     }
//   };

//   return (
//     <form>
//       <CardElement />
//       <Button type="submit" disabled={!stripe} onClick={handleSubmit} >
//         支付
//       </Button>
//     </form>
//   );
// };
// CheckoutForm.propTypes = {
//   handleClose: PropTypes.func.isRequired
// };
const MenuUser = props => (
  <Menu theme="dark" className="user-menu">
    {Object.keys(HeaderMenu).map(key => {
      let item = HeaderMenu[key];
      const isAdmin = props.role === 'admin';
      if (item.adminFlag && !isAdmin) {
        return null;
      }
      return (
        <Menu.Item key={key}>
          {item.name === '个人中心' ? (
            <Link to={item.path + `/${props.uid}`}>
              <LegacyIcon type={item.icon} />
              {item.name}
            </Link>
          ) : (
            <Link to={item.path}>
              <LegacyIcon type={item.icon} />
              {item.name}
            </Link>
          )}
        </Menu.Item>
      );
    })}
    <Menu.Item key="9">
      <a onClick={props.logout}>
        <LogoutOutlined />退出
      </a>
    </Menu.Item>
  </Menu>
);

const tipFollow = (
  <div className="title-container">
    <h3 className="title">
      <StarOutlined /> 关注
    </h3>
    <p>这里是你的专属收藏夹，便于你找到自己的项目</p>
  </div>
);
const tipAdd = (
  <div className="title-container">
    <h3 className="title">
      <PlusCircleOutlined /> 新建项目
    </h3>
    <p>在任何页面都可以快速新建项目</p>
  </div>
);
const tipDoc = (
  <div className="title-container">
    <h3 className="title">
      使用文档 <Tag color="orange">推荐!</Tag>
    </h3>
    <p>
      初次使用 YApi，强烈建议你阅读{' '}
      <a target="_blank" href="/doc/index.html" rel="noopener noreferrer">
        使用文档
      </a>
      ，我们为你提供了通俗易懂的快速入门教程，更有详细的使用说明，欢迎阅读！{' '}
    </p>
  </div>
);

MenuUser.propTypes = {
  user: PropTypes.string,
  msg: PropTypes.string,
  role: PropTypes.string,
  uid: PropTypes.number,
  relieveLink: PropTypes.func,
  logout: PropTypes.func
};

const ToolUser = props => {
  let imageUrl = props.imageUrl ? props.imageUrl : `/api/user/avatar?uid=${props.uid}`;
  return (
    <ul>
      <li className="toolbar-li item-search">
        <Srch groupList={props.groupList} />
      </li>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns />}
        title={tipFollow}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 1 && !props.study}
      >
        <Tooltip placement="bottom" title={'我的关注'}>
          <li className="toolbar-li">
            <Link to="/follow">
              <StarOutlined className="dropdown-link" style={{ fontSize: 16 }} />
            </Link>
          </li>
        </Tooltip>
      </Popover>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns />}
        title={tipAdd}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 2 && !props.study}
      >
        <Tooltip placement="bottom" title={'新建项目'}>
          <li className="toolbar-li">
            <Link to="/add-project">
              <PlusCircleOutlined className="dropdown-link" style={{ fontSize: 16 }} />
            </Link>
          </li>
        </Tooltip>
      </Popover>
      <Popover
        overlayClassName="popover-index"
        content={<GuideBtns isLast={true} />}
        title={tipDoc}
        placement="bottomRight"
        arrowPointAtCenter
        visible={props.studyTip === 3 && !props.study}
      >
        <Tooltip placement="bottom" title={`使用文档: ${version}`}>
          <li className="toolbar-li">
            <a target="_blank" href="/doc/index.html" rel="noopener noreferrer">
              <QuestionCircleOutlined className="dropdown-link" style={{ fontSize: 16 }} />
            </a>
          </li>
        </Tooltip>
      </Popover>
      <li className="toolbar-li">
        <Dropdown
          placement="bottomRight"
          trigger={['click']}
          overlay={
            <MenuUser
              user={props.user}
              msg={props.msg}
              uid={props.uid}
              role={props.role}
              relieveLink={props.relieveLink}
              logout={props.logout}
            />
          }
        >
          <a className="dropdown-link">
            <span className="avatar-image">
              <img src={imageUrl} />
            </span>
            {/*props.imageUrl? <Avatar src={props.imageUrl} />: <Avatar src={`/api/user/avatar?uid=${props.uid}`} />*/}
            <span className="name">
              <DownOutlined />
            </span>
          </a>
        </Dropdown>
      </li>
    </ul>
  );
};
ToolUser.propTypes = {
  user: PropTypes.string,
  msg: PropTypes.string,
  role: PropTypes.string,
  uid: PropTypes.number,
  relieveLink: PropTypes.func,
  logout: PropTypes.func,
  groupList: PropTypes.array,
  studyTip: PropTypes.number,
  study: PropTypes.bool,
  imageUrl: PropTypes.any
};

@connect(
  state => {
    return {
      user: state.user.userName,
      uid: state.user.uid,
      msg: null,
      role: state.user.role,
      login: state.user.isLogin,
      studyTip: state.user.studyTip,
      study: state.user.study,
      imageUrl: state.user.imageUrl
    };
  },
  {
    loginTypeAction,
    logoutActions,
    checkLoginState,
    changeMenuItem
  }
)
@withRouter
export default class HeaderCom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showPaymentModal:false,
      showInputPaymentModal:false,
      clientSecret:'',
      pk:'',
      stripePromise:''
    }
  }

  static propTypes = {
    router: PropTypes.object,
    user: PropTypes.string,
    msg: PropTypes.string,
    uid: PropTypes.number,
    role: PropTypes.string,
    login: PropTypes.bool,
    relieveLink: PropTypes.func,
    logoutActions: PropTypes.func,
    checkLoginState: PropTypes.func,
    loginTypeAction: PropTypes.func,
    changeMenuItem: PropTypes.func,
    history: PropTypes.object,
    location: PropTypes.object,
    study: PropTypes.bool,
    studyTip: PropTypes.number,
    imageUrl: PropTypes.any
  };
  componentWillMount () {
    // 拦截判断是否离开当前页面
    window.addEventListener('beforeunload', this.beforeunload);
  }
  componentWillUnmount () {
    
    // 销毁拦截判断是否离开当前页面
    window.removeEventListener('beforeunload', this.beforeunload);
  }
  beforeunload () {
    try{
      //遍历weocket对象数组
      let s = getsocket();
      let ws;
      if(s.length>0){
        for(let i=0;i<s.length;i++){
          ws = s[i]
          //关闭连接
          localStorage.removeItem(s[i].url);
          ws.close();
          cleansocket(i);
          message.success('websocket 连接已断开');
        }
        // let confirmationMessage = '你确定离开此页面吗?系统将断开websockt连接';
        // (e || window.event).returnValue = confirmationMessage;
        return '';
      }else{
        return '';
      }
    }catch(e){
      message.error(e);
    }

  }
  openPaymentModal =async()=>{
    //嵌入
    // const response = await axios.post('http://localhost:4242/create-checkout-implant');
    const clientSecret = 'cs_test_a1Itl51hY6GBo2t4o5dwtsmFbHVerNzbOigpAbgNHdHm6QTpgKOwkWhzUH_secret_fidwbEhqYWAnPydgaGdgYWFgYScpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ3dgYWx3YGZxSmtGamh1aWBxbGprJz8nZGlyZHx2J3gl';//response.data.clientSecret;
    console.log('clientSecret',clientSecret);
    // const stripePromise = loadStripe('pk_test_51PYPNTBpBnnhFRojHRBJPOvjzwWLT3Usb0mhMHFJfZlsXKlZIUkUBiJKK6QZWJm4ji45XKjHRpgs2x8rfe3fIIn500fpAvmHoS');
    // const stripePromise = loadStripe('pk_test_51Om8P7JFERBbGdYB9wEu4Cf2kjLOmDXD7EcJRz4NiVciSyXt6Or6VGdgi7qYjspi69AMAvGBkH8ogEClkdDH7a9J006jYmIuaH');

    this.setState({
      clientSecret:clientSecret,
      showPaymentModal:true,
      stripePromise:'stripePromise'
    })
    //托管
    // this.setState({
    //   showPaymentModal : true
    // })
  }
  openPaymentInformation =()=>{
    this.setState({
      showInputPaymentModal : true,
      pk:'pk_test_dOwPKWNaxzW12RR45NkUScQv'
    })
  }
  closePaymentModal =()=>{
    this.setState({
      showPaymentModal : false,
      showInputPaymentModal :false,
      clientSecret:'',
      pk:''
    })
  }
  changePk =(e)=>{
    this.setState({
      pk:e.target.value
    })
  }
  changeclientSecret =(e)=>{
    this.setState({
      clientSecret:e.target.value
    })
  }
  handleOk = async () => {
    // const { xtoken, good } = this.state;
    
    try {
      // const response = await axios.post('http://localhost:4242/create-checkout-session');
      // const checkoutUrl = response.data.url;
      // window.open('http://localhost:4242/create-checkout-vip', 'Stripe Checkout', 'width=500,height=600');
      const stripePromise =await loadStripe(this.state.pk);
      this.setState({
        showPaymentModal : true,
        showInputPaymentModal:false,
        stripePromise :stripePromise
      })
    } catch (error) {
      message.error('Error creating checkout session:', error);
    }
  };
  
  linkTo = e => {
    if (e.key != '/doc') {
      this.props.changeMenuItem(e.key);
      if (!this.props.login) {
        message.info('请先登录', 1);
      }
    }
  };
  relieveLink = () => {
    this.props.changeMenuItem('');
  };
  logout = e => {
    e.preventDefault();
    this.props
      .logoutActions()
      .then(res => {
        if (res.payload.data.errcode == 0) {
          this.props.history.push('/');
          this.props.changeMenuItem('/');          
          localStorage.removeItem('YAPI_USER');
          message.success('退出成功! ');
        } else {
          message.error(res.payload.data.errmsg);
        }
      })
      .catch(err => {
        message.error(err);
      });
  };
  handleLogin = e => {
    e.preventDefault();
    this.props.loginTypeAction('1');
  };
  handleReg = e => {
    e.preventDefault();
    this.props.loginTypeAction('2');
  };
  checkLoginState = () => {
    this.props.checkLoginState
      .then(res => {
        if (res.payload.data.errcode !== 0) {
          this.props.history.push('/');
        }
      })
      .catch(err => {
        console.log(err);
      });
  };
  connect= () =>  {
    //判断用户是否安装MetaMask钱包插件
    if (typeof window.ethereum === "undefined") {
      //没安装MetaMask钱包进行弹框提示
      message.error("请安装MetaMask")
    } else {
      //如果用户安装了MetaMask，你可以要求他们授权应用登录并获取其账号
      window.ethereum.enable()
        .then(function (accounts) {
          // 判断是否连接以太
          if (window.ethereum.networkVersion !== "1") {
            message.error("当前网络不在以太坊")
          }
          //如果用户同意了登录请求，你就可以拿到用户的账号
          message.success("连接成功/已连接")
          console.log('用户钱包地址', accounts[0])
        }
        )
        .catch(function (reason) {
          // 如果用户拒绝了登录请求
          if (reason === "User rejected provider access") {
            message.error("用户拒绝了登录请求")
          } else {
            message.error("Erro")
          }
        });
    }
  }

  render() {
    const { login, user, msg, uid, role, studyTip, study, imageUrl } = this.props;
    const options = {
      clientSecret:this.state.clientSecret
    }
    return (
      <Header className="header-box m-header">
        <div className="content g-row">
          <Link onClick={this.relieveLink} to="/group" className="logo">
            <div className="href">
              <span className="img">
                <LogoSVG length="32px" />
              </span>
            </div>
          </Link>
          <Breadcrumb />
          <div
            className="user-toolbar"
            style={{ position: 'relative', zIndex: this.props.studyTip > 0 ? 3 : 1 }}
          >
            <Button onClick={this.openPaymentInformation} className="icon">
              <StripeImg length="32px"/>
            </Button>
            <Button onClick={this.connect} className="icon">
              <MeataMaskImg length="32px"/>
            </Button>
            {login ? (
              <ToolUser
                {...{ studyTip, study, user, msg, uid, role, imageUrl }}
                relieveLink={this.relieveLink}
                logout={this.logout}
              />
            ) : (
              ''
            )}
          </div>
        </div>
        <Modal
          title="stripe支付"
          open={this.state.showPaymentModal}
          onCancel={this.closePaymentModal}
          width={'1000px'}
          footer={null}
          style={{top:10}}
        >
          {/* 
          <div className="payment-modal">
            <form action="http://localhost:4242/create-checkout-session" method="POST">
              <button type="submit">Checkout</button>
            </form>
          </div> */}
          {this.state.stripePromise && (  // 只有在 stripePromise 存在时才渲染
            <div id="checkout">
              <EmbeddedCheckoutProvider
                stripe={this.state.stripePromise}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </Modal>
    
        <Modal
          title="stripe支付信息"
          open={this.state.showInputPaymentModal}
          onOk={this.handleOk}
          onCancel={this.closePaymentModal}
          width={'500px'}
          style={{top:10}}
        >
          <div className="pay-modal">
            <Row className="payment_model_clientSecret">
              <Input  onChange={this.changeclientSecret}  value={this.state.clientSecret}   placeholder="clientSecret"/>
            </Row>
            <Row className="payment_model_pk">
              <Input  onChange={this.changePk}  value={this.state.pk}   placeholder="公钥"/>
            </Row>
          </div>
        </Modal>
      </Header>
    );
  }
}
