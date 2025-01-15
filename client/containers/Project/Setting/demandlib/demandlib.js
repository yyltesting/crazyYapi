import React from 'react';
import PropTypes, { number } from 'prop-types';
import {getProject} from '../../../../reducer/modules/project.js';
import {demandlist} from '../../../../reducer/modules/demand.js'
import {connect} from 'react-redux';
import axios from 'axios';
import { CodepenCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Modal, Table, Button, Layout, Select, Tooltip, Input } from 'antd';
import { withRouter } from 'react-router';
import './demandlib.scss';
import Adddemand from '../../Interface/InterfaceList/Adddemand.js';
import Caselib  from '../Caselib/Caselib.js';
const { Content } = Layout;
const {TextArea} = Input;
const Option = Select.Option;


// import {Empty} from 'antd';
// UploadFile.propTypes = {
//   close: PropTypes.fun,
//   id: PropTypes.string,
// };

const apistatusArr = [
  {
    text: '已发布',
    value: 'done'
  },
  {
    text: '设计中',
    value: 'design'
  },
  {
    text: '开发中',
    value: 'undone'
  },
  {
    text: '已提测',
    value: 'testing'
  },
  {
    text: '已过时',
    value: 'deprecated'
  },
  {
    text: '暂停开发',
    value: 'stoping'
  }
];
@connect(
  state => {
    return {
      curProject: state.project.currProject,
      demandlist: state.demand.demandlist
    };
  },
  {
    getProject,
    demandlist
  }
)
@withRouter
export class demandlib extends React.Component {
  static propTypes = {
    curProject: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    demandlist: PropTypes.func
  }
  constructor(props) {
    super(props);
    this.state = {
      tableData: [],
      tableHeader: [],
      add:false,
      edit:false,
      editid:number,
      editdata:{},
      addcaseid:number,
      addcase:false,
      demandDesc:'',
      aiCreateCaseid:number,
      aiCreateCaseModel:false,
      promptDesc:`你现在是一个专业的测试人员，可以按照需求文档来编写测试用例，下面我会给你需求文档后请输出测试用例,测试用例以json的方式给我。用例的要求：
1. 生成的用例标题尽量详细一点
2. 用例分为模块model、子模块submodel、标题title、预设条件preconditions、步骤step、预期结果expect、备注remarks、优先级priority、状态status 九个部分
3. 用例需要包含通常的功能用例、非功能用例；功能用例，按需求点输出；非功能用例，需要考虑安全、异常、兼容等
4. 用例的输出格式用json格式，在json格式中,每条用例为一个对象，以json数组对象的方式给到我所有的用例
5. status的值都为undone,所有字段值类型都为string,所有字段值都不能为空
6. 生成的主key名为test_cases
7. 输出前请检查格式要求和内容要求是否满足。`
    };
  }
  async componentWillMount() {
    let result = await this.props.demandlist(this.props.curProject._id);
    let tableData = result.payload.data.data;
    this.setState(
      {
        tableData:tableData
      }
    )
  }
  Opendemand = () =>{
    console.log(this.props);
    this.setState(
      {
        add:true
      }
    )
  }
  aiCreateCaselib = ()=>{
    let data = {
      demandDesc :  this.state.demandDesc,
      promptDesc:  this.state.promptDesc,
      demandid: this.state.aiCreateCaseid
    }
    axios.post('/api/openai/creatcaselib', data).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 生成出错`);
      }
      message.success('生成完成');
    });
    message.success('正在生成用例');
    this.setState({aiCreateCaseModel:false,aiCreateCaseid:0})
  }
  onChangeDemandDesc = ({ target: { value } }) => {
    this.setState({ demandDesc:value });
  };
  onChangePromptDesc = ({ target: { value } }) => {
    this.setState({ promptDesc:value });
  };
  aiCreateCaseModel=(id,intro)=>{
    this.setState({
      aiCreateCaseModel:true,
      aiCreateCaseid:id,
      demandDesc:intro
    })
  }
  Opencaselib = (id) =>{
    console.log(this.props);
    this.setState(
      {
        addcase:true,
        addcaseid:id
      }
    )
  }
  Openeditdemand = (id,record) =>{
    this.setState(
      {
        edit:true,
        editid:id,
        editdata:record
      }
    )
  }
  // 重新获取列表
  reFetchList = () => {
    this.props.demandlist(this.props.curProject._id).then(res => {
      this.setState({
        tableData: res.payload.data.data,
        add:false,
        edit:false
      });
    });
  };
//添加需求
  Createmand = async data => {
    data.project_id = this.props.curProject._id;
    await axios.post('/api/demand/add', data).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 添加需求出错`);
      }
      message.success('添加成功');
    });
    this.reFetchList();
  }
//编辑需求
  Editdemand = async data => {
    data.demand_id = this.state.editid;
    await axios.post('/api/demand/edit', data).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 添加需求出错`);
      }
      message.success('更新成功');
    });
    this.reFetchList();
  }
//删除需求
  Deletedemand = async id =>{
    const params = {
      id: id
    };
    await axios.post('/api/demand/del',params).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 删除需求出错`);
      }
      message.success('删除成功');
    });
    this.reFetchList();
  }
