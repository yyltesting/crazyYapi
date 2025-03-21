const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class interfaceModel extends baseModel {
  getName() {
    return 'interface';
  }

  getSchema() {
    return {
      title: { type: String, required: true },
      /**
       * 接口创建者 id
       */
      uid: { type: Number, required: true },
      /**
       * 接口负责人 id 数组
       */
      owners: [ Number ],
      path: { type: String, required: true },
      method: { type: String, required: true },
      project_id: { type: Number, required: true },
      catid: { type: Number, required: true },
      edit_uid: { type: Number, default: 0 },
      status: {type: String, enum: ['undone', 'design', 'done', 'testing', 'deprecated', 'stoping'], default: 'undone'},
      desc: String,
      markdown: String,
      add_time: Number,
      up_time: Number,
      type: { type: String, enum: ['static', 'var'], default: 'static' },
      query_path: {
        path: String,
        params: [
          {
            name: String,
            value: String
          }
        ]
      },
      req_query: [
        {
          name: String,
          value: String,
          example: String,
          desc: String,
          required: {
            type: String,
            enum: ['1', '0'],
            default: '1'
          }
        }
      ],
      req_headers: [
        {
          name: String,
          value: String,
          example: String,
          desc: String,
          required: {
            type: String,
            enum: ['1', '0'],
            default: '1'
          }
        }
      ],
      req_params: [
        {
          name: String,
          desc: String,
          example: String
        }
      ],
      req_body_type: {
        type: String,
        enum: ['form', 'json', 'text', 'file', 'raw']
      },
      req_body_is_json_schema: { type: Boolean, default: false },
      req_body_form: [
        {
          name: String,
          type: { type: String, enum: ['text', 'file','list'] },
          example: String,
          value: String,
          desc: String,
          required: {
            type: String,
            enum: ['1', '0'],
            default: '1'
          }
        }
      ],
      req_body_other: String,
      res_body_type: {
        type: String,
        enum: ['json', 'text', 'xml', 'raw', 'json-schema']
      },
      res_body: String,
      res_body_is_json_schema: { type: Boolean, default: false },
      custom_field_value: String,
      field2: String,
      field3: String,
      api_opened: { type: Boolean, default: false },
      index: { type: Number, default: 0 },
      tag: Array
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }

  get(id) {
    return this.model
      .findOne({
        _id: id
      })
      .exec();
  }

  getbypath(path) {
    return this.model
      .findOne({
        path: path
      })
      .exec();
  }

  getbypathid(project_id, catid, path) {
    return this.model
      .find({
        project_id: project_id,
        catid: catid,
        path: path
      })
      .select(
        '_id'
      )
      .exec();
  }

  getBaseinfo(id) {
    return this.model
      .findOne({
        _id: id
      })
      .select('path method uid title project_id cat_id status ')
      .exec();
  }
  getPathbypid(projectid){
    return this.model
    .find({
      project_id: projectid
    })
    .select('path')
    .exec();
  }

  getVar(project_id, method) {
    return this.model
      .find({
        project_id: project_id,
        type: 'var',
        method: method
      })
      .select('_id path')
      .exec();
  }

  getByQueryPath(project_id, path, method) {
    return this.model
      .find({
        project_id: project_id,
        'query_path.path': path,
        method: method
      })
      .exec();
  }

  getByPath(project_id, path, method, select) {
    select =
      select ||
      '_id title uid path method project_id catid edit_uid status add_time up_time type query_path req_query req_headers req_params req_body_type req_body_form req_body_other res_body_type custom_field_value res_body res_body_is_json_schema req_body_is_json_schema';
    return this.model
      .find({
        project_id: project_id,
        path: path,
        method: method
      })
      .select(select)
      .exec();
  }

  checkRepeat(id, path, method) {
    return this.model.countDocuments({
      project_id: id,
      path: path,
      method: method
    });
  }

  countByProjectId(id) {
    return this.model.countDocuments({
      project_id: id
    });
  }
  countSerch(id,status) {
    return this.model
      .countDocuments({
        project_id: id,
        status:{ $in: status }
      })
      .exec();
  }
  listSimple(project_id){
    return this.model
      .find({
        project_id: project_id
      })
      .select(
        '_id title path status tag'
      )
      .sort({ up_time: -1 })
      .exec();
  }
  list(project_id, select) {
    select =
      select || '_id title uid path method project_id catid edit_uid status add_time up_time';
    return this.model
      .find({
        project_id: project_id
      })
      .select(select)
      .sort({ up_time: -1 })
      .exec();
  }

  listWithPage(project_id, page, limit,status) {
    page = parseInt(page);
    limit = parseInt(limit);
    return this.model
      .find({
        project_id: project_id,
        status:{ $in: status }
      })
      .sort({ up_time: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        '_id title uid path method project_id catid api_opened edit_uid status add_time up_time tag'
      )
      .exec();
  }

  listByPid(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .sort({ title: 1 })
      .exec();
  }

  //获取全部接口信息
  getInterfaceListCount() {
    return this.model.countDocuments({});
  }

  listByCatid(catid, select) {
    select =
      select || '_id title uid path method project_id catid edit_uid status add_time up_time index tag';
    return this.model
      .find({
        catid: catid
      })
      .select(select)
      .sort({ index: 1 })
      .exec();
  }

  listByCatidWithPage(catid, page, limit,status) {
    page = parseInt(page);
    limit = parseInt(limit);
    return this.model
      .find({
        catid: catid,
        status:{ $in: status }
      })
      .sort({ index: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        '_id title uid path method project_id catid edit_uid api_opened status add_time up_time, index, tag'
      )
      .exec();
  }

  listByInterStatus(catid, status) {
    let option = {};
    if (status === 'open') {
      option = {
        catid: catid,
        api_opened: true
      };
    } else {
      option = {
        catid: catid
      };
    }
    return this.model
      .find(option)
      .select()
      .sort({ title: 1 })
      .exec();
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }

  delByCatid(id) {
    return this.model.remove({
      catid: id
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
      data,
      { runValidators: true }
    );
  }

  upEditUid(id, uid) {
    return this.model.update(
      {
        _id: id
      },
      { edit_uid: uid },
      { runValidators: true }
    );
  }
  getcustomFieldValue(id, value) {
    return this.model
      .find({
        project_id: id,
        custom_field_value: value
      })
      .select(
        'title uid path method edit_uid status desc add_time up_time type query_path req_query req_headers req_params req_body_type req_body_form req_body_other res_body_type custom_field_value'
      )
      .exec();
  }

  aggregate(option) {
    return this.model
      .aggregate(
        [
          {$match : option},
          {
            $group : {
              _id : "$status",
              count: { $sum: 1 }
            }
          }
        ]
        )
  }

  listCount(option) {
    console.log(option);
    return this.model.countDocuments(option);
  }



  upIndex(id, index) {
    return this.model.update(
      {
        _id: id
      },
      {
        index: index
      }
    );
  }

  move(id, pid,cid) {
    return this.model.update(
        {
          _id: id
        },
        {
          project_id: pid,
          catid: cid
        }
    );
  }



  search(keyword) {
    return this.model
      .find({
        title: new RegExp(keyword, 'ig')
      })
      .limit(10);
  }
  searchp(keyword) {
    return this.model
        .find({
          path: new RegExp(keyword, 'ig')
        })
        .limit(10);
  }
}

module.exports = interfaceModel;
