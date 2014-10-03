/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.life = Backbone.View.extend({
  template: _.template('<div class="canvas"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.render();
    
    


  },
  onClose: function(){
   
  },
  render : function(){
    var data = {}
    this.$el.html(this.template(data));
  }
});
