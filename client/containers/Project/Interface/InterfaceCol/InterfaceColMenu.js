import React, {PureComponent as Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import produce from 'immer';
import PropTypes from 'prop-types';
import _ from 'loadsh';
import {
  fetchCaseData,
  fetchCaseList,
  fetchInterfaceCaseList,
  fetchInterfaceColList,
  setColData,
  fetchInterfaceColListall,
  fetchInterfaceColListchild,
  fetchInterfaceColListForPid,
  fetchRunCols,
  fetchDelRunCols
} from '../../../../reducer/modules/interfaceCol';
import {fetchProjectList} from '../../../../reducer/modules/project';
import axios from 'axios';
import MoveCase from './MoveCase';
import ImportInterface from './ImportInterface';

import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';

import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';

import { Button, Input, message, Modal, Tooltip, Tree, Spin, Select } from 'antd';
import {arrayChangeIndex, findMeInTree, findCategoriesById} from '../../../../common';
import './InterfaceColMenu.scss';
import UsernameAutoComplete from '../../../../components/UsernameAutoComplete/UsernameAutoComplete';
import BachUpCase from '../../../../components/BachUpCase/BachUpCase';
const {
  handleParams,
  crossRequest,
  getsocket,
  setsocket,
  handleCurrDomain,
  checkNameIsExistInArray
} = require('common/postmanLib.js');
import {findStorageKeysFromScript} from "../../../../../common/utils";
const { handleParamsValue, json_parse, ArrayToObject } = require('common/utils.js');
const createContext = require('common/createContext')
const Option = Select.Option;

const { Search } = Input;
const TreeNode = Tree.TreeNode;
const FormItem = Form.Item;
const confirm = Modal.confirm;
const headHeight = 240; // menu顶部到网页顶部部分的高度

const ColModalForm = Form.create()(props => {
  const {visible, onCancel, onCreate, form, title, pcol, type,onUserSelect,colown,env,useEnv} = props;
  const case_env = [];
  env.forEach(item=>{
    case_env.push(<Option key={item._id.toString()}>{item.name+' '+item.domain}</Option>);
  })
  const { getFieldDecorator } = form;
  let pcolName = pcol && pcol.name;
  let own = "负责人 "+colown;
  let h2title = (pcolName && pcolName.length > 0) ? "灵魂拷问，你确认要在 " + pcolName + " 下创建子集合？" : "给力很，又有新的用例集了！";
  h2title = type === 'edit' ? '编辑、编辑、编辑！' : h2title;
  // let dfenv = props.dfenv;
  return (
    <Modal open={visible} title={title} onCancel={onCancel} onOk={onCreate} >
      <h3>{h2title}</h3>
      <Form layout="vertical">
        <FormItem label="集合名">
          {getFieldDecorator('colName', {
            rules: [{ required: true, message: '请输入集合命名！' }]
          })(<Input />)}
        </FormItem>
        <FormItem label="简介">{getFieldDecorator('colDesc')(<Input type="textarea" />)}</FormItem>
        <FormItem label="前置运行集合">{getFieldDecorator('colPre')(<Input type="textarea" placeholder="运行集合前需要执行的集合ID，以英文逗号隔开"/>)}</FormItem>
        <FormItem label={own}>{getFieldDecorator('colOwn')(<UsernameAutoComplete callbackState={onUserSelect}/>)}</FormItem>
        <FormItem label="默认环境">{getFieldDecorator('caseEnv')(                  
          <Select
            style={{ width: '100%' }}
            placeholder="添加用例时默认envid"
            onChange={useEnv}
          >
            {case_env}
          </Select>)}
        </FormItem>
      </Form>
    </Modal>
  );
});

@connect(
  state => {
    return {
      interfaceColList: state.interfaceCol.interfaceColList,
      interfaceColListall: state.interfaceCol.interfaceColListall,
      interfaceColListchild:state.interfaceCol.interfaceColListchild,
      interfaceColListForPid:state.interfaceCol.interfaceColListForPid,
      currCase: state.interfaceCol.currCase,
      isRander: state.interfaceCol.isRander,
      currCaseId: state.interfaceCol.currCaseId,
      runCols: state.interfaceCol.runCols,
      // list: state.inter.list,
      // 当前项目的信息
      curProject: state.project.currProject
      // projectList: state.project.projectList
    };
  },
  {
    fetchInterfaceColList,
    fetchInterfaceCaseList,
    fetchInterfaceColListall,
    fetchInterfaceColListchild,
    fetchInterfaceColListForPid,
    fetchCaseData,
    // fetchInterfaceListMenu,
    fetchCaseList,
    setColData,
    fetchProjectList,
    fetchRunCols,
    fetchDelRunCols
  }
)
@withRouter
export default class InterfaceColMenu extends Component {
  static propTypes = {
    match: PropTypes.object,
    interfaceColList: PropTypes.array,
    interfaceColListall: PropTypes.array,
    interfaceColListchild: PropTypes.array,
    interfaceColListForPid: PropTypes.array,
    fetchInterfaceColList: PropTypes.func,
    fetchInterfaceCaseList: PropTypes.func,
    fetchInterfaceColListall: PropTypes.func,
    fetchInterfaceColListchild: PropTypes.func,
    fetchInterfaceColListForPid: PropTypes.func,
    fetchRunCols:PropTypes.func,
    fetchDelRunCols:PropTypes.func,
    runCols:PropTypes.array,
    showColMenu:PropTypes.func,
    // fetchInterfaceListMenu: PropTypes.func,
    fetchCaseList: PropTypes.func,
    fetchCaseData: PropTypes.func,
    setColData: PropTypes.func,
    currCaseId: PropTypes.number,
    history: PropTypes.object,
    location: PropTypes.object,
    isRander: PropTypes.bool,
    // list: PropTypes.array,
    router: PropTypes.object,
    currCase: PropTypes.object,
    curProject: PropTypes.object,
    fetchProjectList: PropTypes.func
    // projectList: PropTypes.array
  };

  state = {
    colModalType: '',
    colModalVisible: false,
    moveCaseVisible: false,
    editColId: 0,
    importInterVisible: false,
    importInterIds: [],
    importColId: 0,
    importColCaseEnv:'',
    selectedKey: [],
    expandedKeys: [],
    loadedKeys:[],
    list: [],
    delIcon: null,
    selectedProject: null,
    moveToColId: 0,
    currentCol: {},
    inputUids:[],
    colown:'',
    dfenv:'',
    optCaseids:[],
    optColids:[],
    importColIds:[],
    bachImportCase:false,
    treeLoading:true,
    showSyncModel:false,
    editColPid:0,
    uId:0,
    runcols:[],
    caseids:[]
  };

  constructor(props) {
    super(props);
    this.CancelTest = false;
    //console.log("constructor");


  }
  onUserSelect = uids => {
    console.log('uids',uids);
    this.setState({
      inputUids: uids
    });
  };
  useEnv = value =>{
    this.setState({dfenv:value})
  }

  async componentWillMount() {
    await this.getList();
    let yapiUser = localStorage.getItem('YAPI_USER');
    let idMatch = yapiUser.match(/_id=(\d+)/);
    this.setState({uId:idMatch[1]});
    this.CancelTest = false;
  }

  componentWillUnmount() {
    if(this.state.runcols.length>0){
      message.error('当前尚有异步执行集合未完成,已终止运行。。。')
      this.CancelTest = true;
      clearInterval(this._crossRequestInterval);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.interfaceColList !== nextProps.interfaceColList) {
      this.setState({
        list: nextProps.interfaceColList
      });
    }
    if (this.props.interfaceColListchild !== nextProps.interfaceColListchild) {
      let list = this.state.list;
      let ColId = nextProps.interfaceColListchild[0].col_id;
      let recombinantArray = item =>{
        item.map(node => {
          if (node._id === ColId) {
            // 找到需要更新的节点更新
            node.caseList=nextProps.interfaceColListchild;
          }
          if(node.children){
            recombinantArray(node.children);
          }
          return node;
        });
      }
      recombinantArray(list);
      this.setState({list:[...list]});
    }
    if (this.props.interfaceColListForPid !== nextProps.interfaceColListForPid) {
      let list = this.state.list;
      let parent_id = nextProps.interfaceColListForPid[0].parent_id;
      let recombinantArray = item =>{
        item.map(node => {
          if (node._id === parent_id) {
            // 找到需要更新的节点更新
            node.children=nextProps.interfaceColListForPid;
          }
          if(node.children){
            recombinantArray(node.children);
          }
          return node;
        });
      }
      recombinantArray(list);
      this.setState({list:[...list]});
    }
    if (this.props.interfaceColList !== nextProps.interfaceColList) {
      let list = this.state.list;
      list = nextProps.interfaceColList;
      this.setState({list:[...list]});
    }
    const { pathname } = this.props.location;
    const { pathname: nextPathname } = nextProps.location;
    if (pathname !== nextPathname || this.state.expandedKeys.length===0) {
      this.initexpandedKeys(nextProps.interfaceColList, nextProps);
    }
  }

  initexpandedKeys = (list, props) => {
    let treePath=[];
    let selectedKey = [];
    try {

    const { action, actionId } = props.router.params;

    const { expandedKeys } = this.state;

    switch (action) {
      case 'case': {
        let ids = findCategoriesById(list, Number(actionId), 'caseList');
        ids = ids.map(it => {
          return 'col_' + it
        });
        selectedKey.push('case_' + actionId);
        const newExpandedKeys = _.uniq([...expandedKeys, ...ids]);
        this.setState({
          expandedKeys: newExpandedKeys,
          selectedKey:selectedKey
        });
        break;
      }
      case 'col': {
        let colid = Number(actionId);
        selectedKey.push('col_' + actionId);
        if (colid) {
          treePath = findMeInTree(list, colid).treePath.slice();
          treePath.push(colid);
          treePath = treePath.map(it => {
            return 'col_' + it
          });
          const newExpandedKeys = _.uniq([...expandedKeys,...treePath]);
          this.setState(
            {
              expandedKeys: newExpandedKeys,
              selectedKey:selectedKey
            }
          )
        }
        break;
      }
      default:
        break;
    }
    }catch (e){
    }
  }

  async getList() {
    //判断是否从用例库或统计跳转过来的
    if(localStorage.getItem('libCase')||localStorage.getItem('libCol')){
      //等待三秒
      let colid;
      let list;
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      for(let i=0;i<3;i++){
        if (colid) {
          break;
        }
        if(localStorage.getItem('libCol')){
          colid = localStorage.getItem('libCol');
          colid = parseInt(colid);
          localStorage.removeItem('libCol');
          let result = await this.props.fetchInterfaceColListall(this.props.match.params.id);
          list= JSON.parse(JSON.stringify(result.payload.data.data));
          let res = this.filterList(list,colid);
          this.setState(
            {
              expandedKeys:res.arr,
              list: JSON.parse(JSON.stringify(res.menuList)),
              treeLoading:false
            }
          )
        }
        await delay(1000); // 每次延时一秒
      }
      return list;
    }else{
      let r = await this.props.fetchInterfaceColList(this.props.match.params.id);
      this.setState({
        list: r.payload.data.data,
        treeLoading :false
      });
      return r;
    }
  }

  addorEditCol = async () => {
    this.selectValue=null;
    const { colName: name, colDesc: desc,caseEnv:case_env,colPre:pre_col} = this.form.getFieldsValue();
    const {colModalType, editColId: col_id,inputUids:own,editColPid} = this.state;
    const project_id = this.props.match.params.id;
    let parent_id;
    let res = {};
    if(own.length>0){
      if (colModalType === 'add') {
        parent_id = col_id ? col_id : -1;
        res = await axios.post('/api/col/add_col', {name, desc, own,case_env, parent_id, project_id,pre_col});
      } else if (colModalType === 'edit') {
        parent_id = editColPid;
        res = await axios.post('/api/col/up_col', { name, desc, own,case_env, col_id,pre_col });
        this.props.fetchCaseList(col_id);
      }
    }else{
      if (colModalType === 'add') {
        parent_id = col_id ? col_id : -1;
        res = await axios.post('/api/col/add_col', {name, desc,case_env, parent_id, project_id,pre_col});
      } else if (colModalType === 'edit') {
        parent_id = editColPid;
        res = await axios.post('/api/col/up_col', { name, desc,case_env, col_id,pre_col });
        this.props.fetchCaseList(col_id);
      }
    }
    if (!res.data.errcode) {
      this.setState({
        colModalVisible: false,
        inputUids: [],
        colown:'',
        dfenv:''
      });
      console.log('setState',this.state);
      message.success(colModalType === 'edit' ? '修改集合成功' : '添加集合成功');
      // await this.props.fetchInterfaceColList(project_id);
      // this.getList();
      await this.updateTreeCol(parent_id,project_id);
    } else {
      this.setState({dfenv:''});
      message.error(res.data.errmsg);
    }
  };

  delCase=async()=>{
    let optCaseids = [];
    let Caseids = this.state.optCaseids;
    try{
      Caseids.forEach((item)=>{
        let id =item.split('_')[1];
        optCaseids.push(Number(id));
      })
      let res = await axios.post('/api/col/batchdelcase', {caseids:optCaseids});
      if(res.data.data.filemessage.length>0){
        message.error(res.data.data.filemessage.toString(),3);
      }else{
        message.success('删除成功');
      }
      await this.setState({optCaseids:[],selectedKey:[]});
      await this.getList();
      this.props.setColData({ isRander: true });
    }catch(e){
      message.error(e)
    }
  }
  onSelect = async(keys, e) => {
    let key = e.node.props.eventKey;
    let isCtrlPressed =e.nativeEvent.ctrlKey;
    if (key) {
      const type = key.split('_')[0];
      const id = key.split('_')[1];
      const project_id = this.props.match.params.id;
      const { expandedKeys, selectedKey } = this.state;

      if(isCtrlPressed&&type !== 'col'){
        //多选
        let optCaseids = this.state.optCaseids;
        if(optCaseids.includes(key)){
          let cancelDelids = optCaseids.filter(item=>item!==key);
          await this.setState({
            optCaseids:optCaseids.filter(item=>item!==key),
            selectedKey: [...cancelDelids]
          })
        }else{
          optCaseids.push(key);
          await this.setState({
            selectedKey: [...optCaseids]
          })
        }
      }else if(isCtrlPressed&&type == 'col'){
        //多选
        let optColids = this.state.optColids;
        if(optColids.includes(key)){
          let cancelDelids = optColids.filter(item=>item!==key);
          await this.setState({
            optColids:optColids.filter(item=>item!==key),
            selectedKey: [...cancelDelids]
          })
        }else{
          optColids.push(key);
          await this.setState({
            selectedKey: [...optColids]
          })
        }
      }else if(expandedKeys.includes(key) && selectedKey.includes(key)) {
        //单选
        await this.setState({
          expandedKeys: expandedKeys.filter(i => i !== key),
          selectedKey: keys
        })
      } else {
        //单选
        await this.setState({
          expandedKeys: type === 'col' ? [...expandedKeys, key] : expandedKeys,
          selectedKey: [key]
        })
      }

      if (selectedKey.includes(key)) return;
      //是否需要切换路由
      if (type === 'col') {
        this.props.setColData({
          isRander: false
        });
        this.props.history.push('/project/' + project_id + '/interface/col/' + id);
        setTimeout( () => {
          this.onLoadData(e.node);
        }, 200);
      } 
      if(type === 'case'&&!isCtrlPressed){
        this.props.setColData({
          isRander: false
        });
        this.props.history.push('/project/' + project_id + '/interface/case/' + id);
      }
    }
  };

  onExpand = (keys) => {
    this.setState({
      expandedKeys:keys
    })
    // console.log('qwqwqwe',e.node)
    // const { loadedKeys,expandedKeys } = this.state;
    // let newLoadKeys = loadedKeys;
    // // 判断当前是展开还是收起节点，当前展开的长度比之前的少，说明是收起。
    // if (expandedKeys.length > keys.length) {
    //   // 当是收起的时候，把这个收起的节点从loadekeys中移除
    //   newLoadKeys = loadedKeys.filter((i) => keys.includes(i))
    // }
    // this.setState({
    //   expandedKeys: expandedKeys,
    //   loadedKeys: newLoadKeys
    // })
  };
  // onLoad =(loadedKeys)=>{
  //   console.log('xonLoad',loadedKeys);
  //   this.setState({
  //     loadedKeys:loadedKeys
  //   })
  // }

  showDelColConfirm = (colId,pid) => {
    let that = this;
    const params = this.props.match.params;
    confirm({
      title: '您确认删除此测试集合',
      content: '温馨提示：该操作会删除该集合下所有测试用例，用例删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        const res = await axios.get('/api/col/del_col?col_id=' + colId);
        if (!res.data.errcode) {
          message.success('删除集合成功');
          // const result = await that.getList();
          await that.updateTreeCol(pid,params.id);
          // const nextColId = result.payload.data.data[0]._id;
          if(pid ==-1||pid ==0||!pid){
            that.props.history.push('/project/' + params.id + '/interface/col/');
          }else{
            that.props.history.push('/project/' + params.id + '/interface/col/'+pid);
          }
          
        } else {
          message.error(res.data.errmsg);
        }
      }
    });
  };

  // 复制测试集合
  copyInterface = async item => {
    // let items = [];
    // function settiem(item){
      // let a = {desc:item.desc, project_id:item.project_id, col_id: item._id, parent_id:item.parent_id};
      // items.push(a);
      // for(let i in item){
      //   if(i=='children'&&item[i].length>0){
      //     for(var j of item[i]) {
      //       this.settiem(j)
      //     }
      //   }
      // }
      
    // }
    // settiem(item);
    // console.log('items',items);
    if (this._copyInterfaceSign === true) {
      return;
    }
    this._copyInterfaceSign = true;
    const {desc, project_id, _id: col_id,case_env, parent_id,pre_col} = item;
    let { name } = item;
    name = `${name} copy`;

    // 添加集合
    const add_col_res = await axios.post('/api/col/add_col', {name, desc, case_env,project_id, parent_id,pre_col});

    if (add_col_res.data.errcode) {
      message.error(add_col_res.data.errmsg);
      return;
    }

    const new_col_id = add_col_res.data.data._id;

    // 克隆集合
    const add_case_list_res = await axios.post('/api/col/clone_case_list', {
      new_col_id,
      col_id,
      project_id
    });
    this._copyInterfaceSign = false;

    if (add_case_list_res.data.errcode) {
      message.error(add_case_list_res.data.errmsg);
      return;
    }

    // 刷新接口列表
    // await this.props.fetchInterfaceColList(project_id);
    // this.getList();
    await this.updateTreeCol(parent_id,project_id);
    this.props.setColData({ isRander: true });
    message.success('克隆测试集成功');
    //子集合同样复制
    for(let i in item){
      if(i=='children'&&item[i].length>0){
        for(var j of item[i]) {
          j.parent_id = new_col_id
          await this.copyInterface(j)
        }
      }
    }
  };

  showNoDelColConfirm = () => {
    confirm({
      title: '此测试集合为最后一个集合',
      content: '温馨提示：建议不要删除'
    });
  };
  caseCopy = async caseId=> {
    let that = this;
    let caseData = await that.props.fetchCaseData(caseId);
    let data = caseData.payload.data.data;
    data = JSON.parse(JSON.stringify(data));
    data.casename=`${data.casename}_copy`
    delete data._id
    const res = await axios.post('/api/col/add_case',data);
      if (!res.data.errcode) {
        message.success('克隆用例成功');
        let colId = res.data.data.col_id;
        let projectId=res.data.data.project_id;
        // await this.getList();
        await this.updateTreeCase(colId);
        this.props.history.push('/project/' + projectId + '/interface/col/' + colId);
        this.setState({
          visible: false
        });
      } else {
        message.error(res.data.errmsg);
      }
  };
  showDelCaseConfirm = async(caseId,colid) => {
    let that = this;
    const params = this.props.match.params;
    confirm({
      title: '您确认删除此测试用例',
      content: '温馨提示：用例删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        const res = await axios.get('/api/col/del_case?caseid=' + caseId);
        if (!res.data.errcode) {
          message.success('删除用例成功');
          // that.getList();
          await that.updateTreeCase(colid);
          // 如果删除当前选中 case，切换路由到集合
          if (+caseId === +that.props.currCaseId) {
            that.props.history.push('/project/' + params.id + '/interface/col/'+colid);
          } else {
            // that.props.fetchInterfaceColList(that.props.match.params.id);
            that.props.setColData({ isRander: true });
          }
        } else {
          message.error(res.data.errmsg);
        }
      }
    });
  };
  showColModal = (type, col,editColPid) => {
    if(type==='edit'){
      let coluser ='';
      if(col.own&&col.own.length>0){
        for(let i=0;i<col.own.length;i++){
          coluser += col.own[i].username + ' '
        }
      }
      this.setState({ colown : coluser });
    }

    const editCol =
      type === 'edit' ? { colName: col.name, colDesc: col.desc,caseEnv:col.case_env,colPre:col.pre_col } : { colName: '', colDesc: '',colPre:'',caseEnv:this.props.curProject.env[0]._id };
    this.setState({
      colModalVisible: true,
      colModalType: type || 'add',
      editColId: col && col._id,
      currentCol: col,
      editColPid: editColPid
    });
    this.form.setFieldsValue(editCol);
  };
  saveFormRef = form => {
    this.form = form;
  };

  selectInterface = (importInterIds, selectedProject) => {
    this.setState({ importInterIds, selectedProject });
  };

  showImportInterfaceModal = async (colId,case_env) => {
    // const projectId = this.props.match.params.id;
    const groupId = this.props.curProject.group_id;
    await this.props.fetchProjectList(groupId);
    // await this.props.fetchInterfaceListMenu(projectId)
    this.setState({ importInterVisible: true, importColId: colId,importColCaseEnv:case_env });
  };
  showImportInterfaceModalBach = async () => {
    const groupId = this.props.curProject.group_id;
    await this.props.fetchProjectList(groupId);
    let importColIds = [];
    let optColids = this.state.optColids;
    optColids.forEach((item)=>{
      let id =item.split('_')[1];
      importColIds.push(Number(id));
    })
    this.setState({ importInterVisible: true,bachImportCase:true,importColIds:importColIds });
  };
  //更新树的集合
  updateTreeCol = async(pid,project_id)=>{
    let result;
    if(pid==-1 || !pid ||pid==0){
      result = await this.props.fetchInterfaceColList(project_id);
      if(!result.payload.data.errcode){
        let list = result.payload.data.data;
        this.setState({list:[...list],treeLoading:false});
      }else{
        console.log('-------------------------')
        await this.getList();
      }
    }else{
      result = await this.props.fetchInterfaceColListForPid(pid);
      if(!result.payload.data.errcode){
        let list = this.state.list;
        let recombinantArray = item =>{
          item.map(node => {
            if (node._id === pid) {
              // 找到需要更新的节点更新
              node.children=result.payload.data.data;
            }
            if(node.children){
              recombinantArray(node.children);
            }
            return node;
          });
        }
        recombinantArray(list);
        this.setState({list:[...list],treeLoading:false});
      }else{
        console.log('-------------------------')
        await this.getList();
      }
    }
    //如果未点击展开某个节点进行导入且路由没有colid 则设为当前colid
    if(!this.props.router){
      this.props.history.push('/project/' +  this.props.match.params.id + '/interface/col/' + result.data.data[0]._id);
    }
  }
  //更新树的用例集
  updateTreeCase = async(ColId)=>{
    let result = await axios.get('/api/col/case_listall?col_id=' + ColId);
    if(!result.data.errcode){
      let list = this.state.list;
      let recombinantArray = item =>{
        item.map(node => {
          if (node._id === ColId) {
            // 找到需要更新的节点更新
            node.caseList=result.data.data;
          }
          if(node.children){
            recombinantArray(node.children);
          }
          return node;
        });
      }
      recombinantArray(list);
      this.setState({list:[...list],treeLoading:false});
      //如果未点击展开某个节点进行导入且路由没有colid 则设为当前colid
      if(!this.props.router){
        this.props.history.push('/project/' +  this.props.match.params.id + '/interface/col/' + ColId);
      }
    }else{
      await this.getList();
    }
  }
  handleImportOk = async () => {
    const project_id = this.state.selectedProject || this.props.match.params.id;
    const { importColId, importInterIds,importColCaseEnv,importColIds,bachImportCase } = this.state;
    var res;
    if(bachImportCase){
      res = await axios.post('/api/col/add_case_list_bach', {
        interface_list: importInterIds,
        col_ids: importColIds,
        project_id
      });
    }else{
      res = await axios.post('/api/col/add_case_list', {
        interface_list: importInterIds,
        col_id: importColId,
        project_id,
        case_env:importColCaseEnv
      });
    }
    if (!res.data.errcode) {
      this.setState({ importInterVisible: false,importColCaseEnv:'',bachImportCase:false,selectedKey:[],importColIds:[],optColids:[] });
      message.success('导入集合成功');
      // await this.props.fetchInterfaceColList(project_id);
      // this.getList();
      // 局部更新树中的该节点数据
      await this.updateTreeCase(importColId);
      this.props.setColData({ isRander: true });
    } else {
      message.error(res.data.errmsg);
    }
  };
  handleImportCancel = () => {
    this.setState({ importInterVisible: false,importColCaseEnv:'',bachImportCase:false,selectedKey:[],importColIds:[],optColids:[] });
  };

  deepCopy(data, hash = new WeakMap()) {
    if(typeof data !== 'object' || data === null){
          throw new TypeError('传入参数不是对象')
      }
    // 判断传入的待拷贝对象的引用是否存在于hash中
    if(hash.has(data)) {
          return hash.get(data)
      }
    let newData = {};
    const dataKeys = Object.keys(data);
    dataKeys.forEach(value => {
       const currentDataValue = data[value];
       // 基本数据类型的值和函数直接赋值拷贝 
       if (typeof currentDataValue !== "object" || currentDataValue === null) {
            newData[value] = currentDataValue;
        } else if (Array.isArray(currentDataValue)) {
           // 实现数组的深拷贝
          newData[value] = [...currentDataValue];
        } else if (currentDataValue instanceof Set) {
           // 实现set数据的深拷贝
           newData[value] = new Set([...currentDataValue]);
        } else if (currentDataValue instanceof Map) {
           // 实现map数据的深拷贝
           newData[value] = new Map([...currentDataValue]);
        } else { 
           // 将这个待拷贝对象的引用存于hash中
           hash.set(data,data)
           // 普通对象则递归赋值
           newData[value] = this.deepCopy(currentDataValue, hash);
        } 
     }); 

    return newData;
}
  filterCol = async e => {
    let result 
    if(e){
      this.setState(
        {
          treeLoading:true
        }
      )
      result = await this.props.fetchInterfaceColListall(this.props.match.params.id);
      let list= JSON.parse(JSON.stringify(result.payload.data.data));
      let res = this.filterList(list,e);
      //menuList = res.menuList;
      let newData = this.deepCopy(res.menuList);
      let newlist = [];
      for (const key in newData) {
        newlist.push(newData[key]);
      }
      this.setState(
        {
          expandedKeys:res.arr,
          list:newlist,
          treeLoading:false
        }
      )
    }else{
      await this.props.fetchInterfaceColList(this.props.match.params.id)
    }
  };

  changeStyle = (str,searchValue) => {
    const index = str.indexOf(searchValue);
    if (index > -1) {
      const beforeStr = str.substr(0, index);
      const afterStr = str.substr(index + searchValue.length);
      return (
        <span>
          {beforeStr}
          <span style={{color: 'red'}}>{searchValue}</span>
          {afterStr}
        </span>
      )
    } else {
      return str;
    }
  };

  // 数据过滤
  filterList = (list,filter) => {
    let arr = [];

    let iterater = item => {

      //console.log(JSON.parse(JSON.stringify(item)));
      // arr = [];
      let own = JSON.stringify(item.own);
      if (item.name.indexOf(filter) === -1 && own.indexOf(filter) === -1&&item['_id'] !== filter) {
        item.children = item.children ? item.children.filter(me => iterater(me)) : [];
        item.caseList = item.caseList?item.caseList.filter(inter => {
          if (
            inter.casename.indexOf(filter) === -1 &&
            inter.path.indexOf(filter) === -1
          ) {
            return false;
          } else {
            inter.casename = inter.path.indexOf(filter) === -1 ? this.changeStyle(inter.casename,filter) : (
              <span style={{color: 'blue'}}>{inter.casename}</span>)
          }
          return true;
        }):[];

        if (item.caseList.length > 0 || item.children.length > 0) {
          arr.push('col_' + item._id);
          item.in = true;
        } else {
          item.in = false;
        }

        return item.in ;
      } else {
        arr.push('col_' + item._id);
        item.name = this.changeStyle(item.name,filter);
        // item.in = true;
        if(!item.caseList){
          item.caseList = [];
          if(!item.children){
            item.in = false;
          }
        }
        //如果还有子集应该继续去遍历一下子集
        if(item.children&&item.children.length>0){
          item.children = item.children ? item.children.filter(me => iterater(me)) : [];
        }
        return true;
      }

    };
    let menuList = produce(list, draftList => {
      draftList.filter(item => {
          iterater(item);
        }
      );
    });
    console.log({menuList, arr});
    return {menuList, arr};
  };

  // 数组遍历寻找父目录并重组数组
  filterPList = (list,filter,newdata) => {
    let iterater = item => {
      if (item._id !== filter) {

        item.children = item.children ? item.children.filter(me => iterater(me)) : [];

        if (item.children.length > 0) {
          item.children = item.children;
          return true;
        } else {
          delete item.children
          return false;
        }
      } else {
        item.children = newdata
        return true;
      }

    };
    let menuList = produce(list, draftList => {
      draftList.filter(item => {
          iterater(item);
        }
      );
    });
    return menuList;
  };

  getcolItem = (c, ids, iscol) => {
    let inids = JSON.parse(JSON.stringify(ids));
    iscol ? '' : inids.pop();
    let itrlist = (lis, idz) => {
      console.log({lis, idz});
      let ret = lis[Number(idz.shift())];
      if (idz.length > 0) {
        ret = itrlist(ret.children, idz);
      }
      return ret;
    };
    let item = itrlist(c, inids);
    return item;
  };

  onDrop = async e => {


    let dropColIndex = e.node.props.pos.split('-').map(it => {
      return Number.parseInt(it)
    });
    dropColIndex.shift();
    let dragColIndex = e.dragNode.props.pos.split('-').map(it => {
      return Number.parseInt(it)
    });
    dragColIndex.shift();

    if (dropColIndex < 0 || dragColIndex < 0) {
      return;
    }
    const {interfaceColList} = this.props;
    const dragid = e.dragNode.props.eventKey;
    const dropid = e.node.props.eventKey;
    console.log({interfaceColList, dropColIndex, dropid,dragColIndex,dragid});
    const dropColItem = this.getcolItem(interfaceColList, dropColIndex, dropid.indexOf('col') != -1);
    const dragColItem = this.getcolItem(interfaceColList, dragColIndex, dragid.indexOf('col') != -1);
    console.log({dropColItem, dragColItem});
    const dropColId = dropColItem._id;
    const dragColId = dragColItem._id;
    const dropPos = e.node.props.pos.split('-');
    const dropIndex = Number(dropPos[dropPos.length - 1]);
    const dragPos = e.dragNode.props.pos.split('-');
    const dragIndex = Number(dragPos[dragPos.length - 1]);


    if (dragid.indexOf('col') === -1) {
      if (dropColId === dragColId) {
        // 同一个分类下的用例交换顺序
        let caseList = dropColItem.caseList;
        let childCount = dropColItem.children ? dropColItem.children.length : 0;
        let changes = arrayChangeIndex(caseList, dragIndex - childCount, dropIndex - childCount);
        await axios.post('/api/col/up_case_index', changes).then();
        await this.updateTreeCase(dropColId);
      } else {
        await axios.post('/api/col/up_case', {id: dragid.substr(5), col_id: dropColId});
        await this.updateTreeCase(dropColId);
        await this.updateTreeCase(dragColId);
      }
      // const {projectId, router} = this.props;
      // this.props.fetchInterfaceColList(projectId);
      // if (router && isNaN(router.params.actionId)) {
      //   // 更新分类list下的数据
      //   let colid = router.params.actionId.substr(4);
      //   this.props.fetchCaseList({colid});
      // }
    } else {
      // 分类拖动
      console.log({dropid, dragid});
      //处理分类拖动到用例上
      //处理分类在不同级时相互拖动情况
      if (dropid.indexOf('col') === -1 || (dropid.indexOf('col') != -1 && dropColItem.parent_id != dragColItem.parent_id)) {
        let col_id = dragColItem._id;
        let parent_id = -1;
        //不同级别时，拖到上gap,则成为同级分类
        if (e.node.props.dragOverGapTop) {
          parent_id = dropColItem.parent_id;
        } else {// 不同级别时，拖到节点或下gap时，成为子目录
          parent_id = dropColItem._id;
        }
        await axios.post('/api/col/up_col', {col_id, parent_id}).then();
        // await this.updateTreeCol(dragColItem.parent_id,this.props.match.params.id);
        // await this.updateTreeCol(dropColItem.parent_id,this.props.match.params.id);
        this.getList();
      } else { //同分类目录下:
        let changes = [];
        if (!e.node.props.dragOver) {//如果不是在gap上，则进行排序
          if (dropColItem.parent_id === -1) {
            changes = arrayChangeIndex(interfaceColList, dragIndex, dropIndex);
          } else {
            dropColIndex.pop();
            changes = arrayChangeIndex(this.getcolItem(interfaceColList, dropColIndex, true).children, dragIndex, dropIndex);
          }
          await axios.post('/api/col/up_col_index', changes).then();
        } else {//如果drop在gap上，则是成为drop目标的子目录
          let col_id = dragColItem._id;
          let parent_id = dropColItem._id;
          await axios.post('/api/col/up_col', {col_id, parent_id}).then();
        }
        await this.updateTreeCol(dropColItem.parent_id,this.props.match.params.id);
      }
      // this.getList();
    }
    // this.getList();


  };
  handleValue = (val, global,records) => {
    let globalValue = ArrayToObject(global);
    let context = Object.assign({}, { global: globalValue }, records);
    return handleParamsValue(val, context);
  };
  // 整合header信息
  handleReqHeader = (req_header, case_env) => {
    let envItem = this.props.curProject.env;
    let currDomain = handleCurrDomain(envItem, case_env);
    let header = currDomain.header;
    header.forEach(item => {
      if (!checkNameIsExistInArray(item.name, req_header)) {
        // item.abled = true;
        item = {
          ...item,
          abled: true
        };
        //如果两个名字一样也需要加进数组，且以环境header为主
        req_header = req_header.filter(obj =>obj.name !== item.name);
        req_header.push(item);
      }
    });
    return req_header;
  };
  run = async (colid,parent_id) =>{
    let addRunCols = this.state.runcols;
    addRunCols.push(colid);
    this.setState({runcols:addRunCols});
    //执行后刷新树更新树上的执行状态
    if(parent_id==-1||!parent_id||parent_id==0){
      this.props.fetchInterfaceColList(this.props.curProject._id);
    }else{
      this.props.fetchInterfaceColListForPid(parent_id);
    }
    this.props.fetchRunCols(colid);
    //获取col下所有case
    let colData = await axios.get('/api/col/case_list?col_id=' + colid);
    let caselist = colData.data.data;
    let envlist = this.props.curProject.env;
    let run_start = Math.round(new Date().getTime());
    let reports={};
    var records ={};
    this.CancelTest=false;
    for (let i = 0, l = caselist.length, curitem; i < l; i++) {
      curitem = Object.assign(
        {},
        caselist[i],
        {
          env: envlist,
          pre_script: this.props.curProject.pre_script,
          after_script: this.props.curProject.after_script
        },
        { test_status: 'loading' }
      );
      let result;
      try {
        //整合header
        curitem.req_headers = this.handleReqHeader(curitem.req_headers, curitem.case_env);
        result = await this.handleTest(curitem,colid,records);

        if (result.code === 400) {

        } else if (result.code === 0) {
          //执行成功同步测试用例通过
          if(curitem.testcaseid>0){
            const params = {
              id: curitem.testcaseid,
              status: 'pass'
            };
            let result = await axios.post('/api/caselib/upstatus', params);
            if (result.data.errcode === 0) {
              console.log('更新成功');
            } else {
              message.error(result.data.errmsg);
            }
          }
        } else if (result.code === 1) {
          //执行失败同步测试用例失败
          if(curitem.testcaseid>0){
            const params = {
              id: curitem.testcaseid,
              status: 'fail'
            };
            let result = await axios.post('/api/caselib/upstatus', params);
            if (result.data.errcode === 0) {
              console.log('更新成功');
            } else {
              message.error(result.data.errmsg);
            }
          }
        }else if(result.code == 514){
          break;
        }
      } catch (e) {
        console.error(e);
        console.log('异常的失败');
        result = e;
      }
      reports[curitem._id] = result;
      records[curitem._id] = {
        status: result.status,
        params: result.params,
        body: result.res_body
      };
    }
    if(this.CancelTest){
      return ;
    }
    let run_end = Math.round(new Date().getTime());
    var col_report = JSON.stringify(reports);
    if(col_report.indexOf("验证失败")>=0){
      await axios.post('/api/col/up_col', {
        col_id: colid,
        test_report: col_report,
        status : 1,
        run_start:run_start,
        run_end:run_end
      });
    }else{
      await axios.post('/api/col/up_col', {
        col_id: colid,
        test_report: col_report,
        status : 0,
        run_start:run_start,
        run_end:run_end
      });
    }
    let runcols = this.state.runcols;
    let delRunCols = runcols.filter(element => element !== colid);
    this.setState({runcols:delRunCols});
    //执行完成后刷新树更新树状态
    if(parent_id==-1||!parent_id||parent_id==0){
      this.props.fetchInterfaceColList(this.props.curProject._id);
    }else{
      this.props.fetchInterfaceColListForPid(parent_id);
    }
    this.props.fetchDelRunCols(colid);
  }
  handleTest = async (interfaceData,colid,records) => {
    if (this.CancelTest) {
      let result = {
        code: 514,
        msg: '中断',
        validRes: []
      };
      return result;
    }
    let requestParams = {};
    // let options = handleParams(interfaceData, this.handleValue, requestParams);
    let options = handleParams(interfaceData, (val,global)=>this.handleValue(val,global,records), requestParams,records);
    let result = {
      code: 400,
      msg: '数据异常',
      validRes: []
    };
    var ws;
    if(options.method=='WS'||options.method=='WSS'){
      //遍历weocket对象数组
      let s = getsocket();
      for(let i=0;i<s.length;i++){
        if(s[i].url==options.url){
          ws = s[i]
        }
      }
      if(!ws||ws.readyState==3){
        // 创建了一个客户端的socket,然后让这个客户端去连接服务器的socket
        ws = new WebSocket(options.url);
        try{
          await new Promise((resolve,reject) => {
            ws.onerror = (err) => {
              reject(err);
            };
            ws.onopen=()=> {
              console.log("connect success !!!!");
              this.WebSocket = ws;
              setsocket(this.WebSocket);
              resolve('ws连接成功');
            }
          })
        }catch(err){
          console.log('ws连接失败',err);
        }
      }
    }
    try {
      let data;
      data = await crossRequest(options, interfaceData.pre_script, interfaceData.after_script,interfaceData.case_pre_script,interfaceData.case_post_script, interfaceData.colpre_script,interfaceData.colafter_script,ws,createContext(
        this.state.uId,
        this.props.match.params.id,
        interfaceData.interface_id
      ));
      options.taskId = this.state.uId;
      let res = (data.res.body = json_parse(data.res.body));
      result = {
        ...options,
        ...result,
        res_header: data.res.header,
        res_body: res,
        status: data.res.status,
        statusText: data.res.statusText
        // time: data.res.time
      };

      if (options.data && typeof options.data === 'object') {
        requestParams = {
          ...requestParams,
          ...options.data
        };
      }

      let validRes = [];

      let responseData = Object.assign(
        {},
        {
          status: data.res.status,
          body: res,
          header: data.res.header,
          statusText: data.res.statusText
        }
      );
      if (this.CancelTest) {
        let result = {
          code: 514,
          msg: '中断',
          validRes: []
        };
        return result;
      }
      // 断言测试
      await this.handleScriptTest(interfaceData, responseData, validRes, requestParams,colid,records);

      if (validRes.length === 0) {
        result.code = 0;
        result.validRes = [
          {
            message: '验证通过'
          }
        ],
        result.msg='验证通过';
      } else if (validRes.length > 0) {
        result.code = 1;
        result.validRes = validRes;
        result.msg='验证失败';
      } 
    } catch (data) {
      result = {
        ...options,
        ...result,
        res_header: data.header,
        res_body: data.body || data.message,
        status: 0,
        statusText: data.message,
        code: 400,
        msg: '验证失败',
        validRes: [
          {
            message: data.message
          }
        ]
      };
    }

    result.params = requestParams;

    //判断请求如果是二进制或者返回时图片则清理不必要的数据避免请求数据太大
    if(options.headers['Content-Type'] == 'binary/octet-stream' ){
      delete result.data;
    }
    if(options.headers.binary&&result.status == 200){
      delete result.res_body;
    }
    return result;
  };
  // 断言测试
  handleScriptTest = async (interfaceData, response, validRes, requestParams,colid,records) => {
    // 是否启动断言
    try {
      const {
        preScript = '', afterScript = '',case_pre_script = '',case_post_script = ''
      } = interfaceData;
      const allScriptStr = preScript + afterScript + case_pre_script + case_post_script;
      const storageKeys = findStorageKeysFromScript(allScriptStr);
      const storageDict = {};
      storageKeys.forEach(key => {
        storageDict[key] = localStorage.getItem(key);
      });

      let test = await axios.post('/api/col/run_script', {
        response: response,
        records: records,
        script: interfaceData.test_script,
        params: requestParams,
        col_id: colid,
        interface_id: interfaceData.interface_id,
        storageDict,
        taskId: this.state.uId
      });
      if (test.data.errcode !== 0) {
        test.data.data.logs.forEach(item => {
          validRes.push({ message: item });
        });
      }
    } catch (err) {
      validRes.push({
        message: 'Error: ' + err.message
      });
    }
  };
  enterItem = id => {
    this.setState({ delIcon: id });
  };

  leaveItem = () => {
    this.setState({ delIcon: null });
  };
  handleCaseMoveCancel = () => {
    this.setState({
      moveCaseVisible: false
    });
  };
  handleCaseMoveOk = async () =>{
    const currProjectId = this.props.match.params.id;
    const caseId=this.state.moveId;
    const { moveToColId }=this.state;
    ////console.log("caseId:"+caseId);
    let res0=await axios.get('/api/col/case?caseid=' + caseId);
    let currCase=res0.data.data;

    let res2 = await axios.post('/api/col/move', { caseId, pid:currProjectId,cid:moveToColId });
    if (!res2.data.errcode) {
      message.success("小手一抖，用例移走！ " );
    }else{
      message.error(res2.data.errmsg);
    }
    this.props.history.push('/project/' + currProjectId + '/interface/col/' + currCase.col_id);
      // this.getList();
      await this.updateTreeCase(currCase.col_id);
      this.setState({
      moveCaseVisible: false
    });
  }

  showMoveCaseModal = async id => {
    const groupId = this.props.curProject.group_id;
    await this.props.fetchProjectList(groupId);
    this.setState({ moveCaseVisible: true, moveId: id });

  };

  moveCasecallback = (cid)=>{

    this.setState({
      moveToColId: cid
    })
  }

  //异步加载数据方法
  onLoadData =(treeNode)=> {
    return new Promise( (resolve) => {
      // if (treeNode.children) {
      //     resolve();
      //     return;
      // }
      //子item的参数和首次的参数
      let params = {
          id:treeNode.props.eventKey.split('_')[1]
      }  
      this.setState({loadedKeys:[...treeNode.props.eventKey.split('_')[1]]})
      //异步请求获取数据就在这触发
      axios.get('/api/col/list?parent_id=' + params.id).then(async (res) => {
        if(res.data.data.length>0){
          //这一步会将得到的数据注入到treeNode的子数组
          treeNode.props.dataRef.children = res.data.data;
          //这一步会触发重新渲染，此时子数组已被添加到treeData
          this.setState({list:[...this.state.list]});
        }else{
          // //获取父级dataref
          // let colid = treeNode.props.dataRef.parent_id;
          // // 获取父级的子目录
          // await axios.get('/api/col/list?parent_id='+ colid).then(response => {
          //   if (response.data.errcode !== 0) {
          //     return message.error(`${response.data.errmsg},获取集合信息出错`);
          //   }
          //   let newdata = response.data.data;
          //   let list = this.state.list;
          //   //遍历list找到父目录并加载子目录
          //   let filterList = this.filterPList(list,newdata[0].parent_id,newdata)
          //   console.log('filterList',filterList);
          //   //重新渲染
          //   this.setState({list:[...filterList]});
          // });
          
        }
        resolve();
      }).catch((e) => {
        console.log(e)
        message.error(e.message||'网络错误');
      }).finally(()=>{
        //this.loading = false;
      })
      
    });
    
  }
  upCaseModleClose = ()=>{
    this.setState({optCaseids:[],selectedKey:[],showSyncModel:false,caseids:[]});
    this.getList();
    this.props.setColData({ isRander: true });
  }
  SyncModel = ()=>{
    let optCaseids = [];
    let Caseids = this.state.optCaseids;
    Caseids.forEach((item)=>{
      let id =item.split('_')[1];
      optCaseids.push(Number(id));
    })
    this.setState({
      showSyncModel : true,
      caseids:optCaseids
    })
  }
  render() {
    // console.log('this.state.expandedKeys: ', this.state.expandedKeys);
    // const { currColId, currCaseId, isShowCol } = this.props;
    const {colModalType, colModalVisible, importInterVisible, currentCol} = this.state;
    const currProjectId = this.props.match.params.id;

    const itemInterfaceColCreate = interfaceCase => {
      return (
        <TreeNode
          style={{ width: '100%' }}
          key={'case_' + interfaceCase._id}
          isLeaf={true}
          title={
            <div
              className="menu"
              // onMouseEnter={() => this.enterItem(interfaceCase._id)}
              // onMouseLeave={this.leaveItem}
              title={interfaceCase._id+interfaceCase.path}
            >
              <div className="menu-title">
                <span >{interfaceCase.casename}</span>
              </div>
              <div className="btns">
                <Tooltip title="删除用例">
                  <DeleteOutlined
                    className="interface-icon"
                    // style={{ display: this.state.delIcon == interfaceCase._id ? 'block' : 'none' }}
                    onClick={e => {
                      e.stopPropagation();
                      this.showDelCaseConfirm(interfaceCase._id,interfaceCase.col_id);
                    }} />
                </Tooltip>
                <Tooltip title="克隆用例">
                  <CopyOutlined
                    className="interface-icon"
                    // style={{ display: this.state.delIcon == interfaceCase._id ? 'block' : 'none' }}
                    onClick={e => {
                      e.stopPropagation();
                      this.caseCopy(interfaceCase._id);
                    }} />
                </Tooltip>
                <Tooltip title="移动用例">
                  <SwapOutlined
                    className="interface-icon"
                    // style={{display: this.state.delIcon == interfaceCase._id ? 'block' : 'none'}}
                    onClick={e => {
                      e.stopPropagation();
                      this.showMoveCaseModal(interfaceCase._id);
                    }} />
                </Tooltip>
              </div>
            </div>
          }
        />
      );
    };
    const colCreate = col => {
      let childcol = false;
      if(!col.caseList&&col.haschild==0){
        childcol = true;
      }
      return (
        <TreeNode
          style={{ width: '100%' }}
          key={'col_' + col._id}
          isLeaf = {childcol}
          title={
            <div className="menu" title={col._id}>
              <div className="menu-title">
                {col.status==1?(
                  <span>
                    {/* {col.status==1?(<Icon type="warning" style={{marginRight: 5}}/>):(<Icon type="folder-open" style={{marginRight: 5}}/>)} */}
                    <WarningOutlined style={{marginRight: 5}} />
                    <span style={{color:"red"}}>{col.name}</span>
                  </span>
                ):(
                  <span>
                    <FolderOpenOutlined style={{marginRight: 5}} />
                    <span>{col.name}</span>
                  </span>
                )}
              </div>
              <div className="btns">
                <Tooltip title="删除集合">
                  <DeleteOutlined
                    className="interfacecol-icon"
                    onClick={() => {
                      this.showDelColConfirm(col._id,col.parent_id);
                    }} />
                </Tooltip>
                <Tooltip title="编辑集合">
                  <EditOutlined
                    className="interfacecol-icon"
                    onClick={e => {
                      e.stopPropagation();
                      this.showColModal('edit', col,col.parent_id);
                    }} />
                </Tooltip>
                <Tooltip title="导入接口">
                  <ImportOutlined
                    className="interfacecol-icon"
                    onClick={e => {
                      e.stopPropagation();
                      this.showImportInterfaceModal(col._id,col.case_env);
                    }} />
                </Tooltip>
                <Tooltip title="克隆集合">
                  <CopyOutlined
                    className="interfacecol-icon"
                    onClick={e => {
                      e.stopPropagation();
                      this.copyInterface(col);
                    }} />
                </Tooltip>
                <Tooltip title="添加子集合">
                  <PlusOutlined
                    className="interfacecol-icon"
                    onClick={e => {
                      e.stopPropagation();
                      this.showColModal('add', col);
                    }} />
                </Tooltip>
                {col.haschild==0 && this.state.runcols.includes(col._id) &&(
                  <LoadingOutlined className="interface-run-icon" />
                  )
                }
                {col.haschild==0 && !this.state.runcols.includes(col._id) &&(
                  <Tooltip title="异步执行">
                    <ReloadOutlined
                      className="interface-icon"
                      onClick={e => {
                        e.stopPropagation();
                        this.run(col._id,col.parent_id);
                      }} />
                  </Tooltip>
                  )
                }


              </div>
              {/*<Dropdown overlay={menu(col)} trigger={['click']} onClick={e => e.stopPropagation()}>
                      <Icon className="opts-icon" type='ellipsis'/>
                    </Dropdown>*/}
            </div>
          }
          dataRef={col}
        >
          {col.children ? col.children.filter(me => (me.in === true || typeof me.in === "undefined")).map(colCreate) : ''}
          {col.caseList ? col.caseList.map(itemInterfaceColCreate) : ''}
        </TreeNode>
      );
    };

    // //console.log('currentKey', currentKes)

    let list = this.state.list;


    return (
      <div>
        <div className="interface-filter">
          <Search placeholder="搜索集合/用例/接口路径/集合负责人" onSearch={this.filterCol} />
          <Tooltip placement="bottom" title="添加集合">
            <Button
              type="primary"
              style={{ marginLeft: '16px' }}
              onClick={() => this.showColModal('add')}
              className="btn-filter"
            >
              添加集合
            </Button>
          </Tooltip>
        </div>
       
        {this.state.optCaseids.length>0?(
          <div style={{ textAlign: 'right' }}>
            <Tooltip title="批量更新">
              <EditOutlined onClick={this.SyncModel} style={{ marginRight: '10px' }} />
            </Tooltip>
            <DeleteOutlined onClick={this.delCase} />
          </div>
        ):(null)}

        {this.state.optColids.length>0?(
          <Tooltip title="导入接口">
            <ImportOutlined
              className="interface-delete-icon"
              onClick={e => {
                e.stopPropagation();
                this.showImportInterfaceModalBach();
              }} />
          </Tooltip>
        ):(null)}
        
        {this.state.showSyncModel?(
          <BachUpCase
            reqBodyType={''}
            caseIds={this.state.caseids}
            showSyncModel={true}
            syncForInterface={false}
            upCaseids={this.state.caseids}
            interFaceid={null}
            isClose={this.upCaseModleClose}
            projectId={parseInt(currProjectId)}
            curProject={this.props.curProject}
          >
          </BachUpCase>
        ):null}

        {this.state.treeLoading?(
          <div className="spin-container">
            <Spin size="large" />
          </div>):(
            <div className="tree-wrapper" style={{ maxHeight: parseInt(document.body.clientHeight) - headHeight + 'px',marginTop:10}}>
              <Tree
                multiple
                loadData={this.onLoadData}
                className="col-list-tree"
                expandedKeys={this.state.expandedKeys}
                selectedKeys={this.state.selectedKey}
                loadedKeys={this.state.loadedKeys}
                onSelect={this.onSelect}
                onExpand={this.onExpand}
                draggable={{icon:false}}
                onDrop={this.onDrop}
              >
                {list.filter(me => (me.in === true || typeof me.in === "undefined")).map(colCreate)}
              </Tree>
            </div>
        )}
        
        <ColModalForm
          ref={this.saveFormRef}
          type={colModalType}
          visible={colModalVisible}
          pcol={currentCol}
          colown = {this.state.colown}
          onUserSelect = {this.onUserSelect}
          onCancel={() => {
            this.setState({ colModalVisible: false,colown:'',dfenv:'',editColPid:0 });
          }}
          onCreate={this.addorEditCol}
          env={this.props.curProject.env}
          dfenv={this.state.dfenv}
          useEnv={this.useEnv}
        />

        <Modal
            title="移动用例到其他项目"
            open={this.state.moveCaseVisible}
            className="import-case-modal"
            onOk={this.handleCaseMoveOk}
            onCancel={this.handleCaseMoveCancel}
            width={500}
            destroyOnClose
        >
          <MoveCase
              currProjectId={currProjectId}
              movecallback={this.moveCasecallback}
          />
        </Modal>

        <Modal
          title="导入接口到集合"
          open={importInterVisible}
          onOk={this.handleImportOk}
          onCancel={this.handleImportCancel}
          className="import-case-modal"
          width={1000}
          destroyOnClose={true}
        >
          <ImportInterface currProjectId={currProjectId} selectInterface={this.selectInterface} />
        </Modal>
      </div>
    );
  }
}
