const baseModel = require('models/base.js');

class larkRobotModel extends baseModel {
    getName() {
        return 'lark_robots';
    }

    getSchema() {
        return {
            project_id: {type: Number, required: true},
            created_by_uid: {type: Number, required: true},
            updated_by_uid: {type: Number, default: 0},
            // hooks: Array,
            hooks:[{ url: String, options: Array,open:{type:Boolean,default:false}}],
            created_at: Number,
            updated_at: Number
        };
    }

    save(data) {
        let m = new this.model(data);
        return m.save();
    }

    getByProejctId(id) {
        return this.model.findOne({
            project_id: id
        }).exec();
    }

    update(id, data) {
        return this.model.update(
            {
                _id: id
            },
            data,
            { runValidators: true }
        );
    }
}

module.exports = larkRobotModel;