//更新状态
changeInterfaceStatus = async value => {
  const params = {
    id: value.split('-')[0]-0,
    status: value.split('-')[1]
  };
  let result = await axios.post('/api/demand/upstatus', params);
  if (result.data.errcode === 0) {
    message.success('更新成功');
    this.reFetchList();
  } else {
    message.error(result.data.errmsg);
  }
};

render() {
  const columns = [
    {
      title: '需求',
      dataIndex: 'demand',
      key: 'demand',
      ellipsis:true,
      render: (text,record) => <Tooltip title={record.intro}><a>{text}</a></Tooltip>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text, record) => {
        const id = record._id;
        return (
          <Select
            value={id + '-' + text}
            className="select"
            onChange={this.changeInterfaceStatus}
          >
            <Option value={id + '-done'}>
              <span className="tag-status done">已发布</span>
            </Option>
            <Option value={id + '-design'}>
              <span className="tag-status design">设计中</span>
            </Option>
            <Option value={id + '-undone'}>
              <span className="tag-status undone">开发中</span>
            </Option>
            <Option value={id + '-testing'}>
              <span className="tag-status testing">已提测</span>
            </Option>
            <Option value={id + '-deprecated'}>
              <span className="tag-status deprecated">已过时</span>
            </Option>
            <Option value={id + '-stoping'}>
              <span className="tag-status stoping">暂停开发</span>
            </Option>
          </Select>
        );
      },
      filters: apistatusArr,
      onFilter: (value, record) => record.status.indexOf(value) === 0
    },
    {
      title: '操作',
      dataIndex: 'options',
      key: 'options',
      render: (text,record) => {
        const id = record._id;
        return (
          // <Button style={{marginLeft: '25px'}} onClick={this.Openexl} className='openlib' type='primary' >用例库</Button>
          <span className='options'>
            <Tooltip title="AI生成">
              <CodepenCircleOutlined
                className="interface-delete-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={()=>this.aiCreateCaseModel(id,record.intro)} />
            </Tooltip>
            <Tooltip title="添加用例">
              <PlusOutlined
                className="interface-delete-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={()=>this.Opencaselib(id)} />
            </Tooltip>
            <Tooltip title="编辑">
              <EditOutlined
                className="interface-edit-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={()=>this.Openeditdemand(id,record)} />
            </Tooltip>
            <Tooltip title="删除">
              <DeleteOutlined
                className="interface-delete-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={() => this.Deletedemand(id)} />
            </Tooltip>
          </span>
        );
      }
    }
  ];
  let data = this.state.tableData;
  data = data.map(item => {
    item.key = item._id;
    return item;
  });
  return (
    <div>
      <Button style={{marginLeft: '25px'}} onClick={this.Opendemand} className='importexl' type='primary' >添加需求</Button>
      <Layout>
        <Content
          style={{
          height: '100%',
          margin: '0 24px 0 16px',
          overflow: 'initial',
          backgroundColor: '#fff'
          }}
          >
          <div className="demandlist">
            <Table className='table-demandlist' columns={columns} dataSource={data} position='bottom' />
          </div>
        </Content>
      </Layout>
      {this.state.aiCreateCaseModel && (
        //添加
        <Modal
          title="需求详细描述，需求文档"
          visible={this.state.aiCreateCaseModel}
          onCancel={() => this.setState({ aiCreateCaseModel: false,aiCreateCaseid:0,demandDesc:'' })}
          onOk={this.aiCreateCaselib}
          className="aicreatecasemodal"
          width={'1000px'}
        >
          <TextArea
            value={this.state.promptDesc}
            onChange={this.onChangePromptDesc}
            placeholder="模板描述prompt"
            autoSize={{ minRows: 10, maxRows: 50 }}
          />
          <TextArea
            value={this.state.demandDesc}
            onChange={this.onChangeDemandDesc}
            placeholder="需求文档描述"
            autoSize={{ minRows: 20, maxRows: 50 }}
            style={{margin: '10px 0 0 0'}}
          />
        </Modal>
        )}
      {this.state.add && (
        //添加
        <Modal
          title="添加需求"
          visible={this.state.add}
          onCancel={() => this.setState({ add: false })}
          footer={null}
          className="addcatmodal"
        >
          <Adddemand
            onCancel={() => this.setState({ add: false })}
            onSubmit={this.Createmand}
          />
        </Modal>
        )}
      {this.state.edit && (
        //编辑
        <Modal
          title="编辑需求"
          visible={this.state.edit}
          onCancel={() => this.setState({ edit: false })}
          footer={null}
          className="editcatmodal"
        >
          <Adddemand
            catid={this.state.editid}
            catdata={this.state.editdata}
            onCancel={() => this.setState({ edit: false })}
            onSubmit={this.Editdemand}
          />
        </Modal>
      )}
      {this.state.addcase && (
        //添加用例
        <Modal
          title="用例库"
          visible={this.state.addcase}
          onCancel={() => this.setState({ addcase: false })}
          footer={null}
          className="addcasemodal"
          width='100%'
          height='90%'
        >
          <Caselib
            demandid={this.state.addcaseid}
            projectid ={this.props.curProject._id}
            onCancel={() => this.setState({ edit: false })}
            onSubmit={this.Editdemand}
          />
        </Modal>
      )}
    </div>
  );
}
}

export default demandlib;
