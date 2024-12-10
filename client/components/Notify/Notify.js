import React, { Component } from 'react';
import { Alert} from 'antd';



export default class Notify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: process.env.version
    };
  }


  render() {
    return (
      <div>
        <Alert
          message={
            <div>
              当前版本是：{this.state.version}
              &nbsp;&nbsp;&nbsp;
              <a
                target="view_window"
                href="https://github.com/yyltesting/crazy-yapi/blob/master/README.md"
              >
                版本详情
              </a>
            </div>
          }
          banner
          closable
          type="info"
        />
      </div>
    );
  }
}
