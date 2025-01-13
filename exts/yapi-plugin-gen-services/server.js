const controller = require('./controller');

// const mongoose = require('mongoose');
// const _ = require('loadsh');

module.exports = function(){
  this.bindHook('add_router', function(addRouter){
    // @feat: serives 
    addRouter({
      controller: controller,
      method: 'get',
      prefix: '/open',
      path: 'export-full',
      action: 'exportFullData'
    });
  })

}