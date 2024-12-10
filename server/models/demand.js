const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class demand extends baseModel {
  getName() {
    return 'demand';
  }

  getSchema() {
    return {
      demand: { type: String, required: true },
      status:{ type: String, required: true },
      uid: { type: Number, required: true },
      project_id: { type: Number, required: true },
      intro: String,
      add_time: Number,
      parent_id: Number,
      up_time: Number,
      index: { type: Number, default: 0 },
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

  getid(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .sort({
        "up_time": -1
      })
      .select('_id')
      .exec();
  }

  list(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .sort({
        "up_time": -1
      })
      .exec();
  }

  del(id) {
    return this.model.remove({
      _id: id
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

  upStatus(id, data) {
    return this.model.update(
      {
        _id: id
      },
      {
        status:data
      }
    );
  }

  checkRepeat(name) {
    return this.model.countDocuments({
      name: name
    });
  }
  
  delByProjectId(id) {
    return this.model.remove({
      project_id: id
    });
  }
}

module.exports = demand;
