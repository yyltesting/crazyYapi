import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import AceEditor from 'client/components/AceEditor/AceEditor';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Select, Input, Tooltip, Row, Col, message, Modal } from 'antd';
const Option = Select.Option;

class BachUpCase extends Component {
    static propTypes = {
        reqBodyType: PropTypes.string,
        caseIds: PropTypes.array,
        upCaseids: PropTypes.array,
        showSyncModel: PropTypes.bool,
        syncForInterface: PropTypes.bool,
        interFaceid: PropTypes.number,
        isClose:PropTypes.func,
        projectId:PropTypes.number,
        curProject:PropTypes.object
    };


    constructor(props) {
        super(props);

        this.state = {
            visible: false,
            showSyncModel: this.props.showSyncModel,
            case_env: '',
            env: this.props.curProject.env,
            upjsonname: '',
            addjsonname: '',
            deljsonname: '',
            newjsonname: '',
            addjsonvlue: '',
            addjsonvalueType: 'String',
            upjsonvalue: '',
            upstr: '',
            upnewstr: '',
            uptestscriptstr: '',
            uptestscriptnewstr: '',
            upprescriptstr: '',
            upprescriptnewstr: '',
            upafterscriptstr: '',
            upafterscriptnewstr: '',
            upcaseids: this.props.upCaseids,
            caseids: this.props.caseIds,
            interfaceid:this.props.interFaceid,
            interfacelist:[],
            data:{}
        }
    }
    async componentWillMount() {
      if(!this.props.syncForInterface){
        //关联用例集
        let result = await axios.get('/api/interface/list/simple?project_id=' + this.props.projectId);
        this.setState({
          interfacelist:result.data.data
        })
      }
    }
    Syncbody = async () => {
        try {
            //根据添加值类型处理数据
            let addjsonvalue;
            if (this.state.addjsonvalueType == 'String') {
                addjsonvalue = ""
            } else if (this.state.addjsonvalueType == 'Array') {
                addjsonvalue = []
            } else if (this.state.addjsonvalueType == 'object') {
                addjsonvalue = {}
            } else if (this.state.addjsonvalueType == 'number') {
                addjsonvalue = 1
            } else if (this.state.addjsonvalueType == 'boolean') {
                addjsonvalue = true
            }
            let result = await axios.post('/api/col/bachUpcase', {
              interfaceid: this.state.interfaceid,
              case_env:this.state.case_env,
              headers:this.state.headers,
              upjsonname: this.state.upjsonname,
              newjsonname: this.state.newjsonname,
              addjsonname: this.state.addjsonname,
              addjsonvlue: addjsonvalue,
              deljsonname: this.state.deljsonname,
              upjsonvalue: this.state.upjsonvalue,
              upstr: this.state.upstr,
              upnewstr: this.state.upnewstr,
              uptestscriptstr: this.state.uptestscriptstr,
              uptestscriptnewstr: this.state.uptestscriptnewstr,
              upprescriptstr: this.state.upprescriptstr,
              upprescriptnewstr: this.state.upprescriptnewstr,
              upafterscriptstr: this.state.upafterscriptstr,
              upafterscriptnewstr: this.state.upafterscriptnewstr,
              upcaseids: this.state.upcaseids
            });

            this.setState({
                showSyncModel: false,
                upjsonname: '',
                addjsonname: '',
                deljsonname: '',
                newjsonname: '',
                addjsonvlue: '',
                upjsonvalue: '',
                upstr: '',
                upnewstr: '',
                uptestscriptstr: '',
                uptestscriptnewstr: '',
                addjsonvalueType: 'String',
                upcaseids: [],
                data:{},
                case_env:''
            })
            this.props.isClose();
            if (result.data.errcode !== 200) {
                message.error(result.data.errmsg)
            } else {
                message.success("更新用例成功")
            }

        } catch (e) {
            message.error(e)
        }

    }
    setInterfaceid = async (value) => {
      await this.setState({ interfaceid:parseInt(value) });
    }
    setUpcaseid = async (value) => {
      await this.setState({ upcaseids: value });
    }
    addjsonvalueType =(value)=>{
      this.setState({
        addjsonvalueType : value
      })
    }
    // 处理 req_body_other Editor
    handleReqBodyup = d => {
      this.setState({
          upjsonvalue: d.text
      });
    };
    //更新基础信息header
    handleReqHeaderup = d =>{
      this.setState({
        headers: d.text
      });
    }
    selectDomain = async value => {
      await this.setState({ case_env:value });
    };
    render() {
      const caseids = [];
      this.state.caseids.forEach(item=>{
        caseids.push(<Option key={item.toString() }>{item.toString()}</Option>);
      })
      const interfaceids = [];
      this.state.interfacelist.forEach(item=>{
        interfaceids.push(<Option key={item._id.toString()}>{item._id+' '+item.title+' '+item.path+' '+item.status+' '+item.tag}</Option>);
      })
      const case_env = [];
      this.state.env.forEach(item=>{
        case_env.push(<Option key={item._id.toString()}>{item.name+' '+item.domain}</Option>);
      })
      return (
        <div>
          <Modal
            title="用例批量更新 注意更新的参数值有无互斥关系"
            visible={this.state.showSyncModel}
            onOk={this.Syncbody}
            onCancel={() => {
              this.setState({ showSyncModel: false });
              this.props.isClose();
            }}
            width={'1000px'}
          >
            {!this.props.syncForInterface && (
              <div>
                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>关联接口id:&nbsp;<Tooltip title={'关联接口id'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px',width:'500px' }} span={6}>
                    <Select
                      showSearch
                      filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                      style={{ width: '100%' }}
                      placeholder="关联接口id"
                      value={this.state.interfaceid}
                      onChange={this.setInterfaceid}
                    >
                      {interfaceids}
                    </Select>
                  </Col>
                </Row>
              </div>
            )}
            <div>
              <Row className="sync-item" style={{ lineHeight: '35px' }}>
                <Col className="sync-item" span={4}>
                  <label>运行环境:&nbsp;<Tooltip title={'关联环境id'}>
                    <QuestionCircleOutlined style={{ width: '10px' }} />
                  </Tooltip></label>
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px',width:'500px' }} span={6}>
                  <Select
                    value={this.state.case_env}
                    style={{ width: '100%' }}
                    placeholder="关联envid"
                    onChange={this.selectDomain}
                  >
                    {case_env}
                  </Select>
                </Col>
              </Row>
            </div>
            {this.props.reqBodyType === 'json'||!this.props.syncForInterface ? (
              <div className="common-sync-modal">
                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>更新header参数值:&nbsp;<Tooltip title={'更新用例的header值,以json的形式书写'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px',width:'500px' }} span={6}>
                    <AceEditor
                      // data={this.state.upjsonvalue}
                      style={{width: '100%', height: '50px' }}
                      onChange={this.handleReqHeaderup}
                      fullScreen={true}
                    />
                  </Col>
                </Row>
                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>替换jsonbody参数名:&nbsp;<Tooltip title={'替换用例的参数名称，仅支持第一层json参数名'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Input onChange={(e) => { this.setState({ upjsonname: e.target.value }) }} value={this.state.upjsonname} placeholder="需要替换的参数名称" />
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Input onChange={(e) => { this.setState({ newjsonname: e.target.value }) }} value={this.state.newjsonname} placeholder="更新后参数名称" />
                  </Col>
                </Row>

                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>新增jsonbody参数:&nbsp;<Tooltip title={'新增body参数'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Input onChange={(e) => { this.setState({ addjsonname: e.target.value }) }} value={this.state.addjsonname} placeholder="需要新增的参数名称" />
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Select style={{ width: 120 }} defaultValue={this.state.addjsonvalueType} onChange={this.addjsonvalueType}>
                      <Option value="String">String</Option>
                      <Option value="Array">Array</Option>
                      <Option value="object">object</Option>
                      <Option value="number">number</Option>
                      <Option value="boolean">boolean</Option>
                    </Select>
                  </Col>
                </Row>

                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>删除jsonbody参数:&nbsp;<Tooltip title={'删除body参数'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Input onChange={(e) => { this.setState({ deljsonname: e.target.value }) }} value={this.state.deljsonname} placeholder="需要删除的参数名称" />
                  </Col>
                </Row>

                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>更新jsonbody参数值:&nbsp;<Tooltip title={'替换用例的参数值,以json的形式书写'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px',width:'500px' }} span={6}>
                    <AceEditor
                      style={{width: '100%', height: '100px' }}
                      data={this.state.upjsonvalue}
                      onChange={this.handleReqBodyup}
                      fullScreen={true}
                    />
                  </Col>
                </Row>

                <Row className="sync-item" style={{ lineHeight: '35px' }}>
                  <Col className="sync-item" span={4}>
                    <label>替换jsonbody字符串:&nbsp;<Tooltip title={'替换用例的字符串'}>
                      <QuestionCircleOutlined style={{ width: '10px' }} />
                    </Tooltip></label>
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Input onChange={(e) => { this.setState({ upstr: e.target.value }) }} value={this.state.upstr} placeholder="需要替换的字符串" />
                  </Col>
                  <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                    <Input onChange={(e) => { this.setState({ upnewstr: e.target.value }) }} value={this.state.upnewstr} placeholder="更新后字符串" />
                  </Col>
                </Row>
              </div>
            ):(null)}
            <div>
              <Row className="sync-item" style={{ lineHeight: '35px' }}>
                <Col className="sync-item" span={4}>
                  <label>用例断言替换字符串:&nbsp;<Tooltip title={'替换用例的断言字符串'}>
                    <QuestionCircleOutlined style={{ width: '10px' }} />
                  </Tooltip></label>
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                  <Input onChange={(e) => { this.setState({ uptestscriptstr: e.target.value }) }} value={this.state.uptestscriptstr} placeholder="需要替换的字符串" />
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                  <Input onChange={(e) => { this.setState({ uptestscriptnewstr: e.target.value }) }} value={this.state.uptestscriptnewstr} placeholder="更新后字符串" />
                </Col>
              </Row>

              <Row className="sync-item" style={{ lineHeight: '35px' }}>
                <Col className="sync-item" span={4}>
                  <label>前置JS处理器:&nbsp;<Tooltip title={'替换前置JS处理器字符串'}>
                    <QuestionCircleOutlined style={{ width: '10px' }} />
                  </Tooltip></label>
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                  <Input onChange={(e) => { this.setState({ upprescriptstr: e.target.value }) }} value={this.state.upprescriptstr} placeholder="需要替换的字符串" />
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                  <Input onChange={(e) => { this.setState({ upprescriptnewstr: e.target.value }) }} value={this.state.upprescriptnewstr} placeholder="更新后字符串" />
                </Col>
              </Row>

              <Row className="sync-item" style={{ lineHeight: '35px' }}>
                <Col className="sync-item" span={4}>
                  <label>后置JS处理器:&nbsp;<Tooltip title={'替换后置JS处理器字符串'}>
                    <QuestionCircleOutlined style={{ width: '10px' }} />
                  </Tooltip></label>
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                  <Input onChange={(e) => { this.setState({ upafterscriptstr: e.target.value }) }} value={this.state.upafterscriptstr} placeholder="需要替换的字符串" />
                </Col>
                <Col className="sync-item" style={{ marginRight: '10px', padding: '5px' }} span={6}>
                  <Input onChange={(e) => { this.setState({ upafterscriptnewstr: e.target.value }) }} value={this.state.upafterscriptnewstr} placeholder="更新后字符串" />
                </Col>
              </Row>
              <Row className='sync-item' style={{ lineHeight: '35px' }}>
                <Col className="sync-item" span={4}>
                  <label>需要更新的用例:&nbsp;<Tooltip title={'指定需要更新的用例id'}>
                    <QuestionCircleOutlined style={{ width: '10px' }} />
                  </Tooltip></label>
                </Col>
                <Col className="sync-item" span={6} >
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="请选择需要更新的用例,默认全部"
                    value={this.state.upcaseids}
                    defaultValue={this.props.upCaseids}
                    onChange={this.setUpcaseid}
                  >
                    {caseids}
                  </Select>
                </Col>
              </Row>
            </div>
          </Modal>
        </div>
      );
    }
}
export default BachUpCase;