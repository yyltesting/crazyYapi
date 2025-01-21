import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, message } from 'antd';
const FormItem = Form.Item;
import './project-request.scss';
import AceEditor from 'client/components/AceEditor/AceEditor';
import { updateProjectScript, getProject } from '../../../../reducer/modules/project';

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  },
  {
    updateProjectScript,
    getProject
  }
)
@Form.create()
export default class ProjectRequest extends Component {
  static propTypes = {
    projectMsg: PropTypes.object,
    updateProjectScript: PropTypes.func,
    getProject: PropTypes.func,
    projectId: PropTypes.number
  };

  componentWillMount() {
    this.setState({
      pre_script: this.props.projectMsg.pre_script,
      after_script: this.props.projectMsg.after_script,
      global_script: this.props.projectMsg.global_script
    });
  }

  handleSubmit = async () => {
    let result = await this.props.updateProjectScript({
      id: this.props.projectId,
      global_script: this.state.global_script,
      pre_script: this.state.pre_script,
      after_script: this.state.after_script
    });
    if (result.payload.data.errcode === 0) {
      message.success('保存成功');
      await this.props.getProject(this.props.projectId);
    } else {
      message.success('保存失败, ' + result.payload.data.errmsg);
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

    const { pre_script, after_script,global_script } = this.state;

    return (
      <div className="project-request">
        <Form onSubmit={this.handleSubmit}>
          <FormItem {...formItemLayout} label="全局公共方法(只做方法定义给工程/集合/用例脚本使用）">
            <AceEditor
              data={global_script}
              onChange={editor => this.setState({ global_script: editor.text })}
              fullScreen={true}
              className="request-editor"
            />
          </FormItem>
          <FormItem {...formItemLayout} label="Pre-request Script(请求参数处理脚本)">
            <AceEditor
              data={pre_script}
              onChange={editor => this.setState({ pre_script: editor.text })}
              fullScreen={true}
              className="request-editor"
            />
          </FormItem>
          <FormItem {...formItemLayout} label="Pre-response Script(响应数据处理脚本)">
            <AceEditor
              data={after_script}
              onChange={editor => this.setState({ after_script: editor.text })}
              fullScreen={true}
              className="request-editor"
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
