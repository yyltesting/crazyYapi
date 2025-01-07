const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class interfaceCol extends baseModel {
  getName() {
    return 'interface_col';
  }

  getSchema() {
    return {
      name: { type: String, required: true },
      uid: { type: Number, required: true },
      project_id: { type: Number, required: true },
      desc: String,
      add_time: Number,
      parent_id: Number,
      up_time: Number,
      status:Number,
      run_start:Number,
      run_end:Number,
      case_env:String,
      pre_col:String,
      own:[
        {
          uid: Number,
          username: String,
          email: String
        }
      ],
      colpre_script: { type: String, default: '' },
      colafter_script: { type: String, default: '' },
      index: { type: Number, default: 0 },
      test_report: { type: String, default: '{}' },
      checkHttpCodeIs200: {
        type:Boolean,
        default: false
      },
      checkResponseSchema: {
        type:Boolean,
        default: false
      },
      checkResponseField: {
        name: {
          type: String,
          required: true,
          default: "code"
        },
        value: {
          type: String,
          required: true,
          default: "0"
        },
        enable: {
          type: Boolean,
          default: false
        }
      },
      checkScript: {
        content: {
          type: String
        },
        enable: {
          type: Boolean,
          default: false
        }
      }
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
  findByIds(ids){
    let list = [];
    ids.forEach(item => {
      list.push({"_id":item});
    });
    return this.model
      .count({
        $or :list
      })
      .exec();
  }
  findByIdforIndex(projectid,pid){
    return this.model
    .findOne({
      project_id:projectid,
      parent_id: pid
    })
    .sort({index: -1})
    .select('index')
    .exec();
  }
  get(id) {
    return this.model
      .findOne({
        _id: id
      })
      .exec();
  }
  getCaseEnv(id) {
    return this.model
      .findOne({_id: id})
      .select('case_env')
      .exec();
  }
  getpid(id) {
    return this.model
      .findOne({
        parent_id: id
      })
      .select('name')
      .exec();
  }
  getinfo(ids) {
    let list = [];
    ids = ids.split(',');
    ids.forEach(item => {
      list.push({"_id":item});
    });
    return this.model
      .find({ $or : list })
      .select('own status name pre_col case_env uid project_id parent_id desc add_time up_time, index')
      .exec();
  }
  getchilds(id) {
    return this.model
      .find({parent_id: id})
      .select('_id')
      .exec();
  }
  getchildforcols(ids) {
    return this.model
      .find({parent_id: {$in:ids}})
      .select('_id parent_id')
      .exec();
  }
  checkRepeat(name) {
    return this.model.countDocuments({
      name: name
    });
  }

  list(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .select('own status name pre_col case_env uid project_id parent_id desc add_time up_time, index')
      .exec();
  }
  listprent(project_id) {
    return this.model
      .find({ $or : [{ $and : [{project_id : project_id}, {parent_id: null}] }, { $and : [{parent_id: -1}, {project_id: project_id}] }] })
      .select('own status name pre_col case_env uid project_id parent_id desc add_time up_time, index')
      .exec();
  }
  listchild(parent_id) {
    return this.model
      .find({
        parent_id: parent_id
      })
      .select('own status name pre_col case_env uid project_id parent_id desc add_time up_time, index')
      .exec();
  }
  listforexport(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .select('name pre_col project_id parent_id desc colpre_script colafter_script checkScript checkHttpCodeIs200 checkResponseSchema checkResponseField index')
      .exec();
  }
  getchild(parent_id){
    return this.model
    .count({
      parent_id: parent_id
    })
  }
  getcol(parent_id) {
    return this.model
      .find({
        parent_id: parent_id
      })
      .select('own status name precol case_env uid project_id parent_id desc add_time up_time, index')
      .exec();
  }
  getcolcase(projectId){
    return this.model
    .count({
      project_id: projectId
    })
  }
  getcolcasefail(projectId){
    return this.model
    .count({
      project_id: projectId,
      status:1
    })
  }
  failcol(projectId) {
    return this.model
      .find({
        project_id: projectId,
        status:1
      })
      .sort({up_time: -1})
      .select('name desc up_time')
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

  up(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }

  upColIndex(id, index) {
    return this.model.update(
      {
        _id: id
      },
      {
        index: index
      }
    );
  }
}

module.exports = interfaceCol;
