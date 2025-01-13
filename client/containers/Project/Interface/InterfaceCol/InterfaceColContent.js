import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import {findMeInTree3} from '../../../../common.js';
//import constants from '../../../../constants/variable.js'
import {Tooltip, Icon, Input, Button, Row, Col, Spin, Modal, message, Select, Switch, Checkbox,notification,Collapse,Form,List,Radio} from 'antd';
import {
  fetchInterfaceColList,
  fetchCaseList,
  setColData,
  fetchCaseEnvList,
  fetchInterfaceColListall,
  fetchInterfaceColcontainList,
  fetchInterfaceColListForPid
} from '../../../../reducer/modules/interfaceCol';
import HTML5Backend from 'react-dnd-html5-backend';
import { getToken, getEnv } from '../../../../reducer/modules/project';
import { DragDropContext } from 'react-dnd';
import AceEditor from 'client/components/AceEditor/AceEditor';
import * as Table from 'reactabular-table';
import * as dnd from 'reactabular-dnd';
import * as resolve from 'table-resolver';
import axios from 'axios';
import CaseReport from './CaseReport.js';
import _ from 'loadsh';
import produce from 'immer';
import {InsertCodeMap} from 'client/components/Postman/Postman.js';
import ColRequest from './ColRequest';
import moment from 'moment';
import InfiniteScroll from 'react-infinite-scroller';

const Panel = Collapse.Panel;
const FormItem = Form.Item;
const {
  handleParams,
  handleCurrDomain,
  crossRequest,
  checkNameIsExistInArray,
  getsocket,
  setsocket
} = require('common/postmanLib.js');
const { handleParamsValue, json_parse, ArrayToObject } = require('common/utils.js');
import CaseEnv from 'client/components/CaseEnv';
import Label from '../../../../components/Label/Label.js';
const Option = Select.Option;
const createContext = require('common/createContext')

import copy from 'copy-to-clipboard';
import {findStorageKeysFromScript} from "../../../../../common/utils";

const defaultModalStyle = {
  top: 10
}

@connect(
  state => {
    return {
      interfaceColList: state.interfaceCol.interfaceColList,
      interfaceColListall: state.interfaceCol.interfaceColListall,
      interfaceColcontainList: state.interfaceCol.interfaceColcontainList,
      interfaceColListForPid:state.interfaceCol.interfaceColListForPid,
      currColId: state.interfaceCol.currColId,
      currCaseId: state.interfaceCol.currCaseId,
      isShowCol: state.interfaceCol.isShowCol,
      isRander: state.interfaceCol.isRander,
      currCaseList: state.interfaceCol.currCaseList,
      currProject: state.project.currProject,
      token: state.project.token,
      envList: state.interfaceCol.envList,
      curProjectRole: state.project.currProject.role,
      projectEnv: state.project.projectEnv,
      curUid: state.user.uid,
      colpre_script: state.interfaceCol.colrequest.colpre_script,
      colafter_script: state.interfaceCol.colrequest.colafter_script,
      colrequest:state.interfaceCol.colrequest,
      runCols:state.interfaceCol.runCols
    };
  },
  {
    fetchInterfaceColList,
    fetchInterfaceColListall,
    fetchInterfaceColcontainList,
    fetchInterfaceColListForPid,
    fetchCaseList,
    setColData,
    getToken,
    getEnv,
    fetchCaseEnvList
  }
)
@withRouter
@DragDropContext(HTML5Backend)
class InterfaceColContent extends Component {
  static propTypes = {
    match: PropTypes.object,
    interfaceColList: PropTypes.array,
    interfaceColListall: PropTypes.array,
    fetchInterfaceColList: PropTypes.func,
    fetchInterfaceColListall: PropTypes.func,
    fetchInterfaceColListForPid: PropTypes.func,
    fetchInterfaceColcontainList: PropTypes.func,
    interfaceColListForPid: PropTypes.array,
    runCols:PropTypes.array,
    fetchCaseList: PropTypes.func,
    setColData: PropTypes.func,
    history: PropTypes.object,
    currCaseList: PropTypes.array,
    currColId: PropTypes.number,
    currCaseId: PropTypes.number,
    isShowCol: PropTypes.bool,
    isRander: PropTypes.bool,
    currProject: PropTypes.object,
    getToken: PropTypes.func,
    token: PropTypes.string,
    curProjectRole: PropTypes.string,
    getEnv: PropTypes.func,
    projectEnv: PropTypes.object,
    fetchCaseEnvList: PropTypes.func,
    envList: PropTypes.array,
    curUid: PropTypes.number,
    colpre_script: PropTypes.string,
    colafter_script: PropTypes.string,
    colrequest:PropTypes.object
  };

  constructor(props) {
    super(props);
    this.CancelTest = false;
    this.reports = {};
    this.records = {};
    this.state = {
      syncRun:false,
      runCols:[],
      colpre_script: '',
      colafter_script: '',
      subsetcol: false,
      Datadriven: false,
      isLoading: false,
      showLogModal:false,
      showReportLogModal:false,
      reportLog:[],
      showReportLogId:0,
      log_env:'',
      log_url:'',
      log_jobNames:[],
      log_jobName:'',
      serverlog:true,
      run_start:0,
      run_end:0,
      rows: [],
      reports: {},
      visible: false,
      curCaseid: null,
      advVisible: false,
      bodyConfig: false,
      curScript: '',
      enableScript: false,
      autoVisible: false,
      mode: 'html',
      email: false,
      download: false,
      subset: false,
      descendants:false,
      failedinterrupt:false,
      currColEnvObj: {},
      collapseKey: '1',
      caseItem:[],
      changBodyId:[],
      currCaseList:[],
      changBodyLoading:false,
      commonSettingLoop: false,
      LoopSetting: '',
      loopSuccessInterrupt:false,
      loopFailInterrupt:false,
      commonSettingModalVisible: false,
      commonSetting: {
        checkHttpCodeIs200: false,
        checkResponseField: {
          name: 'code',
          value: '0',
          enable: false
        },
        checkResponseSchema: false,
        checkScript:{
          enable: false,
          content: ''
        }
      }
    };
    this.onRow = this.onRow.bind(this);
    this.onMoveRow = this.onMoveRow.bind(this);
    this.cancelSourceSet = new Set();
  }

  /**
   * 取消上一次的请求
   */
  cancelRequestBefore = () => {
    this.cancelSourceSet.forEach(v => {
      v.cancel();
    });
    this.cancelSourceSet.clear();
  }

  async handleColIdChange(newColId){
    this.props.setColData({
      currColId: +newColId,
      isShowCol: true,
      isRander: false
    });

    this.setState({
      isLoading: true
    });

    this.cancelRequestBefore();
    let cancelSource = axios.CancelToken.source();
    this.cancelSourceSet.add(cancelSource);
    let resArr = await Promise.all([
      this.props.fetchCaseList(newColId, {
        cancelToken: cancelSource.token
      }),
      this.props.fetchCaseEnvList(newColId, {
        cancelToken: cancelSource.token
      })
    ]);
    this.cancelSourceSet.delete(cancelSource);
    if (resArr.some(res => axios.isCancel(res.payload))) return;

    const [result] = resArr;
    if (result.payload && result.payload.data.errcode === 0) {
      this.reports = result.payload.data.test_report;
    //  console.log({"reports":JSON.parse(JSON.stringify(this.reports))});
      this.setState({
        commonSetting:{
          ...this.state.commonSetting,
          ...result.payload.data.colData
        },
        run_start:result.payload.data.colData.run_start,
        run_end:result.payload.data.colData.run_end
      })
    }
    this.setState({
      isLoading: false
    });
    this.changeCollapseClose();
    this.handleColdata(this.props.currCaseList);
    var caseItem = [];
    this.state.rows.forEach(item=>{
      caseItem.push({id:item._id,name:item.casename})
    })
    this.setState({caseItem:caseItem,currCaseList:this.props.currCaseList})
  }

  async componentWillMount() {
    this.CancelTest = false;
    // let cancelSource = axios.CancelToken.source();
    // this.cancelSourceSet.add(cancelSource);
    // const resArr = await Promise.all([
    //   this.props.fetchInterfaceColList(this.props.match.params.id, {
    //     cancelToken: cancelSource.token
    //   }),
    //   this.props.getToken(this.props.match.params.id, {
    //     cancelToken: cancelSource.token
    //   })
    // ]);
    // this.cancelSourceSet.delete(cancelSource);
    // if (resArr.some(res => axios.isCancel(res.payload))) return;

    // const [result] = resArr;

    let { currColId } = this.props;
    const params = this.props.match.params;
    const { actionId } = params;
    this.currColId = currColId = +actionId;
    // this.currColId = currColId = +actionId || result.payload.data.data[0]._id;
    if (currColId && currColId != 0) {
      this.props.history.push('/project/' + params.id + '/interface/col/' + currColId);
      await this.handleColIdChange(currColId)
    }
    if(!this.props.token){
      this.props.getToken(this.props.match.params.id)
    }
  }

