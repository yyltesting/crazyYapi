import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Modal, Input, Tooltip, Select, message, Button, Row, Col } from 'antd';
import {
  updateProject,
  fetchProjectList,
  delProject,
  changeUpdateModal,
  changeTableLoading
} from '../../../reducer/modules/project';
const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;

import './ProjectList.scss';

// layout
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 }
  }
};
const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 6 }
  }
};
let uuid = 0;

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      isUpdateModalShow: state.project.isUpdateModalShow,
      handleUpdateIndex: state.project.handleUpdateIndex,
      tableLoading: state.project.tableLoading,
      currGroup: state.group.currGroup
    };
  },
  {
    fetchProjectList,
    updateProject,
    delProject,
    changeUpdateModal,
    changeTableLoading
  }
)
class UpDateModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      protocol: 'http://',
      envProtocolChange: 'http://'
    };
  }
  static propTypes = {
    form: PropTypes.object,
    fetchProjectList: PropTypes.func,
    updateProject: PropTypes.func,
    delProject: PropTypes.func,
    changeUpdateModal: PropTypes.func,
    changeTableLoading: PropTypes.func,
    projectList: PropTypes.array,
    currGroup: PropTypes.object,
    isUpdateModalShow: PropTypes.bool,
    handleUpdateIndex: PropTypes.number
  };

  // 修改线上域名的协议类型 (http/https)
  protocolChange = value => {
    this.setState({
      protocol: value
    });
  };

  handleCancel = () => {
    this.props.form.resetFields();
    this.props.changeUpdateModal(false, -1);
  };

  // 确认修改
  handleOk = e => {
    e.preventDefault();
    const {
      form,
      updateProject,
      changeUpdateModal,
      currGroup,
      projectList,
      handleUpdateIndex,
      fetchProjectList,
      changeTableLoading
    } = this.props;
    form.validateFields((err, values) => {
      if (!err) {
        // console.log(projectList[handleUpdateIndex]);
        let assignValue = Object.assign(projectList[handleUpdateIndex], values);
        values.protocol = this.state.protocol.split(':')[0];
        assignValue.env = assignValue.envs.map((item, index) => {
          return {
            name: values['envs-name-' + index],
            domain: values['envs-protocol-' + index] + values['envs-domain-' + index]
          };
        });
        // console.log(assignValue);

        changeTableLoading(true);
        updateProject(assignValue)
          .then(res => {
            if (res.payload.data.errcode == 0) {
              changeUpdateModal(false, -1);
              message.success('修改成功! ');
              fetchProjectList(currGroup._id).then(() => {
                changeTableLoading(false);
              });
            } else {
              changeTableLoading(false);
              message.error(res.payload.data.errmsg);
            }
          })
          .catch(() => {
            changeTableLoading(false);
          });
        form.resetFields();
      }
    });
  };

  // 项目的修改操作 - 删除一项环境配置
  remove = id => {
    const { form } = this.props;
    // can use data-binding to get
    const envs = form.getFieldValue('envs');
    // We need at least one passenger
    if (envs.length === 0) {
      return;
    }

    // can use data-binding to set
    form.setFieldsValue({
      envs: envs.filter(key => {
        const realKey = key._id ? key._id : key;
        return realKey !== id;
      })
    });
  };

  // 项目的修改操作 - 添加一项环境配置
  add = () => {
    uuid++;
    const { form } = this.props;
    // can use data-binding to get
    const envs = form.getFieldValue('envs');
    const nextKeys = envs.concat(uuid);
    // can use data-binding to set
    // important! notify form to detect changes
    form.setFieldsValue({
      envs: nextKeys
    });
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    // const that = this;
    const { isUpdateModalShow, projectList, handleUpdateIndex } = this.props;
    let initFormValues = {};
    let envMessage = [];
    // 如果列表存在且用户点击修改按钮时，设置表单默认值
    if (projectList.length !== 0 && handleUpdateIndex !== -1) {
      // console.log(projectList[handleUpdateIndex]);
      const { name, basepath, desc, env } = projectList[handleUpdateIndex];
      initFormValues = { name, basepath, desc, env };
      if (env.length !== 0) {
        envMessage = env;
      }
      initFormValues.prd_host = projectList[handleUpdateIndex].prd_host;
      initFormValues.prd_protocol = projectList[handleUpdateIndex].protocol + '://';
    }

    getFieldDecorator('envs', { initialValue: envMessage });
    const envs = getFieldValue('envs');
    const formItems = envs.map((k, index) => {
      const secondIndex = 'next' + index; // 为保证key的唯一性
      return (
        <Row key={index} type="flex" justify="space-between" align={index === 0 ? 'middle' : 'top'}>
          <Col span={10} offset={2}>
            <FormItem label={index === 0 ? <span>环境名称</span> : ''} required={false} key={index}>
              {getFieldDecorator(`envs-name-${index}`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: envMessage.length !== 0 ? k.name : '',
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    validator(rule, value, callback) {
                      if (value) {
                        if (value.length === 0) {
                          callback('请输入环境域名');
                        } else if (!/\S/.test(value)) {
                          callback('请输入环境域名');
                        } else if (/prd/.test(value)) {
                          callback('环境域名不能是"prd"');
                        } else {
                          return callback();
                        }
                      } else {
                        callback('请输入环境域名');
                      }
                    }
                  }
                ]
              })(<Input placeholder="请输入环境名称" style={{ width: '90%', marginRight: 8 }} />)}
            </FormItem>
          </Col>
          <Col span={10}>
            <FormItem
              label={index === 0 ? <span>环境域名</span> : ''}
              required={false}
              key={secondIndex}
            >
              {getFieldDecorator(`envs-domain-${index}`, {
                validateTrigger: ['onChange', 'onBlur'],
                initialValue: envMessage.length !== 0 && k.domain ? k.domain.split('//')[1] : '',
                rules: [
                  {
                    required: false,
                    whitespace: true,
                    message: '请输入环境域名',
                    validator(rule, value, callback) {
                      if (value) {
                        if (value.length === 0) {
                          callback('请输入环境域名');
                        } else if (!/\S/.test(value)) {
                          callback('请输入环境域名');
                        } else {
                          return callback();
                        }
                      } else {
                        callback('请输入环境域名');
                      }
                    }
                  }
                ]
              })(
                <Input
                  placeholder="请输入环境域名"
                  style={{ width: '90%', marginRight: 8 }}
                  addonBefore={getFieldDecorator(`envs-protocol-${index}`, {
                    initialValue:
                      envMessage.length !== 0 && k.domain
                        ? k.domain.split('//')[0] + '//'
                        : 'http://',
                    rules: [
                      {
                        required: true
                      }
                    ]
                  })(
                    <Select>
                      <Option value="http://">{'http://'}</Option>
                      <Option value="https://">{'https://'}</Option>
                    </Select>
                  )}
                />
              )}
            </FormItem>
          </Col>
          <Col span={2}>
            {/* 新增的项中，只有最后一项有删除按钮 */}
            {(envs.length > 0 && k._id) || envs.length == index + 1 ? (
              <MinusCircleOutlined
                className="dynamic-delete-button"
                onClick={() => {
                  return this.remove(k._id ? k._id : k);
                }} />
            ) : null}
          </Col>
        </Row>
      );
    });
    return (
      <Modal
        title="修改项目"
        open={isUpdateModalShow}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <Form>
          <FormItem {...formItemLayout} label="项目名称">
            {getFieldDecorator('name', {
              initialValue: initFormValues.name,
              rules: [
                {
                  required: true,
                  message: '请输入项目名称!'
                }
              ]
            })(<Input />)}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                线上域名&nbsp;
                <Tooltip title="将根据配置的线上域名访问mock数据">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('prd_host', {
              initialValue: initFormValues.prd_host,
              rules: [
                {
                  required: true,
                  message: '请输入项目线上域名!'
                }
              ]
            })(
              <Input
                addonBefore={
                  <Select defaultValue={initFormValues.prd_protocol} onChange={this.protocolChange}>
                    <Option value="http://">{'http://'}</Option>
                    <Option value="https://">{'https://'}</Option>
                  </Select>
                }
              />
            )}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                基本路径&nbsp;
                <Tooltip title="基本路径为空表示根路径">
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            {getFieldDecorator('basepath', {
              initialValue: initFormValues.basepath,
              rules: [
                {
                  required: false,
                  message: '请输入项目基本路径! '
                }
              ]
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="描述">
            {getFieldDecorator('desc', {
              initialValue: initFormValues.desc,
              rules: [
                {
                  required: false,
                  message: '请输入描述!'
                }
              ]
            })(<TextArea rows={4} />)}
          </FormItem>

          {formItems}
          <FormItem {...formItemLayoutWithOutLabel}>
            <Button type="dashed" onClick={this.add} style={{ width: '60%' }}>
              <PlusOutlined /> 添加环境配置
            </Button>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(UpDateModal);
