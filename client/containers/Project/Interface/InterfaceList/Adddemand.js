import React, { PureComponent as Component } from 'react'
import PropTypes from 'prop-types'
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Input, Button, Select } from 'antd';
import {  nameLengthLimit } from '../../../../common.js'

const TextArea = Input.TextArea;
const FormItem = Form.Item;
const Option = Select.Option;
function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field]);
}


class Adddemand extends Component {
  static propTypes = {
    form: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    catid: PropTypes.number,
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
          label="需求标题"
        >
          {getFieldDecorator('demand', {
            rules: nameLengthLimit('需求'),
            initialValue: this.props.catdata ? this.props.catdata.demand || null : null
          })(
            <Input placeholder="需求标题" />
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="需求描述"
        >
          {getFieldDecorator('intro', {
            rules: [{
              required: true, message: '请输入描述!'
            }],
            initialValue: this.props.catdata ? this.props.catdata.intro || null : null
          })(
            <TextArea placeholder="描述" autoSize={{ minRows: 3, maxRows: 5 }}/>
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
              <Option value={'done'}>
                <span className="tag-status done">已发布</span>
              </Option>
              <Option value={'design'}>
                <span className="tag-status design">设计中</span>
              </Option>
              <Option value={'undone'}>
                <span className="tag-status undone">开发中</span>
              </Option>
              <Option value={'testing'}>
                <span className="tag-status testing">已提测</span>
              </Option>
              <Option value={'deprecated'}>
                <span className="tag-status deprecated">已过时</span>
              </Option>
              <Option value={'stoping'}>
                <span className="tag-status stoping">暂停开发</span>
              </Option>
            </Select>
            )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="注"
        >
          <span style={{ color: "#929292" }}>详细用例需对应需求库</span>
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

export default Form.create()(Adddemand);
