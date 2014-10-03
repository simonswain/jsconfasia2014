/*global Backbone:true,  _:true, $:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

$(function(){
  App.start();
});

Backbone.View.prototype.close = function(){
  this.stopListening();
  if (this.onClose){
    this.onClose();
  }
  this.remove();
};

var App = {
  Models: {},
  Collections: {},
  Views: {},
  start: function(){

    this.controller = new App.Models.Controller({
    });

    this.socket = new App.Socket({
      controller: this.controller,
      auth: this.auth
    });

    this.router = new App.Router();

    this.views = {
      app: new App.Views.App({
        controller: this.controller
      })
    };

    Backbone.history.start({pushState: true});

    $(document).on("click", "a:not([data-bypass])", function(e) {
      var href = $(this).attr("href");
      var protocol = this.protocol + "//";
      if (href.slice(0, protocol.length) !== protocol) {
        e.preventDefault();
        App.router.navigate(href, true);
      }
    });
  }
};

/*global Backbone:true,  _:true, $:true, App:true */
/*jshint browser:true */
/*jshint strict:false */

App.Router = Backbone.Router.extend ({
  routes: {
    "": "default",
    ":view": "view",
    "*default": "default"
  },

  setView: function(view, id){
    if(!id){
      id = null;
    }
    App.controller.set({
      view: view,
      view_id: id
    });
  },

  default: function() {
    this.setView('default');
  },

  view: function(id) {
    this.setView('view', id);
  }

});
