import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
// import axios from 'axios';
import { connect } from 'react-redux';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, message, Drawer } from 'antd';
const FormItem = Form.Item;
import './Col-request.scss';
import AceEditor from 'client/components/AceEditor/AceEditor';
import {
  fetchCaseList,
  upColData
} from '../../../../reducer/modules/interfaceCol';

@connect(
  state => {
    return {
      currColId: state.interfaceCol.currColId,
      colpre_script: state.interfaceCol.colrequest.colpre_script,
      colafter_script: state.interfaceCol.colrequest.colafter_script
    };
  },
  {
    fetchCaseList,
    upColData
  }
)
@Form.create()
export default class ColRequest extends Component {
  static propTypes = {
    fetchCaseList: PropTypes.func,
    upColData: PropTypes.func,
    colpre_script:PropTypes.string,
    colafter_script:PropTypes.string,
    currColId: PropTypes.number,
    rows:PropTypes.array
  };
  constructor(props) {
    super(props);
    this.state = { 
      visible: false,
      colpre_script:'',
      colafter_script:''
    };
  }
  componentWillMount() {
    console.log('componentWillMount')
    this.setState({
      colpre_script: this.props.colpre_script,
      colafter_script: this.props.colafter_script
    });
  }
  componentWillUnmount() {
    console.log('col unmount');
    this.setState({
      colpre_script: '',
      colafter_script: ''
    });
  }
  handleSubmit = async () => {
    let params = {
      id: this.props.currColId,
      colpre_script: this.state.colpre_script,
      colafter_script: this.state.colafter_script
    };
    // console.log('params',params);
    let result = await this.props.upColData(params);
    if (result.payload.data.errcode === 0) {
      message.success('保存成功');
      await this.props.fetchCaseList(this.props.currColId);
    } else {
      message.success('保存失败, ' + result.payload.data.errmsg);
    }
  };

  showDrawer = () => {
    this.setState({
      visible: true
    });
  };
  onClose = () => {
    this.setState({
      visible: false
    });
  };

  render() {
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    };

    const rowdata  = this.props.rows; 
    const inputPile = [];  //定义一个数组
    for (let i = 0; i < rowdata.length; i+=1) {  // for循环数组
      var message = rowdata[i].casename+'：'+rowdata[i].id
      inputPile.push(  //将组件塞入定义的数组中
        <p key={i}>{message}</p>     //index为自定义属性
      );
    }

    // const { colpre_script, colafter_script } = this.state;

    return (
      <div className="Col-request">
        <div>
          <Button type="primary" onClick={this.showDrawer}>
            用例列表
          </Button>
          <Drawer
            title="用例对应caseid"
            placement="right"
            closable={true}
            onClose={this.onClose}
            visible={this.state.visible}
          >
            {inputPile}
          </Drawer>
        </div>
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="Pre-request Script(请求参数处理脚本)">
            <AceEditor
              data={this.state.colpre_script}
              onChange={editor => this.setState({ colpre_script: editor.text })}
              fullScreen={true}
              className="request-editor"
            />
          </FormItem>
          <FormItem {...formItemLayout} label="Pre-response Script(响应数据处理脚本)">
            <AceEditor
              data={this.state.colafter_script}
              onChange={editor => this.setState({ colafter_script: editor.text })}
              fullScreen={true}
              className="request-editor"
            />
          </FormItem>
          <FormItem style={{ textAlign: 'right' }}>
            <Button onClick={this.handleSubmit} type="primary">
              保存
            </Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}
