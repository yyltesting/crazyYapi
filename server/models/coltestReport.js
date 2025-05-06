const baseModel = require('./base.js');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

class coltestReport extends baseModel {
  getName() {
    return 'coltest_report';
  }

  getSchema() {
    return {
      colid: Number,
      add_time: Number,
      run_end: Number,
      run_start: Number,
      executor:String, 
      status:Number,
      desc:String,
      test_report: { type: String, default: '{}' },
      data:Schema.Types.Mixed //原始报告
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }
  findSimpleByColId(colid){
    return this.model
    .find({
      colid:colid
    })
    .select('_id add_time run_end run_start executor status')
    .sort({add_time: -1})
    .exec();
  }
  findReportById(id){
    return this.model
    .findOne({
      _id:id
    })
    .select('test_report')
    .exec();
  }
  findOrgReportById(id){
    return this.model
    .findOne({
      _id:id
    })
    .select('data')
    .exec();
  }
  up(id, data) {
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }
}

module.exports = coltestReport;
