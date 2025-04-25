import React, { PureComponent as Component } from 'react';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, message } from 'antd';
const FormItem = Form.Item;
import './Config.scss';
import AceEditor from 'client/components/AceEditor/AceEditor';
import axios from 'axios';
import { setBreadcrumb } from '../../reducer/modules/user';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

@Form.create()
@connect(
  null,
  {
    setBreadcrumb
  }
)
export default class Config extends Component {
  static propTypes = {
    setBreadcrumb: PropTypes.func
  };
  constructor(props) {
    super(props);
    this.state = {
      global_config: ''
    };
  }
  async componentWillMount() {
    this.props.setBreadcrumb([{ name: '全局配置' }]);
    let result = await axios.get('/api/global/getconfig');
    let global_config;
    if(!result.data.data){
      global_config = '';
    }else{
      global_config = result.data.data.config;
    }
    this.setState({
      global_config: global_config
    });
  }

  handleSubmit = async () => {
    let result = await axios.post('/api/global/upconfig', {
      config: this.state.global_config,
    });
    if (result.data.errcode === 0) {
      message.success('保存成功');
      // await this.props.getProject(this.props.projectId);
    } else {
      message.success('保存失败, ' + result.data.errmsg);
    }
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

    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0
        },
        sm: {
          span: 16,
          offset: 8
        }
      }
    };


    return (
      <div className="global-config">
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="全局配置文件">
            <AceEditor
              data={this.state.global_config}
              onChange={editor => this.setState({ global_config: editor.text })}
              fullScreen={true}
              className="config-editor"
              style={{width: '100%', height: '500px' }}
            />
          </FormItem>
          <FormItem {...tailFormItemLayout}>
            <Button onClick={this.handleSubmit} type="primary">
              保存
            </Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}
