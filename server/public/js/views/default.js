/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.Default = Backbone.View.extend({
  template: _.template('<div class="content"><h1>Deep Space</h1>\
<ul class="toc">\
<% _.each(pages, function(x) { %><li><a href="/<%= x[0] %>" class="<%= x[2] %>"><%= x[1] %></a><% }); %>\
</ul>\
</div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.render();
  },
  render: function() {

    var data = {};

    var pages = App.index;

    data.pages = _.map(pages, function(x){
      x[2] = ''
      if(x[0] !== '' && App.Views.hasOwnProperty(x[0])){
        x[2] = 'available';
      }
      return x;
    });
    this.$el.html(this.template(data));
  }
});