  componentWillUnmount() {
    this.cancelRequestBefore();
    console.log('col unmount');
    this.CancelTest = true;
    this.reports = {};
    this.records = {};
    clearInterval(this._crossRequestInterval);
  }

  // 更新分类简介
  handleChangeInterfaceCol = (desc, name) => {
    let params = {
      col_id: this.props.currColId,
      name: name,
      desc: desc
    };

    axios.post('/api/col/up_col', params).then(async res => {
      if (res.data.errcode) {
        return message.error(res.data.errmsg);
      }
      let project_id = this.props.match.params.id;
      await this.props.fetchInterfaceColList(project_id);
      message.success('接口集合简介更新成功');
    });
  };

  // 整合header信息
  handleReqHeader = (project_id, req_header, case_env) => {
    let envItem = _.find(this.props.envList, item => {
      return item._id === project_id;
    });

    let currDomain = handleCurrDomain(envItem && envItem.env, case_env);
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

  handleColdata = (rows, currColEnvObj = {}) => {
  //  console.log({'rows':JSON.parse(JSON.stringify(rows))});
    let caseItem = [];
    let that = this;
    let newRows = produce(rows, draftRows => {
      draftRows.map(item => {
        caseItem.push({id:item._id,name:item.casename});
        item.id = item._id;
        item._test_status = item.test_status;
        if(currColEnvObj[item.project_id]){
          item.case_env =currColEnvObj[item.project_id];
        }
        item.req_headers = that.handleReqHeader(item.project_id, item.req_headers, item.case_env);
        return item;
      });
    });
    this.setState({ rows: newRows,caseItem:caseItem });
  };


//此方法暂时没用
  executeTestsinserver = async () => {
    this.reports={};
    for (let i = 0, l = this.state.rows.length, newRows, curitem; i < l; i++) {
      let { rows } = this.state;

      let envItem = _.find(this.props.envList, item => {
        return item._id === rows[i].project_id;
      });

      curitem = Object.assign(
        {},
        {caseitme:rows[i]},
        {
          env: envItem.env,
          pre_script: this.props.currProject.pre_script,
          after_script: this.props.currProject.after_script,
          colpre_script:this.props.colpre_script,
          colafter_script:this.props.colafter_script
        },
        {token:this.props.token}
      );
      curitem.caseitme.test_status='loading'
      newRows = [].concat([], rows);
      newRows[i] = curitem.caseitme;
      this.setState({ rows: newRows });
      let status = 'error',
        result;
      try {
       // console.log({curitem});
        result = await axios.post('/api/open/run_case', {params:curitem});
        result=result.data.data;
        if (result.code === 400) {
          status = 'error';
        } else if (result.code === 0) {
          status = 'ok';
        } else if (result.code === 1) {
          status = 'invalid';
        }
      } catch (e) {
        console.error(e);
        status = 'error';
        result = e;
      }
      console.log({['用例：'+curitem.caseitme.casename+'执行结果']:result})

      //result.body = result.data;
      this.reports[curitem.caseitme._id] = result;
      this.records[curitem.caseitme._id] = {
        status: result.status,
        params: result.params,
        body: result.res_body
      };

      curitem = Object.assign({}, rows[i], { test_status: status });
      newRows = [].concat([], rows);
      newRows[i] = curitem;
      //console.log({newRows});
      this.setState({ rows: newRows });
    }
    await axios.post('/api/col/up_col', {
      col_id: this.props.currColId,
      test_report: JSON.stringify(this.reports)
    });
  };

  viewLog=()=>{
    this.setState({showLogModal:true});
  }
  viewreportLog=async ()=>{
    let result = await axios.get('/api/col/getreportlog?id='+this.props.currColId);
    if(result.data.errcode!==0){
      message.error(result.data.errmsg)
    }else{
      let log = result.data.data;
      for(let item of log){
        item.add_time = moment(item.add_time*1000).format("YYYY-MM-DD HH:mm:ss");
      }
      this.setState({showReportLogModal:true,reportLog:log});
    }
  }
  executeTests = async () => {
    let run_start = Math.round(new Date().getTime());
    this.reports={};
    this.CancelTest=false;
    for (let i = 0, l = this.state.rows.length, newRows, curitem; i < l; i++) {
      let { rows } = this.state;

      let envItem = _.find(this.props.envList, item => {
        return item._id === rows[i].project_id;
      });

      if(this.state.subsetcol){
        curitem = Object.assign(
          {},
          rows[i],
          {
            env: envItem.env,
            pre_script: this.props.currProject.pre_script,
            after_script: this.props.currProject.after_script
          },
          { test_status: 'loading' }
        );
      }else{
        curitem = Object.assign(
          {},
          rows[i],
          {
            env: envItem.env,
            pre_script: this.props.currProject.pre_script,
            after_script: this.props.currProject.after_script,
            colpre_script:this.props.colpre_script,
            colafter_script:this.props.colafter_script
          },
          { test_status: 'loading' }
        );
      }
      newRows = [].concat([], rows);
      newRows[i] = curitem;
      this.setState({ rows: newRows });
      let status = 'error',
        result;
      // console.log('curitem',curitem);
      try {
        result = await this.handleTest(curitem);

        if (result.code === 400) {
          status = 'error';
        } else if (result.code === 0) {
          status = 'ok';
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
          status = 'invalid';
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
        status = 'error';
        result = e;
      }

      //result.body = result.data;
      this.reports[curitem._id] = result;
      this.records[curitem._id] = {
        status: result.status,
        params: result.params,
        body: result.res_body
      };

      // curitem = Object.assign({}, rows[i], { test_status: status });
      // newRows = [].concat([], rows);
      // newRows[i] = curitem;
      // this.setState({ rows: newRows });

      this.setState(prevState => {
        const newRows = prevState.rows.map((row, j) => 
          j === i ? { ...row, test_status: status } : row
        );
        return { rows: newRows };
      });
    }
    if(this.CancelTest){
      return ;
    }
    let run_end = Math.round(new Date().getTime());
    var col_report = JSON.stringify(this.reports);
    this.setState({run_start:run_start,run_end:run_end});
    if(col_report.indexOf("验证失败")>=0){
      await axios.post('/api/col/up_col', {
        col_id: this.props.currColId,
        test_report: col_report,
        status : 1,
        run_start:run_start,
        run_end:run_end
      });
    }else{
      await axios.post('/api/col/up_col', {
        col_id: this.props.currColId,
        test_report: col_report,
        status : 0,
        run_start:run_start,
        run_end:run_end
      });
    }
    if(this.state.commonSetting.parent_id==-1||!this.state.commonSetting.parent_id||this.state.commonSetting.parent_id==0){
      this.props.fetchInterfaceColList(this.state.commonSetting.project_id);
    }else{
      this.props.fetchInterfaceColListForPid(this.state.commonSetting.parent_id);
    }
    // await axios.post('/api/col/up_col', {
    //   col_id: this.props.currColId,
    //   test_report: JSON.stringify(this.reports)
    // });
  };

executeTestsFail = async () => {
  let run_start = Math.round(new Date().getTime());
  this.reports={};
  this.CancelTest=false;
    for (let i = 0, l = this.state.rows.length, newRows, curitem; i < l; i++) {
      let { rows } = this.state;

      let envItem = _.find(this.props.envList, item => {
        return item._id === rows[i].project_id;
      });

      if(this.state.subsetcol){
        curitem = Object.assign(
          {},
          rows[i],
          {
            env: envItem.env,
            pre_script: this.props.currProject.pre_script,
            after_script: this.props.currProject.after_script
          },
          { test_status: 'loading' }
        );
      }else{
        curitem = Object.assign(
          {},
          rows[i],
          {
            env: envItem.env,
            pre_script: this.props.currProject.pre_script,
            after_script: this.props.currProject.after_script,
            colpre_script:this.props.colpre_script,
            colafter_script:this.props.colafter_script
          },
          { test_status: 'loading' }
        );
      }
      newRows = [].concat([], rows);
      newRows[i] = curitem;
      this.setState({ rows: newRows });
      let status = 'error',
        result;
      try {
        result = await this.handleTest(curitem);

        if (result.code === 400) {
          status = 'error';
        } else if (result.code === 0) {
          status = 'ok';
        } else if (result.code === 1) {
          status = 'invalid';
        }else if(result.code == 514){
          break;
        }
      } catch (e) {
        console.error(e);
        console.log('异常的失败');
        status = 'error';
        result = e;
      }

      //result.body = result.data;
      this.reports[curitem._id] = result;
      this.records[curitem._id] = {
        status: result.status,
        params: result.params,
        body: result.res_body
      };

      this.setState(prevState => {
        const newRows = prevState.rows.map((row, j) => 
          j === i ? { ...row, test_status: status } : row
        );
        return { rows: newRows };
      });
      //测试失败中断
      try {
          if (result.code === 400) {
              console.log('数据异常失败');
              break;
            } else if (result.code === 0) {
              console.log('正常通过');
            } else if (result.code === 1) {
              console.log('校验的失败');
              break;
            }
          } catch (e) {
            console.log('异常的失败');
            break;
      }
    }
    if(this.CancelTest){
      return ;
    }
    let run_end = Math.round(new Date().getTime());
    this.setState({run_start:run_start,run_end:run_end});

    var col_report = JSON.stringify(this.reports);
    if(col_report.indexOf("验证失败")>=0){
      await axios.post('/api/col/up_col', {
        col_id: this.props.currColId,
        test_report: col_report,
        status : 1,
        run_start:run_start,
        run_end:run_end
      });
    }else{
      await axios.post('/api/col/up_col', {
        col_id: this.props.currColId,
        test_report: col_report,
        status : 0,
        run_start:run_start,
        run_end:run_end
      });
    }
    if(this.state.commonSetting.parent_id==-1||!this.state.commonSetting.parent_id||this.state.commonSetting.parent_id==0){
      this.props.fetchInterfaceColList(this.state.commonSetting.project_id);
    }else{
      this.props.fetchInterfaceColListForPid(this.state.commonSetting.parent_id);
    }
  };

executeTestsloop = async () => {
    let run_start = Math.round(new Date().getTime());
    this.reports={};
    this.CancelTest=false;
    var num = this.state.LoopSetting;
    var onlycases = this.state.onlycases;
    console.log('次数',num);
    if(isNaN(num)||num.replace(/(^\s*)|(\s*$)/g,"")=="")
    {
      message.error("请输入数字");
    }else{
      this.setState({
        commonSettingLoop: false,
        LoopSetting: '',
        isloading:true,
        onlycases:[]
      })
      var successcolnum = 0; //集合成功次数
      var failcolnum = 0; //集合失败次数
      for(let q =1;q<=num;q++){
        //设置循环storage
        await axios.post('/api/utils/setstorage', {
          taskId: this.props.curUid+'',
          key: 'LoopSetting',
          value: q
        });
        window.localStorage.setItem('LoopSetting',parseInt(q));
        var successcasenum = 0;//用例通过次数
        var failcasenum = 0;//用例失败次数
        for (let i = 0, l = this.state.rows.length, newRows, curitem; i < l; i++) {
          //如果是第二次运行则判断仅一次运行的用例进行跳过
          if(q>=2&&typeof(onlycases)=='object'&&onlycases.includes(this.state.rows[i].id.toString())){
            successcasenum += 1;
            continue;
          }
          let { rows } = this.state;

          let envItem = _.find(this.props.envList, item => {
            return item._id === rows[i].project_id;
          });

          if(this.state.subsetcol){
            curitem = Object.assign(
              {},
              rows[i],
              {
                env: envItem.env,
                pre_script: this.props.currProject.pre_script,
                after_script: this.props.currProject.after_script
              },
              { test_status: 'loading' }
            );
          }else{
            curitem = Object.assign(
              {},
              rows[i],
              {
                env: envItem.env,
                pre_script: this.props.currProject.pre_script,
                after_script: this.props.currProject.after_script,
                colpre_script:this.props.colpre_script,
                colafter_script:this.props.colafter_script
              },
              { test_status: 'loading' }
            );
          }
          newRows = [].concat([], rows);
          newRows[i] = curitem;
          this.setState({ rows: newRows });
          let status = 'error',
            result;
          try {
            result = await this.handleTest(curitem);

            if (result.code === 400) {
              status = 'error';
            } else if (result.code === 0) {
              status = 'ok';
            } else if (result.code === 1) {
              status = 'invalid';
            }else if(result.code == 514){
              break;
            }
          } catch (e) {
            console.error(e);
            console.log('异常的失败');
            status = 'error';
            result = e;
          }

          //result.body = result.data;
          this.reports[curitem._id] = result;
          this.records[curitem._id] = {
            status: result.status,
            params: result.params,
            body: result.res_body
          };

          this.setState(prevState => {
            const newRows = prevState.rows.map((row, j) => 
              j === i ? { ...row, test_status: status } : row
            );
            return { rows: newRows };
          });
          //统计循环测试
          try {
              if (result.code === 400) {
                  failcasenum += 1;
                } else if (result.code === 0) {
                  successcasenum += 1;
                } else if (result.code === 1) {
                  failcasenum += 1;
                }
              } catch (e) {
                console.log('异常的失败');
                failcasenum += 1;
          }
        }
        if(this.CancelTest){
          break ;
        }
        if(successcasenum==this.state.rows.length){
          successcolnum += 1;
        }else{
          failcolnum += 1;
        }
        console.log('失败用例数：'+failcasenum);
        let run_end = Math.round(new Date().getTime());
        this.setState({run_start:run_start,run_end:run_end});
        await axios.post('/api/col/up_col', {
          col_id: this.props.currColId,
          test_report: JSON.stringify(this.reports),
          run_start:run_start,
          run_end:run_end
        });
        if(this.state.loopSuccessInterrupt&&successcasenum==this.state.rows.length){
          this.setState({
            loopSuccessInterrupt:false
          })
          break;
        }
        if(this.state.loopFailInterrupt&&failcasenum>0){
          this.setState({
            loopFailInterrupt:false
          })
          break;
        }
      }
      if(this.CancelTest){
        return ;
      }
      console.log('总执行成功数：',successcolnum);
      console.log('总执行失败数：',failcolnum);
      this.openNotification(successcolnum,failcolnum);
      this.setState({
        isloading:false
      })
      //清除storage
      await axios.post('/api/utils/setstorage', {
        taskId: this.props.curUid+'',
        key: 'LoopSetting',
        value: 0
      });
      window.localStorage.removeItem('LoopSetting');
    }
  };
  openNotification = (successnum,failnum) => {
    const message= '总执行成功数：'+successnum +' \n\n总执行失败数：'+failnum
    notification.open({
      message: '循环测试结果',
      description:message,
      duration: 0
    });
  };
  handleTest = async interfaceData => {
    if (this.CancelTest) {
      let result = {
        code: 514,
        msg: '中断',
        validRes: []
      };
      return result;
    }
    let requestParams = {};
    let options = handleParams(interfaceData, this.handleValue, requestParams);

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
        this.props.curUid,
        this.props.match.params.id,
        interfaceData.interface_id
      ));
      options.taskId = this.props.curUid;
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
      if (this.CancelTest) {
        let result = {
          code: 514,
          msg: '中断',
          validRes: []
        };
        return result;
      }
      if(data.res.header['Skip']){
        //跳过
        result.code = 0;
        result.validRes = [
          {
            message: 'case跳过'
          }
        ],
        result.msg='case跳过';
        return result;
      }

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
      // 断言测试
      await this.handleScriptTest(interfaceData, responseData, validRes, requestParams);

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

  //response, validRes
  // 断言测试
  handleScriptTest = async (interfaceData, response, validRes, requestParams) => {
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
        records: this.records,
        script: interfaceData.test_script,
        params: requestParams,
        col_id: this.props.currColId,
        interface_id: interfaceData.interface_id,
        storageDict,
        taskId: this.props.curUid
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

  handleValue = (val, global) => {
    let globalValue = ArrayToObject(global);
    let context = Object.assign({}, { global: globalValue }, this.records);
    return handleParamsValue(val, context);
  };

  arrToObj = (arr, requestParams) => {
    arr = arr || [];
    const obj = {};
    arr.forEach(item => {
      if (item.name && item.enable && item.type !== 'file') {
        obj[item.name] = this.handleValue(item.value);
        if (requestParams) {
          requestParams[item.name] = obj[item.name];
        }
      }
    });
    return obj;
  };


  onRow(row) {
    return { rowId: row.id, onMove: this.onMoveRow, onDrop: this.onDrop };
  }

  onDrop = () => {
    let changes = [];
    this.state.rows.forEach((item, index) => {
      changes.push({ id: item._id, index: index });
    });
    axios.post('/api/col/up_case_index', changes).then(() => {
      this.props.fetchInterfaceColList(this.props.match.params.id);
    });
  };
  onMoveRow({ sourceRowId, targetRowId }) {
    let rows = dnd.moveRows({ sourceRowId, targetRowId })(this.state.rows);

    if (rows) {
      this.setState({ rows });
    }
  }

  onChangeTest = d => {

    this.setState({
      commonSetting: {
        ...this.state.commonSetting,
        checkScript: {
          ...this.state.commonSetting.checkScript,
          content: d.text
        }
      }
    });
  };

  handleInsertCode = code => {
    this.aceEditor.editor.insertCode(code);
  };

  async componentWillReceiveProps(nextProps) {
    let newColId = !isNaN(nextProps.match.params.actionId) ? +nextProps.match.params.actionId : 0;
    if ((newColId && newColId !== this.currColId) || nextProps.isRander) {
      this.CancelTest = true;
      this.currColId = newColId;
        this.setState(
          {
            descendants:false,
            subsetcol:false
          }
        );
      await this.handleColIdChange(newColId)
    }

    if (this.props.colrequest.pre_col !== nextProps.colrequest.pre_col) {
      await this.handleColIdChange(newColId)
    }

    if(this.props.runCols.includes(newColId)){
      this.setState({syncRun:true,runCols:[newColId]});
    }
    if(!this.props.runCols.includes(newColId)){
      if(this.state.runCols.includes(newColId)){
        message.success('异步执行完毕，请刷新集合...');
      }
      this.setState({syncRun:false,runCols:[]});
    }
  }

  // 测试用例环境面板折叠
  changeCollapseClose = key => {
    if (key) {
      this.setState({
        collapseKey: key
      });
    } else {
      this.setState({
        collapseKey: '1',
        currColEnvObj: {}
      });
    }
  };

  openReport = id => {
    if (!this.reports[id]) {
      return message.warn('还没有生成报告');
    }
    this.setState({ visible: true, curCaseid: id });
  };

  // openAdv = id => {
  //   let findCase = _.find(this.props.currCaseList, item => item.id === id);
  //
  //   this.setState({
  //     enableScript: findCase.enable_script,
  //     curScript: findCase.test_script,
  //     advVisible: true,
  //     curCaseid: id
  //   });
  // };

  handleScriptChange = d => {
    this.setState({ curScript: d.text });
  };

  handleAdvCancel = () => {
    this.setState({ advVisible: false });
  };

  handleAdvOk = async () => {
    const { curCaseid, enableScript, curScript } = this.state;
    const res = await axios.post('/api/col/up_case', {
      id: curCaseid,
      test_script: curScript,
      enable_script: enableScript
    });
    if (res.data.errcode === 0) {
      message.success('更新成功');
    }
    this.setState({ advVisible: false });
    let currColId = this.currColId;
    this.props.setColData({
      currColId: +currColId,
      isShowCol: true,
      isRander: false
    });
    await this.props.fetchCaseList(currColId);

    this.handleColdata(this.props.currCaseList);
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };

  currProjectEnvChange = (envName, project_id) => {
    let currColEnvObj = {
      ...this.state.currColEnvObj,
      [project_id]: envName
    };
    this.setState({ currColEnvObj });
   // this.handleColdata(this.props.currCaseList, envName, project_id);
   this.handleColdata(this.props.currCaseList,currColEnvObj);
  };

  autoTests = () => {
    this.setState({ autoVisible: true, currColEnvObj: {}, collapseKey: '' });
  };

  handleAuto = () => {
    this.setState({
      autoVisible: false,
      email: false,
      download: false,
      descendants:false,
      mode: 'html',
      currColEnvObj: {},
      collapseKey: '',
      subset:false,
      failedinterrupt:false,
      serverlog:true,
      log_url:'',
      log_jobName:'',
      log_env:''
    });
  };

  copyUrl = url => {
    copy(url);
    message.success('已经成功复制到剪切板');
  };

  modeChange = mode => {
    this.setState({ mode });
  };

  emailChange = email => {
    this.setState({ email });
  };

  downloadChange = download => {
    this.setState({ download });
  };
  //服务端调用子集合请求配置
  subsetChange = subset => {
    this.setState({ subset });
  };
  changeServerlog = serverlog =>{
    this.setState({serverlog})
  }
  Failedinterrupt = failedinterrupt =>{
    this.setState({failedinterrupt})
  }
  handleColEnvObj = envObj => {
    let str = '';
    for (let key in envObj) {
      str += envObj[key] ? `&env_${key}=${envObj[key]}` : '';
    }
    return str;
  };
  searchLog=()=>{
    let run_start = this.state.run_start;
    let run_end = this.state.run_end;
    if(run_end==0){
      run_end = Math.round(new Date().getTime());
    }else{
      //延后一秒
      run_end = run_end+1000;
    }
    if(run_start==0){
      //前五分钟
      run_start = Math.round(new Date().getTime())-300000;
    }
    // 获取屏幕的宽度和高度
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // 计算窗口的宽度和高度 (80%)
    const windowWidth = screenWidth * 0.8;
    const windowHeight = screenHeight * 0.8;
    
    window.open(`${this.state.log_url}/d/8v3LFO2nk/logs-app?orgId=1&var-app=${this.state.log_jobName}&var-search=&from=${run_start}&to=${run_end}`, '_blank',`width=${windowWidth},height=${windowHeight}`);
    this.setState({showLogModal:false,log_jobName:'',log_env:'',log_jobNames:[],log_url:''});
  }
  closeLogModal=()=>{
    this.setState({showLogModal:false,log_jobName:'',log_env:'',log_jobNames:[],log_url:''});
  }
  ShowReportLog =async ()=>{
    if(this.state.showReportLogId==0){
      message.error('未选择日志');
      return
    }
    let result = await axios.get('/api/col/getReportDetail?id='+this.state.showReportLogId);
    if(result.data.errcode!==0){
      message.error(result.data.errmsg);
    }else{
      let log = JSON.parse(result.data.data.test_report);
      this.reports = log;
      //重新渲染
      for (let i = 0, l = this.state.rows.length, newRows, curitem; i < l; i++) {
        let { rows } = this.state;
        let id = rows[i]._id;

        curitem = Object.assign(
          {},
          rows[i],
          { test_status: 'loading' }
        );
        newRows = [].concat([], rows);
        newRows[i] = curitem;
        this.setState({ rows: newRows });
        let status = 'error',
          result;
        try {
          result = log[id];
          //可能日志没有该用例
          if(!result){
            status = 'invalid';
          }else if (result.code === 400) {
            status = 'error';
          } else if (result.code === 0) {
            status = 'ok';
          } else if (result.code === 1) {
            status = 'invalid';
          }else if(result.code == 514){
            break;
          }else{
            status = 'invalid';
          }
        } catch (e) {
          console.error(e);
          status = 'error';
          result = e;
        }
  
        this.setState(prevState => {
          const newRows = prevState.rows.map((row, j) => 
            j === i ? { ...row, test_status: status } : row
          );
          return { rows: newRows };
        });
      }

      message.success('已替换为日志报告');
    }
    this.setState({showReportLogModal:false,reportLog:[],showReportLogId:0});
  }
  setShowReportLogId =(e,item)=>{
    this.setState({showReportLogId:e.target.value,run_start:item.run_start,run_end:item.run_end})
  }
  closeReportLogModal=()=>{
    this.setState({showReportLogModal:false,reportLog:[],showReportLogId:0});
  }
  selectDomain = async value => {
    await this.setState({ log_env:value });
    let jobName=[];
    this.props.currProject.env.forEach(item=>{
      if(item._id==value){
        item.logs.forEach(i=>{
          if(i.name=='url'){
            this.setState({log_url:i.value});
          }
          if(i.name=='jobName'){
            jobName.push(i.value)
          }
        })
        this.setState({log_jobNames:jobName});
      }
    })

  };
  setjobName = value => {
    this.setState({log_jobName:value});
  }
  handleCommonSetting = ()=>{
    let setting = this.state.commonSetting;

    let params = {
      col_id: this.props.currColId,
      ...setting

    };
  //  console.log(params)

    axios.post('/api/col/up_col', params).then(async res => {
      if (res.data.errcode) {
        return message.error(res.data.errmsg);
      }
      message.success('配置测试集成功');
    });

    this.setState({
      commonSettingModalVisible: false
    })
  }

  cancelCommonSetting = ()=>{
    this.setState({
      commonSettingModalVisible: false
    })
  }

  openCommonSetting = ()=>{
    this.setState({
      commonSettingModalVisible: true
    })
  }

  cancelLoopSetting = ()=>{
    this.setState({
      commonSettingLoop: false,
      LoopSetting: '',
      onlycases:[]
    })
  }

  openLoopSetting = ()=>{
    this.setState({
      commonSettingLoop: true
    })
  }
  setOnlyCase =async (value)=>{
    await this.setState({onlycases:value});
  }
  changeLoopSetting = e =>{
    // console.log('eLoop',e.target.value);
    if(isNaN(e.target.value-0))
    {
      message.error("请输入数字");
    }else if(e.target.value-0>0){
      this.setState({
        LoopSetting: e.target.value
      })
    }else{
      this.setState({
        LoopSetting: null
      })
    }
    // return (e)=>{
    //   let value = e;
    //   if(typeof e === 'object' && e){
    //     value = e.target.value;驱动
    //   }
    //   this.setState({
    //     LoopSetting: value
    //       })
    // }
  }
  openDatadriven = ()=>{
    this.setState({
      Datadriven: true
    })
  }
  cancelDatadriven = ()=>{
    this.setState({
      Datadriven: false
    })
  }
  openBodyConfig = ()=>{
    this.setState({
      bodyConfig: true
    })
  }
  cancelBodyConfig = ()=>{
    this.setState({
      bodyConfig: false,
      currCaseList:this.props.currCaseList,
      changBodyId:[]
    })
  }
  changBody = (text,id)=>{
    this.setState(prevState => {
      const newRows = prevState.currCaseList.map((row) => 
        row._id === id ? { ...row, req_body_other: text } : row
      );
      return { currCaseList: newRows };
    });
    let changid = this.state.changBodyId;

    if (!changid.includes(id)) {
      changid.push(id);
    }
    this.setState({changBodyId:changid})

  }
  changTestScript = (text,id)=>{
    this.setState(prevState => {
      const newRows = prevState.currCaseList.map((row) => 
        row._id === id ? { ...row, test_script: text } : row
      );
      return { currCaseList: newRows };
    });
    let changid = this.state.changBodyId;
    if (!changid.includes(id)) {
      changid.push(id);
    }

    this.setState({changBodyId:changid})
  }
  batchChangBody =async ()=>{
    let upCaseList = [];
    this.setState({changBodyLoading:true})
    if(this.state.changBodyId.length>0){
      for(let i=0;i<this.state.currCaseList.length;i++){
        for(let j=0;j<this.state.changBodyId.length;j++){
          if(this.state.currCaseList[i]._id==this.state.changBodyId[j]){
            let caseObj={};
            caseObj['_id'] = this.state.currCaseList[i]._id;
            if(this.state.currCaseList[i].req_body_type=='json'){
              caseObj['req_body_other'] = this.state.currCaseList[i].req_body_other;
            }
            caseObj['test_script'] = this.state.currCaseList[i].test_script;
            upCaseList.push(caseObj);
          }
        }
      }
      let result = await axios.post('/api/col/bachChangeCase', {
        upcases: upCaseList
      });
      if (result.data.errcode !== 200) {
        message.error(result.data.errmsg)
      } else {
          message.success("更新用例成功")
      }
          //刷新列表
      await this.handleColIdChange(this.props.currColId);
    }

    this.setState({
      bodyConfig: false,
      changBodyId:[],
      changBodyLoading:false
    })
  }
  changeCommonFieldSetting = (key)=>{
    return (e)=>{
      let value = e;
      if(typeof e === 'object' && e){
        value = e.target.value;
      }
      let {checkResponseField} = this.state.commonSetting;
      this.setState({
        commonSetting: {
          ...this.state.commonSetting,
          checkResponseField: {
            ...checkResponseField,
            [key]: value
          }
        }
      })
    }
  }
  onChangeCheckboxLoops = e =>{
    console.log(`checked = ${e.target.checked}`);
    this.setState({loopSuccessInterrupt:e.target.checked});
  }
  onChangeCheckboxLoopf = e =>{
    console.log(`checked = ${e.target.checked}`);
    this.setState({loopFailInterrupt:e.target.checked});
  }

  onChangeCheckbox = async e => {
    this.setState({isLoading:true});
    let allChilds = e.target.allChilds;
    //查所有集合
    if(e.target.checked){
      // let result = await this.props.fetchInterfaceColListall(this.props.match.params.id);
      let result = await axios.get('/api/col/getchilds?id=' + this.props.match.params.actionId);
      let ids = [parseInt(this.props.match.params.actionId)];
      result = result.data.data;
      result.forEach(item=>(
        ids.push(item._id)
      ))
      result = await this.props.fetchInterfaceColcontainList(ids);
      // console.log('findMeInTree3(result.data.data, this.props.currColId)',findMeInTree3(result.data.data, this.props.currColId));
      allChilds = findMeInTree3(result.payload.data.data, this.props.currColId).childs;
    }
    await this.flushdescendants(e.target.checked,  allChilds);
    this.setState({isLoading:false});
  };
  //开启子集合请求配置规则
  onChangeSubsetcol = async e => {
    this.setState({ subsetcol: e.target.checked });
  };

  //descendants
  descendants = async (descendants,e) => {
    // console.log({descendants,'e.target.dataset':e.target.dataset})
    await this.flushdescendants(descendants, e.target.dataset.allchilds+'');
  };

  flushdescendants = async (descendants,allChilds) => {
    let childscol = this.props.currColId;
    this.setState({
      descendants
    });
    //   console.log({"state":this.state,e,"props":this.props});
    if (descendants) {
      childscol = allChilds;
    }
    await this.props.fetchCaseList(childscol);
    await this.props.fetchCaseEnvList(childscol);
    this.changeCollapseClose();
    this.handleColdata(this.props.currCaseList);
  };

  getSummaryText = () => {
    const { rows } = this.state;
    let totalCount = rows.length || 0;
    let passCount = 0; // 测试通过
    let errorCount = 0; // 请求异常
    let failCount = 0; // 测试失败
    let loadingCount = 0; // 测试中
    let runtime = 0;//运行时长
//    let unexecutedCount = 0; // 未执行
    //  console.log('rows',rows);
        rows.forEach(rowData => {
          let id = rowData._id;
          let code = this.reports[id] ? this.reports[id].code : 0;
          try{
            if(this.reports[id] && 'res_header' in this.reports[id]){
              let time = this.reports[id] ? this.reports[id].res_header.runtime : 0;
              if(time){
                let newtime =  time.replace('ms','')-0;
                runtime += newtime;
              }
            }
          }catch(err){
            console.log('请求异常',err)
          }
          if (rowData.test_status === 'loading') {
            loadingCount += 1;
            return;
          }
          switch (code) {
            case 0:
              passCount += 1;
              break;
            case 400:
              errorCount += 1;
              break;
            case 1:
              failCount += 1;
              break;
            default:
              passCount += 1;
//                unexecutedCount += 1;
              break;
          }
        });
//    let test = passCount+loadingCount+errorCount+failCount;
    return `用例共 (${totalCount}) 个,其中：["通过: ${passCount} 个 ", "正在执行: ${loadingCount} 个 ", "请求异常: ${errorCount} 个", "验证失败: ${failCount} 个"],总运行时长 ${runtime}ms`
  };


  render() {
    const currProjectId = this.props.currProject._id;
    // const currColId=this.props.currColId;
    // const colpre_script=this.props.colpre_script;
    // const colafter_script=this.props.colafter_script;
    const caseItem = [];
    this.state.caseItem.forEach(item=>{
      caseItem.push(<Option key={item.id.toString() }>{item.id.toString()+' '+item.name.toString()}</Option>);
    })
    const log_env = [];
    this.props.currProject.env.forEach(item=>{
      log_env.push(<Option key={item._id.toString()}>{item.name+' '+item.domain}</Option>);
    })
    const jobNames = [];
    this.state.log_jobNames.forEach(item=>{
      jobNames.push(<Option key={item}>{item}</Option>);
    })
    const columns = [
      {
        property: 'casename',
        header: {
          label: '用例名称'
        },
        props: {
          style: {
            width: '250px'
          }
        },
        cell: {
          formatters: [
            (text, { rowData }) => {
           // console.log({rowData});
              let record = rowData;
              if(this.props.colrequest.pre_col&&this.props.colrequest.pre_col.indexOf(record.col_id)>=0){
                return (
                  <Link to={'/project/' + currProjectId + '/interface/case/' + record._id}>
                    {record.casename.length > 23
                      ? "前置colCase--"+record.casename.substr(0, 20) + '...'
                      : "前置colCase--"+record.casename}
                  </Link>
                );
              }else{
                return (
                  <Link to={'/project/' + currProjectId + '/interface/case/' + record._id}>
                    {record.casename.length > 23
                      ? record.casename.substr(0, 20) + '...'
                      : record.casename}
                  </Link>
                );
              }

            }
          ]
        }
      },
      {
        header: {
          label: 'key',
          formatters: [
            () => {
              return (
                <Tooltip
                  title={
                    <span>
                      {' '}
                      每个用例都有唯一的key，用于获取所匹配接口的响应数据，例如使用{' '}
                      <a
                        href="doc/documents/case.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5%EF%BC%8C%E7%BC%96%E8%BE%91%E6%B5%8B%E8%AF%95%E7%94%A8%E4%BE%8B"
                        className="link-tooltip"
                        target="blank"
                      >
                        {' '}
                        变量参数{' '}
                      </a>{' '}
                      功能{' '}
                    </span>
                  }
                >
                  Key
                </Tooltip>
              );
            }
          ]
        },
        props: {
          style: {
            width: '100px'
          }
        },
        cell: {
          formatters: [
            (value, { rowData }) => {
              return <span>{rowData._id}</span>;
            }
          ]
        }
      },
      {
        property: 'test_status',
        header: {
          label: '状态'
        },
        props: {
          style: {
            width: '100px'
          }
        },
        cell: {
          formatters: [
            (value, { rowData }) => {
              let id = rowData._id;
              let code = this.reports[id] ? this.reports[id].code : 0;
              if (rowData.test_status === 'loading') {
                return (
                  <div>
                    <Spin />
                  </div>
                );
              }

              switch (code) {
                case 0:
                  return (
                    <div>
                      <Tooltip title="Pass">
                        <Icon
                          style={{
                            color: '#00a854'
                          }}
                          type="check-circle"
                        />
                      </Tooltip>
                    </div>
                  );
                case 400:
                  return (
                    <div>
                      <Tooltip title="请求异常">
                        <Icon
                          type="info-circle"
                          style={{
                            color: '#f04134'
                          }}
                        />
                      </Tooltip>
                    </div>
                  );
                case 1:
                  return (
                    <div>
                      <Tooltip title="验证失败">
                        <Icon
                          type="exclamation-circle"
                          style={{
                            color: '#ffbf00'
                          }}
                        />
                      </Tooltip>
                    </div>
                  );
                default:
                  return (
                    <div>
                      <Icon
                        style={{
                          color: '#aaa'
                        }}
                        type="check-circle"
                      />
                    </div>
                  );
              }
            }
          ]
        }
      },
      {
        property: 'path',
        header: {
          label: '接口路径'
        },
        cell: {
          formatters: [
            (text, { rowData }) => {
              let record = rowData;
              return (
                <Tooltip title="跳转到对应接口">
                  <Link to={`/project/${record.project_id}/interface/api/${record.interface_id}`}>
                    {record.path.length > 23 ? record.path + '...' : record.path}
                  </Link>
                </Tooltip>
              );
            }
          ]
        }
      },
      {
        property: 'runtime',
        header: {
          label: '运行时长'
        },
        props: {
          style: {
            width: '200px'
          }
        },
        cell: {
          formatters: [
            (text, { rowData }) => {
              // console.log({rowData});
              let id = rowData._id;
              let runtime;
              try{
                if(this.reports[id] && 'res_header' in this.reports[id]){
                  runtime =this.reports[id] ? this.reports[id].res_header.runtime : '';
                }
              }catch(err){
                console.log('请求异常')
              }
              return (
                <Tooltip title="接口运行时长">
                  <p>{runtime}</p>
                </Tooltip>
              );
            }
          ]
        }
      },
      {
        header: {
          label: '测试报告'
        },
        props: {
          style: {
            width: '200px'
          }
        },
        cell: {
          formatters: [
            (text, { rowData }) => {
              let reportFun = () => {
                if (!this.reports[rowData.id]) {
                  return null;
                }
                return <Button onClick={() => this.openReport(rowData.id)}>测试报告</Button>;
              };
              return <div className="interface-col-table-action">{reportFun()}</div>;
            }
          ]
        }
      }
    ];
    const { rows } = this.state;
    const components = {
      header: {
        cell: dnd.Header
      },
      body: {
        row: dnd.Row
      }
    };
    const resolvedColumns = resolve.columnChildren({ columns });
    const resolvedRows = resolve.resolve({ columns: resolvedColumns, method: resolve.nested })(
      rows
    );

    const localUrl =
      location.protocol +
      '//' +
      location.hostname +
      (location.port !== '' ? ':' + location.port : '');
    let currColEnvObj = this.handleColEnvObj(this.state.currColEnvObj);
    const  autoTestsUrl = `/api/open/run_auto_test?id=${this.props.currColId}&token=${
      this.props.token
    }${currColEnvObj ? currColEnvObj : ''}&mode=${this.state.mode}&email=${
      this.state.email
    }&download=${this.state.download}&descendants=${this.state.descendants}&subset=${this.state.subset}&failedinterrupt=${this.state.failedinterrupt}&serverlog=${this.state.serverlog}&logurl=${this.state.log_url}&jobname=${this.state.log_jobName}`;

    let col_name = '';
    let col_desc = '';
      let allChilds=[];

    if (this.props.interfaceColList) {
      let me = findMeInTree3(this.props.interfaceColList, this.props.currColId);
      col_name = me?me.name:'';
      col_desc = me?me.desc:'';
      allChilds = me ? me.childs : '';
    }

    return (
      <div className="interface-col">
        <Modal
          title={col_name+" 运行报告记录"} 
          visible={this.state.showReportLogModal}
          onOk={this.ShowReportLog}
          onCancel={this.closeReportLogModal}
          closable = {false}
          width={'500px'}
          style={defaultModalStyle}
          >
          <div className="logset" style={{height: '400px',overflow: 'auto'}}>
            <InfiniteScroll
              initialLoad={false}
              pageStart={0}
              loadMore={()=>{}}
              hasMore={false}
              useWindow={false}
            >
              <List
                bordered
                split={false}
                size="small"
                dataSource={this.state.reportLog}
                renderItem={item => (
                  <List.Item 
                    key={item._id}
                    actions={[
                      <Radio
                        key={item._id}
                        value={item._id}
                        checked={this.state.showReportLogId === item._id}
                        onChange={e=>this.setShowReportLogId(e,item)}
                      />
                    ]}
                  >
                    {item.status!==0?(                  
                      <List.Item.Meta
                        title={<span style={{ color: 'red' }}>{item.executor}</span>}
                      />):(
                        <List.Item.Meta
                          title={item.executor}
                        />
                    )}

                    <div>{item.add_time}</div>
                  </List.Item>
                )}
              />
            </InfiniteScroll>
          </div>
        </Modal>
        <Modal
          title="选择需要查看的日志服务"
          visible={this.state.showLogModal}
          onOk={this.searchLog}
          onCancel={this.closeLogModal}
          width={'1000px'}
          style={defaultModalStyle}
          >
          <div className="logset">
            <Row className="setting-log" style={{marginTop : 20}}>
              <Col className="col-log" style={{width:'200px'}} span={6}>
                选择环境
                <Tooltip title="日志所在的环境配置">
                  <Icon type="question-circle-o" />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col className="log-env" style={{ marginRight: '10px', padding: '5px',width:'500px' }} span={6}>
                <Select
                  value={this.state.log_env}
                  style={{ width: '100%' }}
                  placeholder="关联envid"
                  onChange={this.selectDomain}
                >
                  {log_env}
                </Select>
              </Col>
            </Row>
            <Row className='setting-log' style={{marginTop : 20}}>
              <Col className="col-log"  style={{width:'200px'}} span={6}>
                服务名<Tooltip title={'选择需要查看的服务'}>
                  <Icon type="question-circle-o"/>
                </Tooltip>
                &nbsp;：
              </Col>
              <Col  className="log-env" style={{ marginRight: '10px', padding: '5px',width:'200px' }} span={6} >
                <Select
                  style={{ width: '100%' }}
                  placeholder="请选择需要查看的日志服务"
                  value={this.state.log_jobName}
                  onChange={this.setjobName}
                >
                  {jobNames}
                </Select>
              </Col>
            </Row>
          </div>
        </Modal>
        <Modal
            title="通用规则配置"
            visible={this.state.commonSettingModalVisible}
            onOk={this.handleCommonSetting}
            onCancel={this.cancelCommonSetting}
            width={'1000px'}
            style={defaultModalStyle}
          >
          <div className="common-setting-modal">
            <Row className="setting-item">
              <Col className="col-item" span={4}>
                <label>检查HttpCode:&nbsp;<Tooltip title={'检查 http code 是否为 200'}>
                  <Icon type="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col className="col-item"  span={18}>
                <Switch onChange={e=>{
                  let {commonSetting} = this.state;
                  this.setState({
                    commonSetting :{
                      ...commonSetting,
                      checkHttpCodeIs200: e
                    }
                  })
                }} checked={this.state.commonSetting.checkHttpCodeIs200}  checkedChildren="开" unCheckedChildren="关" />
              </Col>
            </Row>

            <Row className="setting-item">
              <Col className="col-item"  span={4}>
                <label>检查返回json:&nbsp;<Tooltip title={'检查接口返回数据字段值，比如检查 code 是不是等于 0'}>
                  <Icon type="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col  className="col-item" span={6}>
                <Input value={this.state.commonSetting.checkResponseField.name} onChange={this.changeCommonFieldSetting('name')} placeholder="字段名"  />
              </Col>
              <Col  className="col-item" span={6}>
                <Input  onChange={this.changeCommonFieldSetting('value')}  value={this.state.commonSetting.checkResponseField.value}   placeholder="值"  />
              </Col>
              <Col  className="col-item" span={6}>
                <Switch  onChange={this.changeCommonFieldSetting('enable')}  checked={this.state.commonSetting.checkResponseField.enable}  checkedChildren="开" unCheckedChildren="关"  />
              </Col>
            </Row>

            <Row className="setting-item">
              <Col className="col-item" span={4}>
                <label>检查返回数据结构:&nbsp;<Tooltip title={'只有 response 基于 json-schema 方式定义，该检查才会生效'}>
                  <Icon type="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col className="col-item"  span={18}>
                <Switch onChange={e=>{
                  let {commonSetting} = this.state;
                  this.setState({
                    commonSetting :{
                      ...commonSetting,
                      checkResponseSchema: e
                    }
                  })
                }} checked={this.state.commonSetting.checkResponseSchema}  checkedChildren="开" unCheckedChildren="关" />
              </Col>
            </Row>

            <Row className="setting-item">
              <Col className="col-item  " span={4}>
                <label>全局测试脚本:&nbsp;<Tooltip title={'在跑自动化测试时，优先调用全局脚本，只有全局脚本通过测试，才会开始跑case自定义的测试脚本'}>
                  <Icon type="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col className="col-item"  span={14}>
                <div><Switch onChange={e=>{
                  let {commonSetting} = this.state;
                  this.setState({
                    commonSetting :{
                      ...commonSetting,
                      checkScript: {
                        ...this.state.checkScript,
                        enable: e
                      }
                    }
                  })
                }} checked={this.state.commonSetting.checkScript.enable}  checkedChildren="开" unCheckedChildren="关"  /></div>
                <AceEditor
                  onChange={this.onChangeTest}
                  className="case-script"
                  data={this.state.commonSetting.checkScript.content}
                  ref={aceEditor => {
                    this.aceEditor = aceEditor;
                  }}
                />
              </Col>
              <Col span={6}>
                <div className="insert-code">
                  {InsertCodeMap.map(item => {
                    return (
                      <div
                        style={{ cursor: 'pointer' }}
                        className="code-item"
                        key={item.title}
                        onClick={() => {
                          this.handleInsertCode('\n' + item.code);
                        }}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>


          </div>
        </Modal>

        <Modal
            title="循环测试"
            visible={this.state.commonSettingLoop}
            onOk={this.executeTestsloop}
            onCancel={this.cancelLoopSetting}
            width={'1000px'}
            style={defaultModalStyle}
          >
          <div className="common-setting-loop">
            <Row className="setting-loop">
              <Col className="col-loop"  style={{width:'200px'}} span={4}>
                <label>循环测试:&nbsp;<Tooltip title={'设置循环测试的次数'}>
                  <Icon type="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col  className="col-loop" span={5}>
                <Input  onChange={this.changeLoopSetting}  value={this.state.LoopSetting}   placeholder="循环次数"  />
                <Checkbox
                  checked={this.state.loopSuccessInterrupt}
                  onChange={this.onChangeCheckboxLoops}
                >成功中断
                </Checkbox>
                <Checkbox
                  checked={this.state.loopFailInterrupt}
                  onChange={this.onChangeCheckboxLoopf}
                >失败中断
                </Checkbox>
              </Col>
            </Row>
            <Row className='run-once-only-case' style={{marginTop : 20}}>
              <Col className="cases"  style={{width:'200px'}} span={6}>
                <label>仅一次运行的用例:&nbsp;<Tooltip title={'设置只运行一次的用例ID'}>
                  <Icon type="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col  className="cases" span={7} >
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="请选择需要设置的用例"
                  value={this.state.onlycases}
                  onChange={this.setOnlyCase}
                >
                  {caseItem}
                </Select>
              </Col>
            </Row>
          </div>
        </Modal>
                  
        <Modal
            title="请求配置"
            visible={this.state.Datadriven}
            onOk={this.cancelDatadriven}
            onCancel={this.cancelDatadriven}
            footer = {null}
            width={'1000px'}
            style={defaultModalStyle}
            destroyOnClose={true}
          >
          <ColRequest rows={this.state.rows} colpre_script={this.state.colpre_script} colafter_script={this.state.colafter_script}/>
        </Modal>
        <Modal
          title="JsonBody/Assert一键配置"
          visible={this.state.bodyConfig}
          onOk={this.batchChangBody}
          onCancel={this.cancelBodyConfig}
          // footer = {null}
          width={'1000px'}
          style={defaultModalStyle}
          destroyOnClose={true}
          confirmLoading={this.state.changBodyLoading}
        >
          <Collapse bordered={true} style={{ width: '80%', margin: '20px auto' }}>
            {this.state.currCaseList.map(item => (
              <Panel header={`${item.title} ${item._id}`} key={item._id}>
                <div className="project-request">
                  <Form>
                    {item.req_body_type=='json'&&(
                      <FormItem label="JsonBody">
                        <AceEditor
                          data={item.req_body_other}
                          onChange={editor => this.changBody(editor.text,item._id)}
                          fullScreen={true}
                          ref={aceEditor => {
                            this.aceEditor = aceEditor;
                          }}
                          style={{height:'150px'}}
                        />
                      </FormItem>
                    )}
                    <FormItem label="Assert">
                      <AceEditor
                        data={item.test_script}
                        onChange={editor => this.changTestScript(editor.text,item._id)}
                        fullScreen={true}
                        ref={aceEditor => {
                          this.aceEditor = aceEditor;
                        }}
                        style={{height:'150px'}}
                      />
                    </FormItem>
                  </Form>
                </div>
              </Panel>
            ))}
          </Collapse>
        </Modal>
        <Row type="flex" justify="center" align="top">
          <Col span={5}>
            <h2
              className="interface-title"
              style={{
                display: 'inline-block',
                margin: '8px 20px 16px 0px'
              }}
            >
              测试集合&nbsp;{col_name}&nbsp;<a
                target="_blank"
                rel="noopener noreferrer"
                href="/doc/documents/case.html"
              >
                <Tooltip title="点击查看文档">
                  <Icon type="question-circle-o" />
                </Tooltip>
              </a>
            </h2>
            <div>
              {(
                <Checkbox
                  allChilds={allChilds}
                  checked={this.state.descendants}
                  onChange={this.onChangeCheckbox}
                >包含子集合用例</Checkbox>)}
            </div>
            <Tooltip title= "请求配置">
              <Button onClick={this.openDatadriven} style={{margin: '8px 20px 16px 0px'}} >
                js Col请求配置</Button>
            </Tooltip>
            <Tooltip title= "参数配置">
              <Button onClick={this.openBodyConfig} style={{margin: '8px 20px 8px 0px'}} >
                参数断言批量配置</Button>
            </Tooltip>
            <div>
              {(
                <Checkbox
                  allChilds={allChilds}
                  checked={this.state.subsetcol}
                  onChange={this.onChangeSubsetcol}
                >使用子集合驱动</Checkbox>)}
            </div>
            &nbsp;
          </Col>
          <Col span={10}>
            <CaseEnv
              envList={this.props.envList}
              currProjectEnvChange={this.currProjectEnvChange}
              envValue={this.state.currColEnvObj}
              collapseKey={this.state.collapseKey}
              changeClose={this.changeCollapseClose}
            />
          </Col>
          <Col span={9}>
            {(
              <div
                style={{
                  float: 'right',
                  paddingTop: '8px'
                }}
              >
                {this.props.curProjectRole !== 'guest' && (
                  <Tooltip title="在 YApi 服务端跑自动化测试，测试环境不能为私有网络，请确保 YApi 服务器可以访问到自动化测试环境domain">
                    <Button
                      style={{
                        marginRight: '8px',
                        marginLeft: '8px'
                      }}
                      onClick={this.autoTests}
                    >
                      服务端测试
                    </Button>
                  </Tooltip>
                )}
                <Button onClick={this.openCommonSetting} style={{
                        marginRight: '8px'
                      }} >通用规则配置</Button>
                &nbsp;
                <Button onClick={this.executeTestsFail} style={{
                        marginRight: '8px'
                      }} >失败中断测试</Button>
                &nbsp;
                <Tooltip title="运行结果建议打开F12查看运行结果">
                  <Button onClick={this.openLoopSetting} style={{
                        marginRight: '8px'
                      }} loading={this.state.isloading}>循环测试</Button>
                </Tooltip>
                &nbsp;
                <Button 
                  type="primary" 
                  style={{
                    marginTop: '8px',
                    marginLeft: '8px'
                  }}
                  onClick={this.executeTests}> 
                  开始测试
                </Button>
              </div>
            )}
          </Col>
        </Row>

        <div className="component-label-wrapper">
          <Label onChange={val => this.handleChangeInterfaceCol(val, col_name)} desc={col_desc} />
        </div>
        <Spin spinning={this.state.isLoading}>
          {this.state.syncRun&&(
            '正在异步执行可稍后查看结果-------------------------------------------------------'
            )}
          <h3 className="interface-title">
            {this.getSummaryText()}
            &nbsp; 
            <Button 
              icon='container'
              onClick={this.viewLog}> 
              服务器日志
            </Button>  
            &nbsp; 
            <Button 
              icon='container'
              onClick={this.viewreportLog}> 
              报告记录
            </Button>  
          </h3>
          <Table.Provider
            components={components}
            columns={resolvedColumns}
            style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}
          >
            <Table.Header
              className="interface-col-table-header"
              headerRows={resolve.headerRows({ columns })}
            />

            <Table.Body
              className="interface-col-table-body"
              rows={resolvedRows}
              rowKey="id"
              onRow={this.onRow}
            />
          </Table.Provider>
        </Spin>
        <Modal
          title="测试报告"
          width="900px"
          style={{
            minHeight: '500px'
          }}
          visible={this.state.visible}
          onCancel={this.handleCancel}
          footer={null}
        >
          <CaseReport {...this.reports[this.state.curCaseid]} />
        </Modal>

        {this.state.autoVisible && (
          <Modal
            title="服务端自动化测试"
            width="1000px"
            style={{
              minHeight: '500px'
            }}
            visible={this.state.autoVisible}
            onCancel={this.handleAuto}
            className="autoTestsModal"
            footer={null}
          >
            <Row type="flex" justify="space-around" className="row" align="top">
              <Col span={3} className="label" style={{ paddingTop: '16px' }}>
                选择环境
                <Tooltip title="默认使用测试用例选择的环境">
                  <Icon type="question-circle-o" />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={21}>
                <CaseEnv
                  envList={this.props.envList}
                  currProjectEnvChange={this.currProjectEnvChange}
                  envValue={this.state.currColEnvObj}
                  collapseKey={this.state.collapseKey}
                  changeClose={this.changeCollapseClose}
                />
              </Col>
            </Row>
            <Row type="flex" justify="space-around" className="row" align="middle">
              <Col span={3} style={{ width: '70px'}}>
                输出格式：
              </Col>
              <Col span={3} style={{ width: '70px' }}>
                <Select value={this.state.mode} onChange={this.modeChange}>
                  <Option key="html" value="html">
                    html
                  </Option>
                  <Option key="json" value="json">
                    json
                  </Option>
                </Select>
              </Col>

              <Col span={3} style={{ width: '90px'}}>
                邮件通知
                <Tooltip title={'测试不通过时，会给项目组成员发送邮件'}>
                  <Icon
                    type="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={3} style={{ width: '45px'}}>
                <Switch
                  checked={this.state.email}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.emailChange}
                />
              </Col>

              <Col span={3} style={{ width: '90px' }}>
                下载数据
                <Tooltip title={'开启后，测试数据将被下载到本地'}>
                  <Icon
                    type="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={3} style={{ width: '45px'}}>
                <Switch
                  checked={this.state.download}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.downloadChange}
                />
              </Col>
              <Col span={3} style={{ width: '90px'}}>
                含子集合
                <Tooltip title={'开启后，将同时执行子集合所有用例'}>
                  <Icon
                    type="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={3} style={{ width: '45px' }}>
                <Switch
                  checked={this.state.descendants}
                  data-allchilds={allChilds}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.descendants}
                />
              </Col>
              
              <Col span={3} style={{ width: '100px'}}>
                子集合驱动
                <Tooltip title={'开启后，请求配置将调用子集合配置'}>
                  <Icon
                    type="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={3} style={{ width: '45px'}}>
                <Switch
                  checked={this.state.subset}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.subsetChange}
                />
              </Col>

              <Col span={3} style={{ width: '100px'}}>
                失败中断
                <Tooltip title={'开启后，失败将停止运行'}>
                  <Icon
                    type="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={3} style={{ width: '45px'}}>
                <Switch
                  checked={this.state.failedinterrupt}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.Failedinterrupt}
                />
              </Col>
            </Row>
            <Row>
              <Col span={3} style={{ width: '100px'}}>
                服务端日志
                <Tooltip title={'开启后，运行后会打开日志记录'}>
                  <Icon
                    type="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={3} style={{ width: '45px'}}>
                <Switch
                  checked={this.state.serverlog}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.changeServerlog}
                />
              </Col>
              {this.state.serverlog && (
                <div>
                  <Col span={3} style={{ width: '120px',marginLeft:'20px' }}>
                    服务端日志uri
                    <Tooltip title={'服务端日志关联env'}>
                      <Icon
                        type="question-circle-o"
                        style={{
                          width: '10px'
                        }} />
                    </Tooltip>
                    &nbsp;：
                  </Col>
                  <Col span={3} style={{ width: '200px' }}>
                    <Select
                      value={this.state.log_env}
                      style={{ width: '100%' }}
                      placeholder="关联envid"
                      onChange={this.selectDomain}
                    >
                      {log_env}
                    </Select>
                  </Col>
                  <Col span={3} style={{ width: '100px',marginLeft:'20px'  }}>
                    日志服务名
                    <Tooltip title={'服务端日志服务名'}>
                      <Icon
                        type="question-circle-o"
                        style={{
                          width: '10px'
                        }} />
                    </Tooltip>
                    &nbsp;：
                  </Col>
                  <Col span={3} style={{ width: '200px' }}>
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      placeholder="请选择需要查看的日志服务"
                      onChange={this.setjobName}
                    >
                      {jobNames}
                    </Select>
                  </Col>
                </div>
              )}
            </Row>
            <Row type="flex" justify="space-around" className="row" align="middle">
              <Col span={21} className="autoTestUrl">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={localUrl + autoTestsUrl} >
                  {autoTestsUrl}
                </a>
              </Col>
              <Col span={3}>
                <Button className="copy-btn" onClick={() => this.copyUrl(localUrl + autoTestsUrl)}>
                  复制
                </Button>
              </Col>
            </Row>
            <div className="autoTestMsg">
              注：访问该URL，可以测试所有用例，请确保YApi服务器可以访问到环境配置的接口。配置好每个测试集合的通用规则，服务端测试将调用子集合的通用规则。
            </div>
          </Modal>
        )}
      </div>
    );
  }
}

export default InterfaceColContent;
