import React, { PureComponent as Component } from 'react';
import { ArrowDownOutlined, InboxOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import {
  Upload,
  message,
  Select,
  Tooltip,
  Button,
  Spin,
  Switch,
  Modal,
  Radio,
  Input,
  Checkbox,
  Col,
  Collapse,
  Row,
  Table,
} from 'antd';
import ReactFileReader from "react-file-reader";
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import './ProjectData.scss';
import axios from 'axios';
const { TextArea } = Input;
const Panel = Collapse.Panel;
import URL from 'url';

const Dragger = Upload.Dragger;
import { saveImportData } from '../../../../reducer/modules/interface';
import { fetchUpdateLogData } from '../../../../reducer/modules/news.js';
import { handleSwaggerUrlData } from '../../../../reducer/modules/project';
const Option = Select.Option;
const confirm = Modal.confirm;
const plugin = require('client/plugin.js');
const RadioGroup = Radio.Group;
let importDataModule = {};
let importColDataModule = {};
const exportDataModule = {};
const exportColDataModule = {};
const HandleImportData = require('common/HandleImportData');
import {fetchInterfaceColListall} from '../../../../reducer/modules/interfaceCol';
function handleExportRouteParams(url, status, isWiki) {
  if (!url) {
    return;
  }
  let urlObj = URL.parse(url, true),
    query = {};
  query = Object.assign(query, urlObj.query, { status, isWiki });
  return URL.format({
    pathname: urlObj.pathname,
    query
  });
}
function handleExportColJson(url,ids){
  let colid = ids.length>0 ? ids.join(','):0;
  if (!url) {
    return;
  }
  let urlObj = URL.parse(url, true),
    query = {};
  query = Object.assign(query, urlObj.query, { colid });
  return URL.format({
    pathname: urlObj.pathname,
    query
  });
}

// exportDataModule.pdf = {
//   name: 'Pdf',
//   route: '/api/interface/download_crx',
//   desc: '导出项目接口文档为 pdf 文件'
// }
@connect(
  state => {
    return {
      curCatid: -(-state.inter.curdata.catid),
      basePath: state.project.currProject.basepath,
      currProject:state.project.currProject,
      updateLogList: state.news.updateLogList,
      swaggerUrlData: state.project.swaggerUrlData,
      interfaceColListall: state.interfaceCol.interfaceColListall
    };
  },
  {
    saveImportData,
    fetchUpdateLogData,
    handleSwaggerUrlData,
    fetchInterfaceColListall
  }
)
class ProjectData extends Component {
  constructor(props) {
    super(props);
    this.state = {
      exportColModalVisible:false,
      selectCatid: '',
      menuList: [],
      importType:'interface',
      curImportType: 'swagger',
      colImportType:'har',
      curExportType: null,
      curExportColType: null,
      showLoading: false,
      dataSync: 'merge',
      exportContent: 'all',
      isSwaggerUrl: false,
      swaggerUrl: '',
      isWiki: false,
      completeupfile :false,
      Apitypelist:[],
      Apijsonlist:[],
      Apitype:[],
      Apijson:[],
      needfile:[],
      colid:[],
      addHeaders:'Content-Type',
      filecomplete:'请上传Pb文件'
    };
  }
  static propTypes = {
    match: PropTypes.object,
    currProject:PropTypes.object,
    curCatid: PropTypes.number,
    basePath: PropTypes.string,
    saveImportData: PropTypes.func,
    fetchUpdateLogData: PropTypes.func,
    updateLogList: PropTypes.array,
    handleSwaggerUrlData: PropTypes.func,
    swaggerUrlData: PropTypes.string,
    interfaceColListall: PropTypes.array,
    fetchInterfaceColListall: PropTypes.func
  };

  async componentWillMount() {
    axios.get(`/api/interface/getCatMenu?project_id=${this.props.match.params.id}`).then(data => {
      if (data.data.errcode === 0) {
        let menuList = data.data.data;
        this.setState({
          menuList: menuList,
          selectCatid: menuList[0]._id
        });
      }
    });
    plugin.emitHook('import_data', importDataModule);
    plugin.emitHook('import_col_data', importColDataModule);
    plugin.emitHook('export_data', exportDataModule, this.props.match.params.id);
    plugin.emitHook('export_coldata', exportColDataModule, this.props.match.params.id);
    
    importDataModule.Golang = {name:"Golang",desc:"通过项目url接口文档导入"};
    await this.props.fetchInterfaceColListall(this.props.match.params.id);
  }

  selectChange(value) {
    this.setState({
      selectCatid: +value
    });
  }

  uploadChange = info => {
    const status = info.file.status;
    if (status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
    } else if (status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };

  handleAddInterface = async res => {
    return await HandleImportData(
      res,
      this.props.match.params.id,
      this.state.importType,
      this.state.colImportType,
      this.state.colid,
      this.state.envid,
      this.state.addHeaders,
      this.state.selectCatid,
      this.state.menuList,
      this.props.basePath,
      this.state.dataSync,//覆盖类型
      message.error,
      message.success,
      () => this.setState({ showLoading: false })
    );
  };

  // 本地文件上传
  handleFile = info => {
    if (!this.state.curImportType) {
      return message.error('请选择导入数据的方式');
    }
    if (this.state.selectCatid) {
      this.setState({ showLoading: true,importType:'interface' });
      let reader = new FileReader();
      reader.readAsText(info.file);
      reader.onload = async res => {
        res = await importDataModule[this.state.curImportType].run(res.target.result);
        if (this.state.dataSync === 'merge') {
          // 开启同步
          this.showConfirm(res);
        } else {
          // 未开启同步
          await this.handleAddInterface(res);
        }
      };
    } else {
      message.error('请选择上传的默认分类');
    }
  };
  // 本地文件上传
  handleFileCol = info => {
    if (!this.state.colImportType) {
      return message.error('请选择导入数据的方式');
    }
    if (this.state.colImportType!=='json'&&this.state.colid.length==0) {
      return message.error('请选择导入到的集合');
    }
    if (!this.state.envid) {
      return message.error('请选择关联的环境');
    }
    this.setState({ showLoading: true,importType:'col' });
    let reader = new FileReader();
    reader.readAsText(info.file);
    reader.onload = async res => {
      res = await importColDataModule[this.state.colImportType].run(res.target.result);
      await this.handleAddInterface(res);
    };
  };
  showConfirm = async res => {
    let that = this;
    let typeid = this.props.match.params.id;
    let apiCollections = res.apis.map(item => {
      return {
        method: item.method,
        path: item.path
      };
    });
    let result = await this.props.fetchUpdateLogData({
      type: 'project',
      typeid,
      apis: apiCollections
    });
    let domainData = result.payload.data.data;
    const ref = confirm({
      title: '您确认要进行数据同步????',
      width: 600,
      okType: 'danger',
      iconType: 'exclamation-circle',
      className: 'dataImport-confirm',
      okText: '确认',
      cancelText: '取消',
      content: (
        <div className="postman-dataImport-modal">
          <div className="postman-dataImport-modal-content">
            {domainData.map((item, index) => {
              return (
                <div key={index} className="postman-dataImport-show-diff">
                  <span className="logcontent" dangerouslySetInnerHTML={{ __html: item.content }} />
                </div>
              );
            })}
          </div>
          <p className="info">温馨提示： 数据同步后，可能会造成原本的修改数据丢失</p>
        </div>
      ),
      async onOk() {
        await that.handleAddInterface(res);
      },
      onCancel() {
        that.setState({ showLoading: false, dataSync: 'normal' });
        ref.destroy();
      }
    });
  };

  handleImportType = val => {
    this.setState({
      curImportType: val,
      isSwaggerUrl: false
    });
  };
  handleImportColType = val => {
    this.setState({
      colImportType: val
    });
  };
  handleExportType = val => {
    this.setState({
      curExportType: val,
      isWiki: false
    });
  };
  handleExportColType = val => {
    this.setState({
      curExportColType: val
    });
  };
  // 处理导入信息同步
  onChange = checked => {
    this.setState({
      dataSync: checked
    });
  };

  // 处理swagger URL 导入
  handleUrlChange = checked => {
    this.setState({
      isSwaggerUrl: checked
    });
  };
  //处理pburl导入
  handleGoUrlChange = checked => {
    this.setState({
      isGoUrl: checked
    });
  };

  // 记录输入的url
  swaggerUrlInput = url => {
    this.setState({
      swaggerUrl: url
    });
  };
  // 记录输入的url
  GoUrlInput = url => {
    this.setState({
      GoUrl: url
    });
  };

  // url导入上传
  onUrlUpload = async () => {
    if (!this.state.curImportType) {
      return message.error('请选择导入数据的方式');
    }

    if (!this.state.swaggerUrl) {
      return message.error('url 不能为空');
    }
    if (this.state.selectCatid) {
      this.setState({ showLoading: true });
      try {
        // 处理swagger url 导入
        await this.props.handleSwaggerUrlData(this.state.swaggerUrl);
        // let result = json5_parse(this.props.swaggerUrlData)
        let res = await importDataModule[this.state.curImportType].run(this.props.swaggerUrlData);
        if (this.state.dataSync === 'merge') {
          // merge
          this.showConfirm(res);
        } else {
          // 未开启同步
          await this.handleAddInterface(res);
        }
      } catch (e) {
        this.setState({ showLoading: false });
        message.error(e.message);
      }
    } else {
      message.error('请选择上传的默认分类');
    }
  };
  //通过文件获取base64
  loadonChange=async(files)=>{
    var filebase = files.base64;//转base64
    var filename = files.fileList[0].name;
    let fdata ={};
    fdata.filebase=filebase;
    fdata.next = false;
    fdata.name = filename;
    fdata.project_id = this.props.match.params.id;
    let content;
    if(this.state.needfile.length<=0){
      content = {
        method: 'post',
        url: '/api/interface/importGolangApifile',
        data : fdata
      }
    }else{
      fdata.next = true;
      content = {
        method: 'post',
        url: '/api/interface/importGolangApifile',
        data : fdata
      }
    }

    await axios(content).then(async res => {
      if (res.data.errcode !== 0) {
        return message.error(`${res.data.errmsg}`);
      }
      
      if(res.data.data&&res.data.data.length>0){
        await this.setState({filecomplete:'请继续上传文件',needfile:res.data.data});
        message.success('还需上传文件');
      }else if(fdata.next){
        let needfile = [];
        needfile = this.state.needfile;
        if(Array.isArray(needfile)){
          if(needfile.length>1){
            needfile = needfile.pop();
          }else{
            needfile = []
          }
        }else{
          needfile = []
        }
        this.setState({needfile:needfile});
        if(needfile.length>0){
          this.setState({filecomplete:'请继续上传文件'});
          message.success('还需上传文件');
        }else{
          this.setState({ completeupfile:  true,filecomplete:'已上传完成'});
          message.success('上传完成');
        }
      }else{
        this.setState({ completeupfile:  true,filecomplete:'已上传完成'});
        message.success('上传完成');
      }
      console.log(this.state);
    });
  }
  getApi = async()=>{
    if (!this.state.GoUrl) {
      return message.error('url 不能为空');
    }
    this.setState({ showLoading: true });
    try {
      //请求url获取json文档数据
      let axioscontent={
        method: 'get',
        url: this.state.GoUrl,
        headers : {'prod':'coppy.test.NTf6z6yE4fLMlyGv'}
      }
      let Apijsonlist;
      let Apitypelist;
      await axios(axioscontent).then(res => {
        Apijsonlist = res.data.list;
        Apitypelist = res.data.type;
      });
      if(Apijsonlist&&Apijsonlist.length>0){
        this.setState({
          Apijsonlist : Apijsonlist,
          Apitypelist : Apitypelist
        })
        console.log(this.state);
        this.setState({ showLoading: false });
      }else{
        message.error('获取接口有误请查看控制台');
      }

    }catch(err){
      message.error(err)
    }
  }
  confirmtype = value =>{
    console.log(value);
    this.setState({
      Apitype: value
    })
  }
  // Golangurl导入上传
  onGoUrlUpload = async () => {
    if (!this.state.curImportType) {
      return message.error('请选择导入数据的方式');
    }

    if (!this.state.GoUrl) {
      return message.error('url 不能为空');
    }
    if (!this.state.completeupfile) {
      return message.error('文件 未上传完成');
    }
    if (!this.state.Apijsonlist) {
      return message.error('文件接口为空');
    }

    let Apijson = [];
    let typelist = this.state.Apitype.toString();
    for(let i=0;i<this.state.Apijsonlist.length;i++){
      let type = this.state.Apijsonlist[i].type;
      if(typelist.indexOf(type)>=0){
        Apijson.push(this.state.Apijsonlist[i])
      }
    }
    if (this.state.selectCatid) {
      
      try {
        this.setState({ showLoading: true });
        //导入接口
        let adata ={};
        adata.apijson = Apijson;
        adata.project_id = this.props.match.params.id;
        adata.catid = this.state.selectCatid;
        console.log('data',adata);
        let content={
          method: 'post',
          url: '/api/interface/importGolangApi',
          data : adata
        }
        await axios(content).then(res => {
          if (res.data.errcode !== 0) {
            return message.error(`${res.data.errmsg}`);
          }
          let result = res.data;
          if(result.data.faildetail.length>0){
            delete res.data.faildetail;
            message.success(JSON.stringify(result.data));
          }else{
            message.success(JSON.stringify(result.data));
          }
        });

        this.setState({ showLoading: false });
      } catch (e) {
        this.setState({ showLoading: false });
        message.error(e.message);
      }
    } else {
      message.error('请选择上传的默认分类');
    }
  };
  // 处理导出接口是全部还是公开
  handleChange = e => {
    this.setState({ exportContent: e.target.value });
  };

  //  处理是否开启wiki导出
  handleWikiChange = e => {
    this.setState({
      isWiki: e.target.checked
    });
  };

  /**
   *
   *
   * @returns
   * @memberof ProjectData
   */
  rowRadioSelection = {
    type: 'checkbox',
    onChange:(selectedRowKeys)=>{
      this.setState({
        colid:selectedRowKeys
      })
    }
  };
  addCol = async () => {
    const { addColName: name, addColDesc: desc } = this.state;
    const project_id = this.props.match.params.id;
    const parent_id=-1;
    const res = await axios.post('/api/col/add_col', { name, desc,parent_id, project_id });
    if (!res.data.errcode) {
      message.success('添加集合成功');
      await this.props.fetchInterfaceColListall(project_id);
      this.setState({ colid: res.data.data._id });
    } else {
      message.error(res.data.errmsg);
    }
  };
  selectDomain = value => {
    this.setState({ envid:value });
  };
  render() {
    const uploadMess = {
      name: 'interfaceData',
      multiple: true,
      showUploadList: false,
      action: '/api/interface/interUpload',
      customRequest: this.handleFile,
      onChange: this.uploadChange
    };
    const uploadMessCol = {
      name: 'interfaceColData',
      multiple: true,
      showUploadList: false,
      action: '/api/interface/interUpload',
      customRequest: this.handleFileCol,
      onChange: this.uploadChange
    };
    const log_env = [];
    this.props.currProject.env.forEach(item=>{
      log_env.push(<Option key={item._id.toString()}>{item.name+' '+item.domain}</Option>);
    })
    let exportUrl =
      this.state.curExportType &&
      exportDataModule[this.state.curExportType] &&
      exportDataModule[this.state.curExportType].route;
    let exportColUrl =
      this.state.curExportColType &&
      exportColDataModule[this.state.curExportColType] &&
      exportColDataModule[this.state.curExportColType].route;
    let exportHref = handleExportRouteParams(
      exportUrl,
      this.state.exportContent,
      this.state.isWiki
    );
    let exportColJson = handleExportColJson(
      exportColUrl,
      this.state.colid
    );
    const columns = [
      {
        title: '用例集合',
        dataIndex: 'title',
        width: '100%'
      }
    ];
    const { interfaceColListall = [] } = this.props;
    // console.log('inter', this.state.exportContent);
    return (
      <div className="g-row">
        <div className="m-panel">
          <div className="postman-dataImport">
            <div className="dataImportCon">
              <div>
                <h3>
                  接口数据导入&nbsp;
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="/doc/documents/data.html"
                  >
                    <Tooltip title="点击查看文档">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </a>
                </h3>
              </div>
              <div className="dataImportTile">
                <Select
                  placeholder="请选择导入数据的方式"
                  value={this.state.curImportType}
                  onChange={this.handleImportType}
                >
                  {Object.keys(importDataModule).map(name => {
                    return (
                      <Option key={name} value={name}>
                        {importDataModule[name].name}
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div className="catidSelect">
                <Select
                  value={this.state.selectCatid + ''}
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="请选择数据导入的默认分类"
                  optionFilterProp="children"
                  onChange={this.selectChange.bind(this)}
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {this.state.menuList.map((item, key) => {
                    return (
                      <Option key={key} value={item._id + ''}>
                        {item.name}
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div className="dataSync">
                <span className="label">
                  接口数据同步&nbsp;
                  <Tooltip
                    title={
                      <div>
                        <h3 style={{ color: 'white' }}>普通模式</h3>
                        <p>不导入已存在的接口</p>
                        <br />
                        <h3 style={{ color: 'white' }}>智能合并</h3>
                        <p>
                          已存在的接口，将合并返回数据的 response，适用于导入了 swagger
                          数据，保留对数据结构的改动
                        </p>
                        <br />
                        <h3 style={{ color: 'white' }}>完全覆盖</h3>
                        <p>不保留旧数据，完全使用新数据，适用于接口定义完全交给后端定义</p>
                      </div>
                    }
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>{' '}
                </span>
                {this.state.curImportType !== 'Golang' ? (
                  <Select value={this.state.dataSync} onChange={this.onChange}>
                    <Option value="normal">普通模式</Option>
                    <Option value="good">智能合并</Option>
                    <Option value="merge">完全覆盖</Option>
                  </Select>
                ):(
                  <Select value={this.state.dataSync} onChange={this.onChange}>
                    <Option value="merge">完全覆盖</Option>
                  </Select>
                )}

                {/* <Switch checked={this.state.dataSync} onChange={this.onChange} /> */}
              </div>
              {this.state.curImportType === 'swagger' && (
                <div className="dataSync">
                  <span className="label">
                    开启url导入&nbsp;
                    <Tooltip title="swagger url 导入">
                      <QuestionCircleOutlined />
                    </Tooltip>{' '}
                    &nbsp;&nbsp;
                  </span>

                  <Switch checked={this.state.isSwaggerUrl} onChange={this.handleUrlChange} />
                </div>
              )}
              {this.state.curImportType === 'swagger' && this.state.isSwaggerUrl ? (
                <div className="import-content url-import-content">
                  <Input
                    placeholder="http://demo.swagger.io/v2/swagger.json"
                    onChange={e => this.swaggerUrlInput(e.target.value)}
                  />
                  <Button
                    type="primary"
                    className="url-btn"
                    onClick={this.onUrlUpload}
                    loading={this.state.showLoading}
                  >
                    上传
                  </Button>
                </div>
              ) : this.state.curImportType !== 'Golang' && (
                <div className="import-content">
                  <Spin spinning={this.state.showLoading} tip="上传中...">
                    <Dragger {...uploadMess}>
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">点击或者拖拽文件到上传区域</p>
                      <p
                        className="ant-upload-hint"
                        onClick={e => {
                          e.stopPropagation();
                        }}
                        dangerouslySetInnerHTML={{
                          __html: this.state.curImportType
                            ? importDataModule[this.state.curImportType].desc
                            : null
                        }}
                      />
                    </Dragger>
                  </Spin>
                </div>
              )}
              {this.state.curImportType === 'Golang' &&  (
                <div className="import-content url-import-content">
                  <div className="getApidata">
                    <Tooltip title='API地址可能跨域，请安装cros-anywhere插件或者whistle设置来源。请注意设置prod'>
                      <Input
                        className="getApiurl"
                        placeholder="https://dev-ap-coppy.wss1.cn/ag/r/info"
                        onChange={e => this.GoUrlInput(e.target.value)}
                      />
                    </Tooltip>
                    <Tooltip title='点击获取API路由以及分类'>
                      <Button className="getApi" type="primary" shape="circle" icon={<ArrowDownOutlined />} onClick={this.getApi}/>
                    </Tooltip>
                  </div>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="API分类"
                    defaultValue={[]}
                    onChange={this.confirmtype}
                    className = "select-ipt"
                  >
                    {this.state.Apitypelist.map((item, index) => {
                      return (
                        <Option key={index} value={item}>
                          {item}
                        </Option>
                    );
                  })}
                  </Select>
                  <ReactFileReader
                    fileTypes={['.proto']}
                    base64
                    multipleFiles={!1}
                    handleFiles={this.loadonChange}>
                    <Button loading={this.state.showLoading}>
                      {this.state.filecomplete}
                    </Button>
                  </ReactFileReader>
                  <Button
                    type="primary"
                    className="url-btn"
                    onClick={this.onGoUrlUpload}
                    loading={this.state.showLoading}
                  >
                    上传
                  </Button>
                </div>
              ) }
            </div>

            <div
              className="dataImportCon"
              style={{
                marginLeft: '20px',
                display: Object.keys(exportDataModule).length > 0 ? '' : 'none'
              }}
            >
              <div>
                <h3>接口数据导出</h3>
              </div>
              <div className="dataImportTile">
                <Select placeholder="请选择导出数据的方式" onChange={this.handleExportType}>
                  {Object.keys(exportDataModule).map(name => {
                    return (
                      <Option key={name} value={name}>
                        {exportDataModule[name].name}
                      </Option>
                    );
                  })}
                </Select>
              </div>

              <div className="dataExport">
                <RadioGroup defaultValue="all" onChange={this.handleChange}>
                  <Radio value="all">全部接口</Radio>
                  <Radio value="open">公开接口</Radio>
                </RadioGroup>
              </div>
              <div className="export-content">
                {this.state.curExportType ? (
                  <div>
                    <p className="export-desc">{exportDataModule[this.state.curExportType].desc}</p>
                    <a 
                      target="_blank"
                      rel="noopener noreferrer"
                      href={exportHref}>
                      <Button className="export-button" type="primary" size="large">
                        {' '}
                        导出{' '}
                      </Button>
                    </a>
                    <Checkbox
                      checked={this.state.isWiki}
                      onChange={this.handleWikiChange}
                      className="wiki-btn"
                      disabled={this.state.curExportType === 'json'}
                    >
                      添加wiki&nbsp;
                      <Tooltip title="开启后 html 和 markdown 数据导出会带上wiki数据">
                        <QuestionCircleOutlined />
                      </Tooltip>{' '}
                    </Checkbox>
                  </div>
                ) : (
                  <Button disabled className="export-button" type="primary" size="large">
                    {' '}
                    导出{' '}
                  </Button>
                )}
              </div>
            </div>

            <div className="dataImportCon" style={{marginLeft: '20px'}}>
              <div>
                <h3>
                  集合数据导入&nbsp;
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="/doc/documents/data.html"
                  >
                    <Tooltip title="点击查看文档">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </a>
                </h3>
              </div>
              <div className="dataImportTile">
                <Select
                  placeholder="请选择导入数据的方式"
                  value={this.state.colImportType}
                  onChange={this.handleImportColType}
                >
                  {Object.keys(importColDataModule).map(name => {
                    return (
                      <Option key={name} value={name}>
                        {importColDataModule[name].name}
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div className="colSelect">
                <Button onClick={()=>this.setState({ saveColModalVisible: true })}>选择导入集合</Button>
                <Select
                  value={this.state.envid}
                  style={{ width: '100%',top:'10px' }}
                  placeholder="关联envid"
                  onChange={this.selectDomain}
                >
                  {log_env}
                </Select>
                <Input 
                  style={{ width: '100%',top:'20px' }} 
                  placeholder="需要保留的请求头key，以逗号分隔。默认只保留ContentType" 
                  value={this.state.addHeaders} 
                  onChange={e => this.setState({ addHeaders: e.target.value })}
                >
                </Input>
              </div>
              <Modal
                className="add-col-modal"
                title="添加到集合"
                open={this.state.saveColModalVisible}
                onOk={()=>this.setState({ saveColModalVisible: false })}
                onCancel={()=>this.setState({ saveColModalVisible: false,addColName:'',addColDesc:'',colid:[] })}
              >
                <p>请选择添加到的集合：</p>
                <Table columns={columns} rowSelection={this.rowRadioSelection} dataSource={interfaceColListall}
                  pagination={false}/>
                <Collapse>
                  <Panel header="添加新集合">
                    <Row gutter={6} className="modal-input">
                      <Col span={5}>
                        <div className="label">集合名：</div>
                      </Col>
                      <Col span={15}>
                        <Input
                          placeholder="请输入集合名称"
                          value={this.state.addColName}
                          onChange={e => this.setState({ addColName: e.target.value })}
                        />
                      </Col>
                    </Row>
                    <Row gutter={6} className="modal-input">
                      <Col span={5}>
                        <div className="label">简介：</div>
                      </Col>
                      <Col span={15}>
                        <TextArea
                          rows={3}
                          placeholder="请输入集合描述"
                          value={this.state.addColDesc}
                          onChange={e => this.setState({ addColDesc: e.target.value })}
                        />
                      </Col>
                    </Row>
                    <Row type="flex" justify="end">
                      <Button style={{ float: 'right' }} type="primary" onClick={this.addCol}>
                        添 加
                      </Button>
                    </Row>
                  </Panel>
                </Collapse>
              </Modal>
              <Modal
                className="export-col-modal"
                title="选择导出集合"
                open={this.state.exportColModalVisible}
                onOk={()=>this.setState({ exportColModalVisible: false })}
                onCancel={()=>this.setState({ exportColModalVisible: false,colid:[] })}
              >
                <p>请选择添加到的集合：</p>
                <Table columns={columns} rowSelection={this.rowRadioSelection} dataSource={interfaceColListall}
                  pagination={false}/>
              </Modal>
              <div className="import-content">
                <Spin spinning={this.state.showLoading} tip="上传中...">
                  <Dragger {...uploadMessCol}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或者拖拽文件到上传区域</p>
                    <p
                      className="ant-upload-hint"
                      onClick={e => {
                        e.stopPropagation();
                      }}
                      dangerouslySetInnerHTML={{
                        __html: this.state.colImportType
                          ? importColDataModule[this.state.colImportType].desc
                          : null
                      }}
                    />
                  </Dragger>
                </Spin>
              </div>
            </div>

            <div
              className="dataImportCon"
              style={{
                marginLeft: '20px',
                display: Object.keys(exportColDataModule).length > 0 ? '' : 'none'
              }}
            >
              <div>
                <h3>集合数据导出</h3>
              </div>
              <div className="dataImportTile">
                <Select placeholder="请选择导出数据的方式" onChange={this.handleExportColType}>
                  {Object.keys(exportColDataModule).map(name => {
                    return (
                      <Option key={name} value={name}>
                        {exportColDataModule[name].name}
                      </Option>
                    );
                  })}
                </Select>
              </div>
              <div className="dataExport" style={{marginTop:'20ox'}}>
                <Button onClick={()=>this.setState({ exportColModalVisible: true })}>选择导出集合</Button>
              </div>
              <div className="export-content">
                {this.state.curExportColType ? (
                  <div>
                    <p className="export-desc">{exportColDataModule[this.state.curExportColType].desc}</p>
                    <a 
                      target="_blank"
                      rel="noopener noreferrer"
                      href={exportColJson}>
                      <Button className="export-button" type="primary" size="large">
                        {' '}
                        导出{' '}
                      </Button>
                    </a>
                  </div>
                ) : (
                  <Button disabled className="export-button" type="primary" size="large">
                    {' '}
                    导出{' '}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ProjectData;
