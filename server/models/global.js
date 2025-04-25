const baseModel = require('./base.js');

class global extends baseModel {
  getName() {
    return 'global';
  }

  getSchema() {
    return {
      config: { type: String, required: false },
      up_time: Number
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }
  up(id, data) {
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }
  getconfig() {
    return this.model
      .findOne()
      .select('config')
      .exec();
  }
}
module.exports = global;