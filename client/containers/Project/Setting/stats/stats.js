import React from 'react';
import PropTypes, { number } from 'prop-types';
import {getcolcasestats,getProject,getcasestats,getfailcol,getfailcase,getcaseliversions,getdemands} from '../../../../reducer/modules/project.js';
import {connect} from 'react-redux';
// import axios from 'axios';
import {Tooltip,Progress,Layout,List,Button,Select} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { withRouter } from 'react-router';
import './stats.scss';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
const { Content } = Layout;



@connect(
  state => {
    return {
      colstats: state.project.colstats,
      curProject: state.project.currProject,
      casestats: state.project.casestats,
      failcol: state.project.failcol,
      failcase:state.project.failcase,
      demandlist:state.project.demandlist,
      caselibverisons:state.project.caselibverisons
    };
  },
  {
    getcolcasestats,
    getProject,
    getcasestats,
    getfailcol,
    getfailcase,
    getcaseliversions,
    getdemands
  }
)
@withRouter
export class stats extends React.Component {
  static propTypes = {
    getcolcasestats: PropTypes.func,
    curProject: PropTypes.object,
    getcasestats: PropTypes.func,
    getfailcol: PropTypes.func,
    getfailcase:PropTypes.func
  }
  constructor(props) {
    super(props);
    this.state = {
      sumcol:number,
      successcol:number,
      failcol:number,
      casecount:number,
      casesuccess:number,
      casefail:number,
      failcollist:[],
      failcaselist:[],
      demandlist:[],
      caselibverisons:[],
      caselibVersion:'',
      demandid:'',
      interfaceVersions:[],
      interfaceVersion:''
    };
  }
  async componentWillMount() {
    const { curProject, getcolcasestats, getcasestats, getfailcol, getcaseliversions, getdemands, getfailcase } = this.props;
    const projectId = curProject._id;
  
    // 并行获取数据
    const [
      colStatsResult,
      caseStatsResult,
      failColResult,
      caseLibVersionsResult,
      demandListResult,
      failCaseResult
    ] = await Promise.all([
      getcolcasestats(projectId),
      getcasestats(projectId),
      getfailcol(projectId),
      getcaseliversions(projectId),
      getdemands(projectId),
      getfailcase(projectId)
    ]);
  
    // 提取数据
    const colStats = colStatsResult.payload.data.data;
    const caseStats = caseStatsResult.payload.data.data;
    const failColList = failColResult.payload.data.data;
    const caseLibVersions = caseLibVersionsResult.payload.data.data;
    const demandList = demandListResult.payload.data.data;
    const failCaseList = failCaseResult.payload.data.data;
  
    // 格式化数据
    const formatItem = (item, type) => {
      item.up_time = moment(item.up_time * 1000).format("YYYY-MM-DD HH:mm:ss");
      item.href = `/project/${projectId}/interface/${type}/${type === "col" ? item._id : item.interface_caseid}`;
      return item;
    };
  
    const formattedFailColList = failColList.map(item => formatItem(item, "col"));
    const formattedFailCaseList = failCaseList.map(item => formatItem(item, "caselib"));
  
    // 更新状态
    this.setState({
      sumcol: colStats.col,
      successcol: colStats.colsuccess,
      failcol: colStats.colfail,
      casecount: caseStats.casecount,
      casesuccess: caseStats.casesuccess,
      casefail: caseStats.casefail,
      failcollist: formattedFailColList,
      failcaselist: formattedFailCaseList,
      demandlist: demandList,
      caselibverisons: caseLibVersions
    });
  }
  
