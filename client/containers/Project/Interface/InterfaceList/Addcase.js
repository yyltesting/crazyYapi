import React, { PureComponent as Component } from 'react'
import PropTypes from 'prop-types'
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Input, Button, Select } from 'antd';
import {  nameLengthLimit } from '../../../../common.js'
const { TextArea } = Input;


const FormItem = Form.Item;
const Option = Select.Option;
function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}


class Addcase extends Component {
  static propTypes = {
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    caseid: PropTypes.number,
    catdata: PropTypes.object
  }

  Createmand = (e) => {
    console.log('thisprops',this.props);
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onSubmit(values, () => {
          this.props.form.resetFields();
        });

      }
    });
  }


  render() {
    const { getFieldDecorator, getFieldsError } = this.props.form;
    // const {demand,intro,status} = this.props.catdata;
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

    return (

      <Form onSubmit={this.Createmand} >
        <FormItem
          {...formItemLayout}
          label="模块"
        >
          {getFieldDecorator('model', {
            rules: nameLengthLimit('模块'),
            initialValue: this.props.catdata ? this.props.catdata.model || null : null
          })(
            <Input placeholder="父模块" />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="子模块"
        >
          {getFieldDecorator('submodel', {
            initialValue: this.props.catdata ? this.props.catdata.submodel || null : null
          })(
            <Input placeholder="子模块" />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="用例标题"
        >
          {getFieldDecorator('title', {
            rules: nameLengthLimit('用例标题'),
            initialValue: this.props.catdata ? this.props.catdata.title || null : null
          })(
            <TextArea placeholder="用例标题" autoSize/>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="前置条件"
        >
          {getFieldDecorator('preconditions', {
            initialValue: this.props.catdata ? this.props.catdata.preconditions || null : null
          })(
            <TextArea placeholder="前置条件" autoSize/>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="步骤"
        >
          {getFieldDecorator('step', {
            initialValue: this.props.catdata ? this.props.catdata.step || null : null
          })(
            <TextArea placeholder="步骤" autoSize/>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="预期结果"
        >
          {getFieldDecorator('expect', {
            rules: nameLengthLimit('预期结果'),
            initialValue: this.props.catdata ? this.props.catdata.expect || null : null
          })(
            <TextArea placeholder="预期结果" autoSize/>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="备注"
        >
          {getFieldDecorator('remarks', {
            initialValue: this.props.catdata ? this.props.catdata.remarks || null : null
          })(
            <TextArea placeholder="备注" autoSize/>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="版本号"
        >
          {getFieldDecorator('version', {
            initialValue: this.props.catdata ? this.props.catdata.version || null : null
          })(
            <TextArea placeholder="版本号" autoSize/>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="优先级"
        >
          {getFieldDecorator('priority', {
            initialValue: this.props.catdata ? this.props.catdata.priority || null : null
          })(
            <Input placeholder="优先级" />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="状态"
        >
          {getFieldDecorator('status', {
            rules: [{
              required: true, message: '请选择状态!'
            }],
            initialValue: this.props.catdata ? this.props.catdata.status || null : null
          })(
            <Select
            initialValue=''
            className="select"
            >
              <Option value={'undone'}>
                <span className="tag-status undone">待执行</span>
              </Option>
              <Option value={'pass'}>
                <span className="tag-status done">通过</span>
              </Option>
              <Option value={'fail'}>
                <span className="tag-status stoping">失败</span>
              </Option>
              <Option value={'legacy'}>
                <span className="tag-status deprecated">遗留</span>
              </Option>
            </Select>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="接口用例key"
        >
          {getFieldDecorator('interface_caseid', {
            initialValue: this.props.catdata ? this.props.catdata.interface_caseid || null : null
          })(
            <Input placeholder="接口用例key" />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="注"
        >
          <span style={{ color: "#929292" }}>用例参照该用例设计</span>
        </FormItem>
        <FormItem className="catModalfoot" wrapperCol={{ span: 24, offset: 8 }} >
          <Button onClick={this.props.onCancel} style={{ marginRight: "10px" }}  >取消</Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={hasErrors(getFieldsError())}
          >
            提交
          </Button>
        </FormItem>

      </Form>

    );
  }
}

export default Form.create()(Addcase);
