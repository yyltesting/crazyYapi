import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Row } from 'antd';
import Config from './Config.js';
@connect()
class Glob extends Component {
  static propTypes = {
    match: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="g-doc">
          <Row className="global-config-box">
            <Route path={this.props.match.path + '/config'} component={Config} />
          </Row>
        </div>
      </div>
    );
  }
}

export default Glob;
