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


App.index = [
  
  // all animations auto start, auto add, auto restart after xx seconds

  // We are going to look at how simple rules can make complex things

  ['testpattern', 'Test Pattern'],
  //['emergence', 'Emergence'],
  
  ['rules_of_life', 'Rules of Life'],
  ['life', 'Life'],
  //['species_of_life', 'Species of Life'],
  ['life_hd', 'Life HD'],

  ['game_loop', 'Game Loop'],

  ['rules_of_boid', 'Boid'],
  ['boids', 'Boids'],
  ['boids_and_predators', 'Boids and Predators'],

  ['raf', 'RaF'],            // explain Canvas and RaF
  
  ['rules_pf_gravity', 'The Physics of Gravity'], // explain physics of gravity (diagram, vectors)
  ['gravity', 'Gravity'],  // like click to add a ship from codepen

  ['orbiting_planets', 'Orbiting Planets'], // we fake gravity for the planets
  ['orbiting_planets_with_ships', 'Orbiting With Ships'], // but the ships respect gravity

  ['canvas', 'HTML5 Canvas'],

  ['rules_of_ships', 'Rules of Ships'], // Show single ship. JS object illustrate params
  ['ship_behaviour', 'Make the ship behave'], // Chase, run, laser, missile
  ['fighting_ships', 'Fighting Ships'], // in the orbiting planets


  // simulating life

  ['rules_of_ecology', 'Ecology'],   // 
  ['foxes_and_rabbits', 'Foxes and Rabbits'],  // 
  //['foxes_rabbits_grass', 'Foxes, Rabbits and Grass'], // http://www.shodor.org/interactivate/activities/RabbitsAndWolves/

  // http://en.wikipedia.org/wiki/Prospective_Outlook_on_Long-term_Energy_Systems

  // http://en.wikipedia.org/wiki/World3

  ['rules_of_economics', 'Economy'], // make the stats interplay (sliding charts from codepen) change over time, exonomic cycles

  ['make_planet', 'Make a planet'], // what makes up a planet? Show the stats.
  
  // show three planets trading
  ['surplus_and_deficit', 'Trade and Commerce'], // create some surplus and deficit for the same of the game
  // now it has motivation to send ships out to do things

  // Lets make some space
  ['make_system', 'Make a System'], // star with random number of orbitin planets (sped up). 'next' key zooms in to a planet as lead in to next slide
  // zoom back out to the system. Ships spawn from planet, travel to other planet in sustem

  // planet, orbit and outer system ownership??
  // Ships have a motivation to comquer, colonize or trade

  // planet, orbit and outer system ownership??
  // Ships have a motivation to comquer, colonize or trade
  // colonization

  ['make_empires', 'Make Empires'], 

  ['make_stars', 'Make Stars'], 
  // random starfield. Auto zoom, pan (pick system at random, easing), different density on randomisation; explain spacing algorithm. 'next' key zooms in to a star as lead in to next slide
  
 
  ['make_war', 'Make War'], // lets tweak our ship a bit. Add jump range and speed.

  ['make_universe', 'Make it Big'] // how to run serverside and across multiple machines (theory and challenge)
];

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
