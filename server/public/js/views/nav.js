/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Nav = Backbone.View.extend({
  template: _.template('<a href="/" class="top"></a>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.controller = opts.controller;
    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
  },
  render : function(){
    var data = {}
    this.$el.html(this.template(data));
  }
});
