import React, { PureComponent as Component } from 'react';
import PropTypes, { number } from 'prop-types';
import {caseliblist} from '../../../../reducer/modules/caselib.js';
import {connect} from 'react-redux';
import * as XLSX from 'xlsx';
import axios from 'axios';
import ExcelJs from "exceljs";
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { message, Modal, Table, Button, Upload, Select, Layout, Tooltip, Input } from 'antd';
import './Caselib.scss';
import Addcase from '../../Interface/InterfaceList/Addcase.js';
const { Dragger } = Upload;
const Option = Select.Option;
const { Content } = Layout;
const { Search } = Input;


// import {Empty} from 'antd';
// UploadFile.propTypes = {
//   close: PropTypes.fun,
//   id: PropTypes.string,
// };
const limit = 20;
const apistatusArr = [
  {
    text: '未执行',
    value: 'undone'
  },
  {
    text: '通过',
    value: 'pass'
  },
  {
    text: '失败',
    value: 'fail'
  },
  {
    text:'遗留',
    value:'legacy'
  }
];
const apistatus = {
  "status": apistatusArr.map(item => {
    return item.value
  })
};
@connect(
  state => {
    return {
      caselist: state.caselib.caseliblist,
      totalCount: state.caselib.totalCount,
      aggregate: state.caselib.aggregate
    };
  },
  {
    caseliblist
  }
)

class Caselib extends Component {
  static propTypes = {
    demandid:PropTypes.number,
    projectid:PropTypes.number,
    caseliblist: PropTypes.func,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    totalCount: PropTypes.number,
    aggregate: PropTypes.array,
    caselist:PropTypes.array
  }
  constructor(props) {
    super(props);
    this.state = {
      tableData: [],
      tableHeader: [],
      close:false,
      add:false,
      edit:false,
      caseid:number,
      editdata:{},
      current:1,
      filters: apistatus,
      isLoading:false,
      Loading:false,
      total:null,
      serchtitle:'',
      delid:[],
      delloading:false,
      selectedRowKeys:[]
    };
    this.cancelSourceSet = new Set();
  }
  changePage = current => {
    this.setState(
      {
        current: current
      }
    );
  };
  /**
   * 取消上一次的请求
   */
  cancelRequestBefore = () => {
    this.cancelSourceSet.forEach(v => {
      v.cancel();
    });
    this.cancelSourceSet.clear();
  };

  componentWillMount() {
    this.handleRequest(this.props);
  }
  handleRequest = async props => {
    console.log('props',props);
    this.cancelRequestBefore();
    const cancelSource = axios.CancelToken.source();
    this.cancelSourceSet.add(cancelSource);
    let res;
    let option;
    this.setState({
      isLoading: true
    });
    if(this.state.serchtitle){
      option = {
        page: this.state.current,
        limit,
        demandid:this.props.demandid,
        title:this.state.serchtitle,
        status: this.state.filters.status.join(',')
      };
    }else{
      option = {
        page: this.state.current,
        limit,
        demandid:this.props.demandid,
        status: this.state.filters.status.join(',')
      };
    }
    res = await this.props.caseliblist(option);
    if (axios.isCancel(res.payload)) return;
    this.setState({
      isLoading: false
    })
  };
  //表单改变
  handleChange = (pagination, filters, sorter) => {
    this.setState(
      {
        sortedInfo: sorter,
        filters: (filters.status||[]).length > 0 ? filters : apistatus,
        pagination: pagination
      },
      () => this.handleRequest(this.props));
  };

