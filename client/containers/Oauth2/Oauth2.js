import React,{ PureComponent as Component } from 'react';

class Oauth2 extends Component {
    constructor(props) {
        super(props);
        this.state = {
            access_token: ''
        };
      }
    componentWillMount(){
        // 获取当前 URL 中的参数
        const urlParams = new URLSearchParams(window.location.hash);
        // 获取 access_token 参数的值
        const accessToken = urlParams.get('access_token');

        this.setState({access_token:accessToken});
        window.localStorage.setItem('access_token',accessToken);
    }



    render() {
        return (
          <div className="googoleAuth">
            <h1>Token：</h1>
            <p>{this.state.access_token}</p>
          </div>
        );
      }
}


export default Oauth2;


