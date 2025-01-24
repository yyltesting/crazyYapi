const { version } = require('os');
const yapi = require('../yapi.js');
const baseModel = require('./base.js');

class caselib extends baseModel {
  getName() {
    return 'caselib';
  }

  getSchema() {
    return {
      uid: { type: Number, required: true },
      add_time: Number,
      parent_id: Number,
      up_time: Number,
      index: { type: Number, default: 0 },
      title: { type: String, required: true },
      demandid: { type: Number, required: true },
      model: { type: String, required: true },
      submodel: String,
      preconditions:String,
      step:String,
      expect:{ type: String, required: true },
      remarks:String,
      priority:String,
      status:{ type: String, required: true },
      interface_caseid:Number,
      version:String
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
  getversion(id){
    return this.model
    .find({
      demandid: id,
      version: { $ne: null }
    })
    .distinct('version')
    .exec();
  }
  getInterfacecaseid(interface_caseid) {
    return this.model
      .findOne({
        interface_caseid: interface_caseid
      })
      .exec();
  }

  getdemandcase(demandid,version){
    let query = { demandid: demandid };
    if (version) {
      query.version = { $regex: version, $options: 'i' };
    }
    return this.model
    .count(query)
  }
  getcasesuccess(demandid,version){
    let query = { demandid: demandid,status:'pass' };
    if (version) {
      query.version = { $regex: version, $options: 'i' };
    }
    return this.model
    .count(query)
  }
  failcase(demandid,version){
    let query = { demandid: demandid,status:'fail' };
    if (version) {
      query.version = { $regex: version, $options: 'i' };
    }
    return this.model
      .find(query)
      .select('title up_time interface_caseid')
      .exec();
  }
  info(demandid,title,model,submodel){
    return this.model
      .findOne({
        demandid: demandid,
        model: model,
        submodel: submodel,
        title:title
      })
      .exec();
  }
  list(demandid) {
    return this.model
      .find({
        demandid: demandid
      })
      .sort({
        _id: 1
      })
      .exec();
  }

  listWithPage(demandid, page, limit,status) {
    page = parseInt(page);
    limit = parseInt(limit);
    return this.model
      .find({
        demandid: demandid,
        status:{ $in: status }
      })
      .sort({ _id: 1})
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  listWithPageserch(demandid, page, limit,status,title,version) {
    page = parseInt(page);
    limit = parseInt(limit);
    if(version&&title){
      return this.model
      .find({
        demandid: demandid,
        status:{ $in: status },
        title: new RegExp(title, 'ig'),
        version: new RegExp(version, 'ig'),
      })
      .sort({ _id: 1})
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    }
    if(!version&&title){
      return this.model
      .find({
        demandid: demandid,
        status:{ $in: status },
        title: new RegExp(title, 'ig')
      })
      .sort({ _id: 1})
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    }
    if(version&&!title){
      return this.model
      .find({
        demandid: demandid,
        status:{ $in: status },
        version: new RegExp(version, 'ig')
      })
      .sort({ _id: 1})
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    }
    if(!title&&!version){
      return this.model
      .find({
        demandid: demandid,
        status:{ $in: status }
      })
      .sort({ _id: 1})
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    }
  }
  countSerch(demandid,status,title,version) {
    if(version&&title){
      return this.model
      .countDocuments({
        demandid: demandid,
        status:{ $in: status },
        title: new RegExp(title, 'ig'),
        version: new RegExp(version, 'ig'),
      })
      .exec();
    }
    if(!version&&title){
      return this.model
      .countDocuments({
        demandid: demandid,
        status:{ $in: status },
        title: new RegExp(title, 'ig')
      })
      .exec();
    }
    if(version&&!title){
      return this.model
      .countDocuments({
        demandid: demandid,
        status:{ $in: status },
        version: new RegExp(version, 'ig')
      })
      .exec();
    }
    if(!title&&!version){
      return this.model
      .countDocuments({
        demandid: demandid,
        status:{ $in: status }
      })
      .exec();
    }
  }

  listcheck(demandid) {
    return this.model
      .find({
        demandid: demandid
      })
      .limit(1)
      .exec();
  }
  
  listWithexport(demandid) {
    return this.model
      .find({
        demandid: demandid
      })
      .select('model submodel title preconditions step expect remarks priority status')
      .sort({ add_time: -1})
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
  aggregates(option) {
    return this.model
      .aggregate(
        [
          {$match : option},
          {
            $group : {
              _id : { 
                status: "$status",
                model: "$model"
              },
              count: { $sum: 1 }
            }
          }
        ]
        )
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
  upInterfacecaseid(id, data) {
    return this.model.update(
      {
        _id: id
      },
      {
        interface_caseid:data
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

module.exports = caselib;
