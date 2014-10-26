/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Footer = Backbone.View.extend({
  template: _.template('<p>@simon_swain</p>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.render();
  },
  render : function(){
    var data = {
    };
    this.$el.html(this.template(data));
  }
});
