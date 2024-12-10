import './Footer.scss';
import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { Row, Col,message} from 'antd';
import { Icon } from 'antd';
const {
  getsocket,
  cleansocket
} = require('common/postmanLib.js');
const version = process.env.version;
class Footer extends Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    footList: PropTypes.array
  };
  render() {
    return (
      <div className="footer-wrapper">
        <Row className="footer-container">
          {this.props.footList.map(function(item, i) {
            return (
              <FootItem
                key={i}
                linkList={item.linkList}
                title={item.title}
                iconType={item.iconType}
              />
            );
          })}
        </Row>
      </div>
    );
  }
}

class FootItem extends Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    linkList: PropTypes.array,
    title: PropTypes.string,
    iconType: PropTypes.string
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

  render() {
    return (
      <Col span={6}>
        <h4 className="title">
          {this.props.iconType ? <Icon type={this.props.iconType} className="icon" /> : ''}
          {this.props.title}
        </h4>
        {this.props.linkList.map(function(item, i) {
          return (
            <p key={i}>
              <a href={item.itemLink} className="link">
                {item.itemTitle}
              </a>
            </p>
          );
        })}
      </Col>
    );
  }
}

Footer.defaultProps = {
  footList: [
    {
      title: 'GitHub',
      iconType: 'github',
      linkList: [
        {
          itemTitle: 'Crazy-YApi 源码仓库',
          itemLink: 'https://github.com/yyltesting/crazy-yapi'
        }
      ]
    },
    {
      title: '反馈',
      iconType: 'aliwangwang-o',
      linkList: [
        {
          itemTitle: 'Github Issues',
          itemLink: 'https://github.com/yyltesting/crazy-yapi/issues'
        },
        {
          itemTitle: 'Github Pull Requests',
          itemLink: 'https://github.com/yyltesting/crazy-yapi/pulls'
        }
      ]
    },
    {
      title: '接口自动化测试之家',
      linkList: [
        {
          itemTitle: `版本: crazy-${version} `,
          itemLink: 'https://github.com/yyltesting/crazy-yapi/blob/master/README.md'
        },
        {
          itemTitle: '使用文档',
          itemLink: '/doc/index.html'
        }
      ]
    }
  ]
};

export default Footer;
