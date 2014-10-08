/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.App = Backbone.View.extend({
  el: '#app',
  template: _.template('<div class="view"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render');
    this.controller = opts.controller;
    this.listenTo(this.controller, 'change:view', this.render);
    this.render();
  },
  render : function() {

    _.each(this.views, function(x){
      x.close();
    });

    this.views = {};

    $(this.el).html(this.template());

    this.views.nav = new App.Views.Nav({
      el: this.$('.nav'),
      controller: this.controller
    });

    var view = this.controller.get('view');
    var view_id = this.controller.get('view_id');

    var el = this.$('.view');
    el.addClass('view-' + view);

    switch (view){

    case 'default':
      this.views.main = new App.Views.Default({
        el: el
      });
      break;

    case 'view':
      if(App.Views.hasOwnProperty(view_id)){
        this.views.main = new App.Views[view_id]({
          el: el
        });
      }
      break;

    default:
      this.views.main = new App.Views.Default({
        el: el,
        router: this.router
      });
      break;
    }

  }
});
