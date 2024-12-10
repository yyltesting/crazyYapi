const yapi = require('../yapi.js');
const baseModel = require('./base.js');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

class interfaceCase extends baseModel {
  getName() {
    return 'interface_case';
  }

  getSchema() {
    return {
      casename: { type: String, required: true },
      uid: { type: Number, required: true },
      col_id: { type: Number, required: true },
      index: { type: Number, default: 0 },
      project_id: { type: Number, required: true },
      interface_id: { type: Number, required: true },
      add_time: Number,
      up_time: Number,
      case_env: { type: String },
      req_params: [
        {
          name: String,
          value: String
        }
      ],
      req_headers: [
        {
          name: String,
          value: String
        }
      ],
      req_query: [
        {
          name: String,
          value: String,
          enable: { type: Boolean, default: true }
        }
      ],

      req_body_form: [
        {
          name: String,
          value: String,
          enable: { type: Boolean, default: true }
        }
      ],
      req_body_other: String,
      test_res_body: String,
      test_status: { type: String, enum: ['ok', 'invalid', 'error', ''] },
      test_res_header: Schema.Types.Mixed,
      mock_verify: { type: Boolean, default: false },
      enable_script: { type: Boolean, default: false },
      test_script: String,
      case_pre_script: String,
      case_post_script: String,
      disable:{ type: Boolean, default: false },
      testcaseid:Number,
      sql:String,
      rediskey:String
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }
  findById(id){
    return this.model
    .findOne({
      _id:id
    })
    .exec();
  }
  findByIdforIndex(projectid,colid){
    return this.model
    .findOne({
      project_id:projectid,
      col_id: colid
    })
    .sort({index: -1})
    .select('index')
    .exec();
  }
  //获取全部测试接口信息
  getInterfaceCaseListCount() {
    return this.model.countDocuments({});
  }

  get(id) {
    return this.model
      .findOne({
        _id: id
      })
      .exec();
  }
  getsynccase(id){
    return this.model
    .find({
      interface_id: id
    })
    .exec();
  }
  getsynccaseid(id){
    return this.model
    .find({
      interface_id: id
    })
    .select('_id')
    .exec();
  }
  getsynccaseforids(ids){
    return this.model
    .find({
      $or:ids
    })
    .exec();
  }
  getTestcaseid(testcaseid){
    return this.model
    .findOne({
      testcaseid: testcaseid
    })
    .exec();
  }
  listall(project_id,select){
    select = select || 'casename uid col_id _id index interface_id project_id';
    if (select === 'all') {
      return this.model
        .find({
          project_id: project_id
        })
        .exec();
    }
    return this.model
      .find({
        project_id: project_id
      })
      .select(select)
      .exec();
  }
  list(col_id, select) {
    select = select || 'casename uid col_id _id index interface_id project_id';
    if (select === 'all') {
      return this.model
        .find({
          col_id: col_id
        })
        .exec();
    }
    return this.model
      .find({
        col_id: col_id
      })
      .select(select)
      .exec();
  }
  listforcols(colids, select) {
    select = select || 'casename uid col_id _id index interface_id project_id';
    if (select === 'all') {
      return this.model
        .find({
          col_id: { $in:colids}
        })
        .exec();
    }
    return this.model
      .find({
        col_id: { $in:colids}
      })
      .select(select)
      .exec();
  }
  del(id) {
    return this.model.remove({
      _id: id
    });
  }

  delByProjectId(id) {
    return this.model.remove({
      project_id: id
    });
  }

  delByInterfaceId(id) {
    return this.model.remove({
      interface_id: id
    });
  }

  delByCol(id) {
    return this.model.remove({
      col_id: id
    });
  }

  up(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.update({ _id: id }, data);
  }
  upinterfaceid(id,interfaceid){
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        interface_id: interfaceid,
        up_time:up_time
      }
    );
  }
  upenv(id,case_env){
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        case_env: case_env,
        up_time:up_time
      }
    );
  }
  upheader(id,data){
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        req_headers: data,
        up_time:up_time
      }
    );
  }
  upjsonbody(id, data) {
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        req_body_other: data,
        up_time:up_time
      }
    );
  }
  uptestsctiptstr(id, data) {
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        test_script: data,
        up_time:up_time
      }
    );
  };
  upprescript(id, data) {
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        case_pre_script: data,
        up_time:up_time
      }
    );
  };
  upafterscript(id, data) {
    let up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      {
        case_post_script: data,
        up_time:up_time
      }
    );
  };
  upCaseIndex(id, index) {
    return this.model.update(
      {
        _id: id
      },
      {
        index: index
      }
    );
  }
  flush(inid,pid) {
    return this.model.updateMany(
        {
          interface_id: inid
        },
        {
          project_id: pid
        }
    );
  }


  move(id, cid) {
    return this.model.update(
        {
          _id: id
        },
        {
          col_id: cid
        }
    );
  }
}

module.exports = interfaceCase;
