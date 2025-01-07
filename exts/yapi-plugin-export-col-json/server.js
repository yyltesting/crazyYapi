const exportColjSONController = require('./controller');

module.exports = function(){
    this.bindHook('add_router', function(addRouter){
        addRouter({
            controller: exportColjSONController,
            method: 'get',
            path: 'exportColJson',
            action: 'exportColData'
        })
    })
}