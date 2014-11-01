/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.App = Backbone.View.extend({
  el: '#app',
  template: _.template('<div class="nav"></div><div class="view"></div><div class="footer"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'render','onClose','onKey');
    this.controller = opts.controller;
    this.listenTo(this.controller, 'change:view', this.render);
    $(window).on('keydown', this.onKey);
    this.render();
  },
  onClose: function(){
    $(window).off('keydown', this.onKey);
  },
  onKey: function(e){
    var current = this.controller.get('view_id');
    var index = App.index;
    var prev = null;
    var next = null;
    var ix = 0;
    //console.log(e.which);
    if(e.which === 27){
      this.controller.set({view_id: 'default'});
      App.router.navigate('', {trigger: true});
    }

    if(e.which === 37){
      // prev
      prev = index[0];      
      while(index[ix][0] !== current && ix < index.length){
        prev = index[ix];
        ix ++;
      }
      window.location.href='/' + prev[0];
      //this.controller.set({view_id: prev[0]});
      //App.router.navigate(prev[0], {trigger: true});
    }

    if(e.which === 39 || e.which == 32){
      if(!current){
        this.controller.set({view_id: index[0][0]});
        App.router.navigate(index[0][0], {trigger: true});
        return;
      }
      // next
      prev = index[0];      
      while(index[ix][0] !== current && ix < index.length){
        ix ++;
      }
      ix ++;
      next = index[ix];
      window.location.href='/' + next[0];
      //this.controller.set({view_id: next[0]});
      //App.router.navigate(next[0], {trigger: true});
    }
 
    if(e.which === 32){
      // space - restart
      if(this.views.main.init){
        this.views.main.init();
      }
    }

    if(e.which === 9){
      e.preventDefault();
      // space - restart
      if(this.views.main.toggle){
        this.views.main.toggle();
      }
    }

  },
  render : function() {
   
    var self = this;

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

    // el.on('click', function(){
    //   self.onKey({which: 32});
    // });

    // $('.nav').on('click', function(){
    //   self.onKey({which: 37});
    // });

    el.addClass('view-' + view);

    switch (view){

    case 'default':
      this.views.main = new App.Views.Default({
        el: el
      });

      this.views.footer = new App.Views.Footer({
        el: this.$('.footer')
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
