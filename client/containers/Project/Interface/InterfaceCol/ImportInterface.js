import React, {PureComponent as Component} from 'react';
import PropTypes from 'prop-types';
import { Input, Spin, message, Select, Table} from 'antd';
import axios from 'axios';
import variable from '../../../../constants/variable';
import {connect} from 'react-redux';
import {fetchInterfaceListMenu} from '../../../../reducer/modules/interface.js';
import produce from 'immer';

const Option = Select.Option;

@connect(
  state => {
    return {
      list: state.inter.list,
      currGroup: state.group.currGroup,
      curProject: state.project.currProject
    };
  },
  {
    fetchInterfaceListMenu
  }
)
export default class ImportInterface extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    selectedRowKeys: [],
    categoryCount: {},
    project: this.props.currProjectId,
    groupList: [],
    projectList: [],
    selectedGroup: '',
    apidata:[],
    loding:true,
    expandedKeys:[],
    list: []
  };

  static propTypes = {
    list: PropTypes.array,
    selectInterface: PropTypes.func,
    projectList: PropTypes.array,
    currProjectId: PropTypes.string,
    currGroup: PropTypes.object,
    curProject: PropTypes.object,
    fetchInterfaceListMenu: PropTypes.func
  };

  async componentDidMount() {
    const [groupRes, projectRes] = await Promise.all([
      axios.get('/api/group/list'),
      axios.get('/api/project/list', {
        params: {
          group_id: this.props.currGroup._id
        }
      }),
      this.props.fetchInterfaceListMenu(this.props.currProjectId)
    ]);
    try{
      let groupList = groupRes.data.data;
      let projectList = projectRes.data.data.list;
      this.setState({
        groupList,
        projectList
      });
      this.clearFilters();
    }catch(e){
      console.error(e)
    }
  }

  // 切换项目
  onChange = async val => {
    this.setState({
      project: val,
      selectedRowKeys: [],
      categoryCount: {}
    });
    await this.props.fetchInterfaceListMenu(val);
  };

  handleGroupChange = async val => {
    let projectList = [];
    try {
      const projectRes = await axios.get('/api/project/list', {
        params: {
          group_id: val
        }
      });
      projectList = projectRes.data.data.list;
    } catch (e) {
      console.error(e)
    }
    if (projectList.length === 0) {
      message.warning('所选分组下还没有创建项目，请选择含有项目的分组');
      return;
    }
    const defaultSelectedProject = projectList[0] ? String(projectList[0]._id) : '';
    await this.props.fetchInterfaceListMenu(defaultSelectedProject);
    this.setState({
      selectedGroup: val,
      project: defaultSelectedProject,
      projectList,
      selectedRowKeys: [],
      categoryCount: {}
    });
  };

  datainit = list => {
    let reinitdata = list => {
      return list.map(item => {
          let node = {
            key: 'category_' + item._id,
            title: item.name,
            isCategory: true
          };
          let catChild = [];
          if (item.children) {
            catChild = reinitdata(item.children);
          }
          let intfChild = [];
          if (item.list) {
            intfChild = item.list.map(e => {
              e.key = e._id;
              e.categoryKey = 'category_' + item._id;
              e.categoryLength = item.list.length;
              return e;
            });
          }
          if (catChild.length > 0 || intfChild.length > 0) {
            node.children = [...catChild, ...intfChild]
          }
          return node;
        }
      )
    };
    let redata = reinitdata(list);
    //console.log(initialValue);

    return redata;
  };
  //重载数据
  clearFilters =()=> {
    const {list} = this.props;
    const data = this.datainit(list);
    console.log('list',list);
    console.log('data',data);
    console.log('props',this.props);
    this.setState({
      apidata:data,
      loding:false,
      list:this.props.list
    });
    // return data
  }
  //搜索
  filterCol = e => {
    let list= JSON.parse(JSON.stringify(this.props.list));
    let res = this.filterList(list,e.target.value);
    //menuList = res.menuList;
    console.log({res});
    this.setState(
      {
        expandedKeys:res.arr,
        list: res.menuList
      }
    )
  };
  // 数据过滤
  filterList = (list,filter) => {
    if(filter==='已发布'){
      filter='done'
    } else if(filter==='设计中'){
      filter='design'
    } else if(filter==='开发中'){
      filter='undone'
    } else if(filter==='已提测'){
      filter='testing'
    } else if(filter==='暂停开发'){
      filter='stoping'
    } else if(filter==='已过时'){
      filter='deprecated'
    }
    let arr = [];
    let iterater = item => {
      if (item.name.indexOf(filter) === -1) {
        item.children = item.children ? item.children.filter(me => iterater(me)) : [];
        item.list = item.list.filter(inter => {
          if (
            inter.title.indexOf(filter) === -1 &&
            inter.path.indexOf(filter) === -1 &&
            inter.status.indexOf(filter) === -1 &&
            inter.tag.indexOf(filter) === -1
          ) {
            return false;
          }
          return true;
        });

        if (item.list.length > 0 || item.children.length > 0) {
          arr.push('col_' + item._id);
          item.in = true;
        } else {
          item.in = false;
        }

        return item.in ;
      } else {
        arr.push('col_' + item._id);
        item.in = true;
        return true;
      }

    };
    let menuList = produce(list, draftList => {
      draftList.filter(item => {
          iterater(item);
        }
      );
    });
    for (let index = 0; index < menuList.length; index++) {
      let result = menuList[index];
      if(result.in===false){
        menuList.splice(index, 1);
        index--;
      }
    }
    return {menuList, arr};
  };
  render() {
    const list = this.state.list;
    const { groupList, projectList } = this.state;
    const data = this.datainit(list);
    // let tag = this.props.curProject.tag;
    // let filter = tag.map(item => {
    //   return { text: item.name, value: item.name };
    // });
    const self = this;

    const rowSelection = {

      onSelect: (record, selected) => {
        // console.log(record, selected, selectedRows);
        const oldSelecteds = self.state.selectedRowKeys;
        const categoryCount = self.state.categoryCount;
        const categoryKey = record.categoryKey;
        const categoryLength = record.categoryLength;
        let selectedRowKeys = [];

        const getCategoryChildrenIds = (children = []) => {
          let ids = children.map(v => v.key);
          children.forEach(v => {
            if (v.children && v.children.length) {
              const childrenIds = getCategoryChildrenIds(v.children);
              ids = [...ids, ...childrenIds]
            }
          })
          return ids;
        };
        if (record.isCategory) {
          // selectedRowKeys = record.children ? record.children.map(item => item._id).concat(record.key) : [];
          selectedRowKeys = getCategoryChildrenIds([record]);
          if (selected) {
            selectedRowKeys = selectedRowKeys
              .filter(id => oldSelecteds.indexOf(id) === -1)
              .concat(oldSelecteds);
            categoryCount[categoryKey] = categoryLength;
          } else {
            selectedRowKeys = oldSelecteds.filter(id => selectedRowKeys.indexOf(id) === -1);
            categoryCount[categoryKey] = 0;
          }
        } else {
          if (selected) {
            selectedRowKeys = oldSelecteds.concat(record._id);
            if (categoryCount[categoryKey]) {
              categoryCount[categoryKey] += 1;
            } else {
              categoryCount[categoryKey] = 1;
            }
            if (categoryCount[categoryKey] === record.categoryLength) {
              selectedRowKeys.push(categoryKey);
            }
          } else {
            selectedRowKeys = oldSelecteds.filter(id => id !== record._id);
            if (categoryCount[categoryKey]) {
              categoryCount[categoryKey] -= 1;
            }
            selectedRowKeys = selectedRowKeys.filter(id => id !== categoryKey);
          }
        }
        self.setState({ selectedRowKeys, categoryCount });
        self.props.selectInterface(
          selectedRowKeys.filter(id => ('' + id).indexOf('category') === -1),
          self.state.project
        );
      },
      onSelectAll: (selected, selectedRows) => {
        let selectedRowKeys = selectedRows.map(v => v.key);
        let categoryCount = self.state.categoryCount;
        if (selected) {
          selectedRows.forEach(item => {
            if (item.children) {
              categoryCount['category_' + item._id] = item.children.length;
            }
          });
        } else {
          categoryCount = {};
          selectedRowKeys = [];
        }
        self.setState({ selectedRowKeys, categoryCount });
        self.props.selectInterface(
          selectedRowKeys.filter(id => ('' + id).indexOf('category') === -1),
          self.state.project
        );
      },
      selectedRowKeys: self.state.selectedRowKeys
    };

    const columns = [
      {
        title: '接口名称',
        dataIndex: 'title',
        width: '30%'
      },
      {
        title: '接口路径',
        dataIndex: 'path',
        width: '40%'
      },
      {
        title: '请求方法',
        dataIndex: 'method',
        render: item => {
          let methodColor = variable.METHOD_COLOR[item ? item.toLowerCase() : 'get'];
          return (
            <span
              style={{
                color: methodColor.color,
                backgroundColor: methodColor.bac,
                borderRadius: 4
              }}
              className="colValue"
            >
              {item}
            </span>
          );
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        render: text => {
          return (
            text &&
            (text === 'done' ? (<span className="tag-status done">已发布</span>
                ) : (text === 'undone' ? (<span className="tag-status undone">开发中</span>
                    ) : (text === 'testing' ? (<span className="tag-status testing">已提测</span>
                        ) : (text === 'design' ? (<span className="tag-status design">设计中</span>
                            ) : (text === 'stoping' ? (<span className="tag-status stoping">暂停开发</span>
                                ) : (<span className="tag-status deprecated">已过时</span>
                                )
                            )
                        )
                    )
                )
            )
          );
        }
        // filters: [
        //   {
        //     text: '已发布',
        //     value: 'done'
        //   },
        //   {
        //     text: '设计中',
        //     value: 'design'
        //   },
        //   {
        //     text: '开发中',
        //     value: 'undone'
        //   }, {
        //     text: '已提测',
        //     value: 'testing'
        //   }, {
        //     text: '暂停开发',
        //     value: 'stoping'
        //   },
        //   {
        //     text: '已过时',
        //     value: 'deprecated'
        //   }
        // ],
        // onFilter: (value, record) => {
        //   if (!record.children) return false;
        //   let arr = record.children.filter(item => {
        //     return item.status && item.status.indexOf(value) === 0;   
        // })
        //   return arr.length>0;
        //   }
      },
      {
        title: 'tag',
        dataIndex: 'tag',
        key: 'tag'
        // filters: filter
        // onFilter: (value, record) => {
        //   if (!record.children) return false;
        //   let arr = record.children.filter(item => {
        //     return item.tag && item.tag.indexOf(value) === 0;
        //   });
        //   return arr.length>0
        // }
      }
    ];

    return (
      <div>
        <div className="select-project">
          <span>选择分组： </span>
          <Select value={this.state.selectedGroup || String(this.props.currGroup._id)} onChange={this.handleGroupChange} style={{ width: 200 }}>
            {groupList.map(item => {
              return (
                <Option value={`${item._id}`} key={item._id}>
                  {item.group_name}
                </Option>
              );
            })}
          </Select>
        </div>
        <div className="select-project">
          <span>选择要导入的项目： </span>
          <Select value={this.state.project} style={{ width: 200 }} onChange={this.onChange}>
            {projectList.map(item => {
              return item.projectname ? (
                ''
              ) : (
                <Option value={`${item._id}`} key={item._id}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </div >
        <Input placeholder="搜索集合/用例/接口路径/状态/tag" onChange={this.filterCol}/>
        <Spin spinning={this.state.loding}>
          <Table columns={columns} rowSelection={rowSelection} dataSource={data} pagination={false}>
          </Table>
        </Spin>
      </div>
    );
  }
}
