import React from 'react';
import PropTypes, { number } from 'prop-types';
import {getProject} from '../../../../reducer/modules/project.js';
import {demandlist} from '../../../../reducer/modules/demand.js'
import {connect} from 'react-redux';
import axios from 'axios';
import {message,Modal,Table,Button,Layout,Select,Tooltip,Icon} from 'antd';
import { withRouter } from 'react-router';
import './demandlib.scss';
import Adddemand from '../../Interface/InterfaceList/Adddemand.js';
import Caselib  from '../Caselib/Caselib.js';
const { Content } = Layout;
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
      addcase:false
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
            <Tooltip title="添加用例">
              <Icon
                type="plus"
                className="interface-delete-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={()=>this.Opencaselib(id)}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Icon
                type="edit"
                className="interface-edit-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={()=>this.Openeditdemand(id,record)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Icon
                type="delete"
                className="interface-delete-icon"
                style={{display:'block',float: 'left',marginRight:'20px'}}
                onClick={() => this.Deletedemand(id)}
              />
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