  Openexl = () =>{
    this.setState(
      {
        close:true
      }
    )
  }
  Opencase = () =>{
    console.log(this.props);
    this.setState(
      {
        add:true
      }
    )
  }
  Openeditcase = (id,record) =>{
    this.setState(
      {
        edit:true,
        caseid:id,
        editdata:record
      }
    )
  }
  // 重新获取列表
  reFetchList = () => {
    this.handleRequest(this.props);
    this.setState({
      add:false,
      edit:false,
      close:false
    });
  };
//导出用例接口
Exportcase= async () => {
  let data={};
  data.demandid = this.props.demandid;
  let result = await axios.post('/api/caselib/export', data).then(res => {
    if (res.data.errcode !== 0) {
      return message.error(`${res.data.errmsg}, 导出用例出错`);
    }
    return res.data.data.list;
  });
  return result;
}
//克隆用例
Copycase= async data => {
  delete data._id;
  delete data.interface_caseid;
  delete data.add_time;
  delete data.index;
  delete data.uid;
  delete data.up_time;
  delete data.__v;

  await axios.post('/api/caselib/add', data).then(res => {
    if (res.data.errcode !== 0) {
      return message.error(`${res.data.errmsg}, 克隆用例出错`);
    }
    message.success('用例克隆成功');
    this.reFetchList();
  });
}
//添加用例
  Createcase= async data => {
    data.demandid = this.props.demandid;

    if(data.interface_caseid){
      if(isNaN(data.interface_caseid-0))
      {
        message.error("请输入正确数字key");
      }else if(data.interface_caseid-0>0){
        data.interface_caseid = data.interface_caseid-0
      }
    }

    await axios.post('/api/caselib/add', data).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 添加用例出错`);
      }
      message.success('用例添加成功');
      this.reFetchList();
    });
  }
//编辑用例
  Editcase = async data => {
    data.caseid = this.state.caseid;
    
    if(data.interface_caseid){
      if(isNaN(data.interface_caseid-0))
      {
        message.error("请输入正确数字key");
      }else if(data.interface_caseid-0>0){
        data.interface_caseid = data.interface_caseid-0
      }
    }else{
      data.interface_caseid = null;
    }
    await axios.post('/api/caselib/edit', data).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 用例编辑出错`);
      }
      message.success('用例编辑成功');
      this.reFetchList();
    });
  }