  returnCase = (t)=>{
    localStorage.setItem('libCase',t);
  }
  returnCol = (t)=>{
    localStorage.setItem('libCol',t);
  }
  selectInterfaceVersion = (value)=>{
    this.setState({interfaceVersion:value})
  }
  selectCaselibVersion = (value)=>{
    this.setState({caselibVersion:value})
  }
  selectDemand = (value)=>{
    this.setState({demandid:value})
  }
  searchCaseState=async ()=>{
    let caseStatsResult = await this.props.getcasestats(this.props.curProject._id,this.state.demandid,this.state.caselibVersion);
    let caseStats = caseStatsResult.payload.data.data;
    let failCaseResult= await this.props.getfailcase(this.props.curProject._id,this.state.demandid,this.state.caselibVersion);
    let failcaselist = failCaseResult.payload.data.data;
    for(let item of failcaselist){
      item.up_time = moment(item.up_time*1000).format("YYYY-MM-DD HH:mm:ss");
      item.href = "/project/"+this.props.curProject._id+"/interface/case/"+item.interface_caseid;
    }
    this.setState(
      {
        casecount:caseStats.casecount,
        casesuccess:caseStats.casesuccess,
        casefail:caseStats.casefail,
        failcaselist:failcaselist
      }
    )
  }
  searchColState = async()=>{
  }
render() {
  const {successcol,sumcol,casecount,casesuccess} = this.state;
  var percent = Math.round(successcol / sumcol * 10000) / 100;
  var percent2 = Math.round(casesuccess / casecount * 10000) / 100;
  const coldata = this.state.failcollist;
  const casedata = this.state.failcaselist;
  
  return (
    <div>
      <Layout>
        <Content
          style={{
          height: '100%',
          margin: '0 24px 0 16px',
          overflow: 'initial',
          backgroundColor: '#fff'
          }}
          >
          <div className="colstats">
            <div className='coldesc'>
              <p className='title'>测试集合通过率：</p>
            </div>
            <div className='Passingrate'>
              <Tooltip title="测试集合通过率">
                <Progress width={400} percent={percent}  type="circle"/>
              </Tooltip>
            </div>
            <div className='failcol'>
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={()=>{}}
                hasMore={false}
                useWindow={false}
              >
                <List
                  dataSource={coldata}
                  header={<div style={{fontSize: '20px',fontWeight: '500'}}>失败集合</div>}
                  renderItem={item => (
                    <List.Item key={item._id}>
                      <List.Item.Meta
                        title={
                          <Button type='link' href={item.href} onClick={()=>this.returnCol(item._id)}>
                            {item.name.length > 10
                              ? item.name.substr(0, 10) + '...'
                              : item.name
                            }
                          </Button>}
                      />
                      <div>更新时间：{item.up_time}</div>
                    </List.Item>
                  )}
                >
                </List>
              </InfiniteScroll>
            </div>
          </div>
          <div className="casestats">
            <div className='casesdesc'>
              <p className='title'>测试用例库通过率：</p>
              <div className='casefilter'>
                <Select
                  showSearch
                  allowClear={true}
                  placeholder="需求"
                  optionFilterProp="children"
                  onChange={this.selectDemand}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={this.state.demandlist.map((item) => ({
                    value: item._id,
                    label: item.demand
                  }))}
                />
                <Select
                  showSearch
                  allowClear={true}
                  placeholder="版本"
                  optionFilterProp="children"
                  onChange={this.selectCaselibVersion}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={this.state.caselibverisons.map((item) => ({
                    value: item,
                    label: item
                  }))}
                />
                <Tooltip title="search">
                  <Button shape="circle" icon={<SearchOutlined />} onClick={this.searchCaseState}/>
                </Tooltip>
              </div>
            </div>
            
            <div className='Passingrate'>
              <Tooltip title="测试用例库通过率">
                <Progress width={400} percent={percent2}  type="circle"/>
              </Tooltip>
            </div>
            <div className='failcase'>
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={()=>{}}
                hasMore={false}
                useWindow={false}
              >
                <List
                  dataSource={casedata}
                  header={<div style={{fontSize: '20px',fontWeight: '500'}}>失败用例</div>}
                  renderItem={item => (
                    <List.Item key={item._id}>
                      {item.interface_caseid!==null?(
                        <List.Item.Meta
                          title={
                            <Button type='link' href={item.href} onClick={()=>this.returnCase(item.interface_caseid)}>
                              {item.title.length > 10
                              ? item.title.substr(0, 10) + '...'
                              : item.title
                            }
                            </Button>}
                        />
                      ):(
                        <List.Item.Meta
                          title={<p>{item.title}</p>}
                        />
                      )}
                      
                      <div>更新时间：{item.up_time}</div>
                    </List.Item>
                  )}
                >
                </List>
              </InfiniteScroll>
            </div>
          </div>
        </Content>
      </Layout>
    </div>
  );
}
}

export default stats;
