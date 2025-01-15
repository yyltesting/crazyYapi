import React, { Component } from 'react';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Input, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import './Label.scss';

export default class Label extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputShow: false,
      inputValue: ''
    };
  }
  static propTypes = {
    onChange: PropTypes.func,
    desc: PropTypes.string,
    cat_name: PropTypes.string
  };
  toggle = () => {
    this.setState({ inputShow: !this.state.inputShow });
  };
  handleChange = event => {
    this.setState({ inputValue: event.target.value });
  };
  componentWillReceiveProps(nextProps) {
    if (this.props.desc === nextProps.desc) {
      this.setState({
        inputShow: false
      });
    }
  }
  render() {
    return (
      <div>
        {this.props.desc && (
          <div className="component-label">
            {!this.state.inputShow ? (
              <div>
                <p>
                  简介：{this.props.desc} &nbsp;&nbsp;
                  <Tooltip title="编辑简介">
                    <EditOutlined onClick={this.toggle} className="interface-delete-icon" />
                  </Tooltip>
                </p>
              </div>
            ) : (
              <div className="label-input-wrapper">
                <Input onChange={this.handleChange} defaultValue={this.props.desc} size="small" />
                <CheckOutlined
                  className="interface-delete-icon"
                  onClick={() => {
                    this.props.onChange(this.state.inputValue);
                    this.toggle();
                  }} />
                <CloseOutlined className="interface-delete-icon" onClick={this.toggle} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