//删除用例
  Deletecase = async id =>{
    const params = {
      id: id
    };
    await axios.post('/api/caselib/del',params).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}, 删除用例出错`);
      }
      message.success('用例删除成功');
      this.reFetchList();
    });
  }
  //更新状态
  changeInterfaceStatus = async value => {
    const params = {
      id: value.split('-')[0]-0,
      status: value.split('-')[1]
    };
    let result = await axios.post('/api/caselib/upstatus', params);
    if (result.data.errcode === 0) {
      message.success('更新成功');
      this.reFetchList();
    } else {
      message.error(result.data.errmsg);
    }
  };
  //搜索
  filterCol = async value =>{
    let title = value;
    await this.setState(
      {
        serchtitle:title,
        isLoading:true
      }
    )
    await this.handleRequest(this.props);
  };
  toReturn = () => {
    this.setState(
      {
        close:false
      }
    )
  };
  closemodal = ()=>{
    this.setState(
      {
        close:false
      }
    )
  }
  returnCase = (t)=>{
    localStorage.setItem('libCase',t);
  }
  //导入
  toSubmit = async() => {
    await this.setState({
      isloading:true,
      loading :true
    })
    const _this = this;
    if(_this.state.tableData.length<=0){
      message.error('请上传文件')
    }else{
      let demandid = this.props.demandid;
      let option ={
        demandid:demandid,
        data:_this.state.tableData
      }
      let axioscontent={
        method: 'post',
        url: '/api/caselib/import',
        data: option
      }
      await axios(axioscontent).then(res => {
        if (res.data.errcode !== 0) {
          return message.error(`${res.data.errmsg}, 导入用例出错`);
        }
        let success = res.data.data.success;
        let fail = res.data.data.fail;
        let result = '成功导入了'+success+'条,失败了'+fail+'条!';
        message.success(result);
        this.setState({
          loading :false
        })
        this.reFetchList();
      });
    }
  };
  uploadFilesChange(file) {
    this.setState({
      loading:true
    });
    // 通过FileReader对象读取文件
    const fileReader = new FileReader();
    // 以二进制方式打开文件
    fileReader.readAsBinaryString(file.file);
    fileReader.onload = event => {
    try {
      const {result} = event.target;
      // 以二进制流方式读取得到整份excel表格对象
      const workbook = XLSX.read(result, {type: 'binary'});
      // 存储获取到的数据
      let data = {};
      // 遍历每张工作表进行读取（这里默认只读取第一张表）
      for(const sheet in workbook.Sheets) {
        let tempData = [];
        // esline-disable-next-line
        if(workbook.Sheets.hasOwnProperty(sheet)) {
          // 利用 sheet_to_json 方法将 excel 转成 json 数据
          console.log(sheet);
          data[sheet] = tempData.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
        }
        }
      const excelData = data.Sheet1;
      const excelHeader = [];
      // 获取表头
      for(const headerAttr in excelData[0]) {
        const header = {
          title: headerAttr,
          dataIndex: headerAttr,
          key: headerAttr
        };
        excelHeader.push(header);
      }
      excelData.forEach((item,index)=>{
        item.key = index;
      })
      // 最终获取到并且格式化后的 json 数据
      this.setState({
        tableData: excelData,
        tableHeader: excelHeader,
        loading:false
      });
      console.log(this.state);
    } catch(e) {
      // 这里可以抛出文件类型错误不正确的相关提示
      console.log(e);
      message.error('文件类型不正确！文件数据有误');
    }
  };
  }
 //
  onSelectChange = (selectedRowKeys,selectedRows) => {
    console.log('selectedRowKeys: ', selectedRowKeys);
    console.log('selectedRows: ', selectedRows);
    var id =[];
    selectedRows.map((item) => {
      id.push(item._id);
    });
    this.setState({delid:id,selectedRowKeys:selectedRowKeys});
  };
  //批量删除
  Batchdelete = async()=>{
    const data = {
      id: this.state.delid
    };
    await axios.post('/api/caselib/batchdel',data).then(res => {
      if (res.data.data.filemessage.length > 0) {
        message.error(res.data.data.filemessage.toString(),3);
      }else{
        message.success('删除成功');
      }
      this.setState({delid:[],selectedRowKeys:[]});
      this.reFetchList();
    });
  }
  //导出
  exportToExcel = async() => {
    let data = await this.Exportcase();
    if(data.length>0){
      let sheetName = "Sheet1";
      let headerName = "RequestsList";
  
      // 获取sheet对象，设置当前sheet的样式
      // showGridLines: false 表示不显示表格边框
      let workbook = new ExcelJs.Workbook();
      let sheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }]
      });
      sheet.pageSetup.verticalCentered=true;
      // let sheet2 = workbook.addWorksheet("Second sheet", { views: [{ showGridLines: false }] });
  
      // 获取每一列的header
      let columnArr = [];
      for (let i in data[0]) {
        let tempObj = { name: "" };
        tempObj.name = i;
        columnArr.push(tempObj);
      }
  
  
      // 设置表格的主要数据部分
      sheet.addTable({
        name: headerName,
        ref: "A1", // 主要数据从A1单元格开始
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium2",
          showRowStripes: false,
          width: 200
        },
        columns: columnArr ? columnArr : [{ name: "" }],
        rows: data.map((e) => {
          let arr = [];
          for (let i in e) {
            arr.push(e[i]);
          }
          return arr;
        })
      });
  
      // sheet.getCell("A1").font = { size: 20, bold: true }; // 设置单元格的文字样式
  
      // 设置每一列的宽度
      sheet.columns = sheet.columns.map((e) => {
        const expr = e.values[1];
        switch (expr) {
          case "model":
            return { width: 10 };
          case "submodel":
            return { width: 10 };
          case "title":
            return { width: 20 };
          case "preconditions":
            return { width: 20 };
          case "step":
            return { width: 30 };
          case "expect":
            return { width: 30 };
          case "remarks":
            return { width: 20 };
          case "priority":
            return { width: 10 };
          case "status":
            return { width: 10 };
          default:
            return { width: 10 };
        }
      });
  
      const table = sheet.getTable(headerName);
      //设置列属性，过滤按钮等
      const column = table.getColumn(9);
      // set some properties
      column.filterButton = true;
      for (let i = 0; i < table.table.columns.length; i++) {
        // 表格主体数据是从A5开始绘制的，一共有三列。这里是获取A5到，B5，C5单元格，定义表格的头部样式
        sheet.getCell(`${String.fromCharCode(65 + i)}1`).font = { size: 12 };
        sheet.getCell(`${String.fromCharCode(65 + i)}1`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "c5d9f1" }
        };
  
        // 获取表格数据部分，定义其样式
        for (let j = 0; j < table.table.rows.length; j++) {
          let rowCell = sheet.getCell(`${String.fromCharCode(65 + i)}${j + 2}`);
          rowCell.alignment = { wrapText: true ,vertical: 'middle', horizontal: 'left'};
          rowCell.border = {
            bottom: {
              style: "thin",
              color: { argb: "a6a6a6" }
            }
          };
        }
      }
      table.commit();
  
      const writeFile = (fileName, content) => {
        const link = document.createElement("a");
        const blob = new Blob([content], {
          type: "application/vnd.ms-excel;charset=utf-8;"
        });
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
      };
  
      // 表格的数据绘制完成，定义下载方法，将数据导出到Excel文件
      workbook.xlsx.writeBuffer().then((buffer) => {
        writeFile('测试用例', buffer);
      });
      message.success('导出成功');
    }else{
      message.success('用例数据空,导出模板')
      let sheetName = "Sheet1";
      let headerName = "RequestsList";
   
      // 获取sheet对象，设置当前sheet的样式
      // showGridLines: false 表示不显示表格边框
      let workbook = new ExcelJs.Workbook();
      let sheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }]
      });
   
      // 设置表格的头部信息，可以用来设置标题，说明或者注意事项
      sheet.addTable({
        name: headerName,
        ref: "A1", // 头部信息从A1单元格开始显示
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "",
          showRowStripes: false,
          showFirstColumn: true,
          width: 200
        },
        columns: [{ name: "model" }, { name: "submodel" },{ name: "title" },{ name: "preconditions" },{ name: "step" },{ name: "expect" },{ name: "remarks" },{ name: "priority" },{ name: "status" },{ name: "version" }],
        rows:[]
      });
      // 设置每一列的宽度
      sheet.columns = sheet.columns.map((e) => {
        const expr = e.values[1];
        switch (expr) {
          case "model":
            return { width: 10 };
          case "submodel":
            return { width: 10 };
          case "title":
            return { width: 20 };
          case "preconditions":
            return { width: 20 };
          case "step":
            return { width: 30 };
          case "expect":
            return { width: 30 };
          case "remarks":
            return { width: 20 };
          case "priority":
            return { width: 10 };
          case "status":
            return { width: 10 };
          case "version":
            return { width: 10 };
          default:
            return { width: 10 };
        }
      });
      const table = sheet.getTable(headerName);
      // 设置数据验证规则
      const StatusDataValidation = {
        type: 'list',
        formulae: ['"通过,失败,遗留,待执行"'], // 允许的选项
        showErrorMessage: true,
        errorTitle: '没有此选项',
        error: '请从列表中选择一个有效值'
      };
      const PriorityDataValidation = {
        type: 'list',
        formulae: ['"高,中,低"'], 
        showErrorMessage: true,
        errorTitle: '没有此选项',
        error: '请从列表中选择一个有效值'
      };
      // 获取 `status` 列的索引
      const statusColumnIndex = table.table.columns.findIndex(column => column.name ==  'status');
      const priorityColumnIndex = table.table.columns.findIndex(column => column.name ==  'priority');
      // 将数据有效性应用于 "status" 列中的每个单元格（假设数据从第2行开始）
      sheet.getCell(1, statusColumnIndex + 1).dataValidation = StatusDataValidation;
      sheet.getCell(1, priorityColumnIndex + 1).dataValidation = PriorityDataValidation;
      table.commit();
   
      const writeFile = (fileName, content) => {
        const link = document.createElement("a");
        const blob = new Blob([content], {
          type: "application/vnd.ms-excel;charset=utf-8;"
        });
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
      };
   
      // 表格的数据绘制完成，定义下载方法，将数据导出到Excel文件
      workbook.xlsx.writeBuffer().then((buffer) => {
        writeFile('测试用例模板', buffer);
      });
    }
  };
render() {
  const columns = [
    {
      title: 'KEY',
      dataIndex: '_id',
      key: '_id',
      ellipsis:true
    },
    {
      title: '模块',
      dataIndex: 'model',
      key: 'model',
      ellipsis:true
    },
    {
      title: '子模块',
      dataIndex: 'submodel',
      key: 'submodel',
      ellipsis:true
    },
    {
      title: '用例标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 180,
      render: (text,record) => <Tooltip title={record.title}><p>{text}</p></Tooltip>
    },
    {
      title: '前置条件',
      dataIndex: 'preconditions',
      key: 'preconditions',
      ellipsis: true,
      render: (text,record) => <Tooltip title={record.preconditions}><p>{text}</p></Tooltip>
    },
    {
      title: '步骤',
      dataIndex: 'step',
      key: 'step',
      ellipsis: true,
      render: (text,record) => <Tooltip title={record.step}><p>{text}</p></Tooltip>
    },
    {
      title: '预期结果',
      dataIndex: 'expect',
      key: 'expect',
      ellipsis: true,
      render: (text,record) => <Tooltip title={record.expect}><p>{text}</p></Tooltip>
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (text,record) => <Tooltip title={record.remarks}><p>{text}</p></Tooltip>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority'
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
            <Option value={id + '-undone'}>
              <span className="tag-status undone">待执行</span>
            </Option>
            <Option value={id + '-fail'}>
              <span className="tag-status stoping">失败</span>
            </Option>
            <Option value={id + '-pass'}>
              <span className="tag-status done">通过</span>
            </Option>
            <Option value={id + '-legacy'}>
              <span className="tag-status deprecated">遗留</span>
            </Option>
          </Select>
        );
      },
      filters: apistatusArr,
      onFilter: (value, record) => record.status.indexOf(value) === 0
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      ellipsis: true,
      render: (text,record) => <Tooltip title={record.version}><p>{text}</p></Tooltip>
    },
    {
      title: '接口用例key',
      dataIndex: 'interface_caseid',
      key: 'interface_caseid',
      // render: text => <a href={`/project/${this.props.projectid}/interface/case/${text}`}>{text}</a>
      render: text=> <Button type='link' href={`/project/${this.props.projectid}/interface/case/${text}`} onClick={()=>this.returnCase(text)}>{text}</Button>
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
            <EditOutlined
              className="interface-edit-icon"
              style={{display:'block',float: 'left',marginRight:'20px'}}
              onClick={()=>this.Openeditcase(id,record)} />
            <DeleteOutlined
              className="interface-delete-icon"
              style={{display:'block',float: 'left',marginRight:'20px'}}
              onClick={() => this.Deletecase(id)} />
            <Tooltip title="克隆用例">
              <CopyOutlined
                className="interface-copy-icon"
                onClick={()=>this.Copycase(record)}
                style={{ display: 'block' ,float: 'left',marginRight:'20px'}} />
            </Tooltip>
          </span>
        );
      }
    }
  ];
  // let total = 0;
  let data = [];
  data = this.props.caselist;
  data = data.map(item => {
    item.key = item._id;
    return item;
  });
  let aggregate = this.props.aggregate;
  let aggregateMessage = JSON.stringify(aggregate.map(obj => {
    let types = apistatusArr.find(item => item.value === obj._id);
    return types.text + ': ' + obj.count + ' 个  ';
  }));
  const pageConfig = {
    total: this.props.totalCount,
    pageSize: limit,
    current: this.state.current,
    onChange: this.changePage
  };
  const { selectedRowKeys } = this.state;
  const rowSelection = {
    selectedRowKeys,
    onChange: this.onSelectChange
  };
  const hasSelected = this.state.delid.length > 0;

  return (
    <div>
      <Button onClick={this.Batchdelete} className='delcase' type='primary' disabled={!hasSelected} loading={this.state.delloading}>删除</Button>
      <Button style={{marginLeft: '25px'}} onClick={this.exportToExcel} className='importexl' type='primary' >导出</Button>
      <Button style={{marginLeft: '25px'}} onClick={this.Openexl} className='importexl' type='primary' >用例exl上传</Button>
      <Button style={{marginLeft: '25px'}} onClick={this.Opencase} className='creatcase' type='primary' >添加用例</Button>
      <h2 className="case-title" style={{ display: 'inline-block', margin: 0 ,marginLeft: '25px'}}>
        全部用例共 ({this.props.totalCount}) 个,其中：{aggregateMessage}
      </h2>
      <Search placeholder="搜索用例标题，版本:标题 可按版本进行搜索" onSearch={this.filterCol} />
      <Layout>
        <Content
          style={{
          height: '100%',
          margin: '0 24px 0 16px',
          overflow: 'initial',
          backgroundColor: '#fff'
          }}
          >
          <div className="caselist">
            <Table className='table-caselist' rowSelection={rowSelection} loading={this.state.isLoading} columns={columns} dataSource={data} position='bottom' bordered pagination={pageConfig} onChange={this.handleChange}/>
          </div>
        </Content>
      </Layout>
      <Modal
        refs
        width={1000}
        height='93%'
        wrapClassName="modal"
        className="modal-add-content"
        title={'用例excel上传-在线预览'}
        visible={this.state.close}
        onCancel={this.closemodal}
        destroyOnClose={true}
        footer={null}
      >
        <Dragger
          name="file"
          accept=".xls,.xlsx" maxCount={1}
          beforeUpload={function(){
            return false;
          }}
          onChange={this.uploadFilesChange.bind(this)}
          showUploadList={false}>
          <p className="ant-upload-text">
            <span>点击上传文件</span>
              或者拖拽上传
          </p>
        </Dragger>
        <Table 
          columns={this.state.tableHeader} 
          dataSource={this.state.tableData}
          style={{marginTop: '20px'}}
          pagination={false}
          loading={this.state.Loading}
        />
        <div style={{textAlign: 'center', marginTop: '20px'}}>
          <Button onClick={this.toReturn}>返回</Button>
          <Button loading={this.state.Loading} style={{marginLeft: '25px'}} onClick={this.toSubmit} className='addbutton' type='primary' >确认</Button>
        </div>
      </Modal>
      {this.state.add && (
        //添加
        <Modal
          title="添加用例"
          visible={this.state.add}
          onCancel={() => this.setState({ add: false })}
          footer={null}
          className="addcatmodal"
        >
          <Addcase
            onCancel={() => this.setState({ add: false })}
            onSubmit={this.Createcase}
          />
        </Modal>
        )}
      {this.state.edit && (
        //编辑
        <Modal
          title="编辑用例"
          visible={this.state.edit}
          onCancel={() => this.setState({ edit: false })}
          footer={null}
          className="editcatmodal"
        >
          <Addcase
            caseid={this.state.caseid}
            catdata={this.state.editdata}
            onCancel={() => this.setState({ edit: false })}
            onSubmit={this.Editcase}
          />
        </Modal>
      )}
    </div>
  );
}
}
export default Caselib;