import React from 'react';
import PropTypes, { number } from 'prop-types';
import {getcolcasestats,getProject,getcasestats,getfailcol,getfailcase} from '../../../../reducer/modules/project.js';
import {connect} from 'react-redux';
// import axios from 'axios';
import {Tooltip,Progress,Layout,List,Button} from 'antd';
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
      failcase:state.project.failcase
    };
  },
  {
    getcolcasestats,
    getProject,
    getcasestats,
    getfailcol,
    getfailcase
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
      failcaselist:[]
    };
  }
  async componentWillMount() {
    let result = await this.props.getcolcasestats(this.props.curProject._id);
    let stats = result.payload.data.data;
    let result1 = await this.props.getcasestats(this.props.curProject._id);
    let stats1 = result1.payload.data.data;
    let result2 = await this.props.getfailcol(this.props.curProject._id);
    let failcollist = result2.payload.data.data;
    for(let item of failcollist){
      item.up_time = moment(item.up_time*1000).format("YYYY-MM-DD HH:mm:ss");
      item.href = "/project/"+this.props.curProject._id+"/interface/col/"+item._id;
    }
    let result3= await this.props.getfailcase(this.props.curProject._id);
    let failcaselist = result3.payload.data.data;
    for(let item of failcaselist){
      item.up_time = moment(item.up_time*1000).format("YYYY-MM-DD HH:mm:ss");
      item.href = "/project/"+this.props.curProject._id+"/interface/case/"+item.interface_caseid;
    }
    this.setState(
      {
        sumcol:stats.col,
        successcol:stats.colsuccess,
        failcol:stats.colfail,
        casecount:stats1.casecount,
        casesuccess:stats1.casesuccess,
        casefail:stats1.casefail,
        failcollist : failcollist,
        failcaselist:failcaselist
      }
    )
  }
  returnCase = (t)=>{
    localStorage.setItem('libCase',t);
  }
  returnCol = (t)=>{
    localStorage.setItem('libCol',t);
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
            <p className='title'>测试集合通过率：</p>
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
            <p className='title'>测试用例库通过率：</p>
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
                          title={<Button type='link' href={item.href} onClick={()=>this.returnCase(item.interface_caseid)}>{item.title}</Button>}
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
