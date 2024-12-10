const baseModel = require('./base.js');

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
