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

    var pages = [
      
      // all animations auto start, auto add, auto restart after xx seconds

      // We are going to look at how simple rules can make complex things

      ['testpattern', 'Test Pattern'],
      ['emergence', 'Emergence'],
      
      ['life', 'Life'],
      ['life_hd', 'Life HD'],
      ['rules_of_life', 'Rules of Life'],
      ['species_of_life', 'Species of Life'],

      ['game_loop', 'Game Loop'], // tick, render, how to make life

      ['boid', 'Boid'],
      ['boids', 'Boids & Flocking'],
      ['boids_and_predators', 'Boids and Predators'],

      ['raf', 'RaF'], // explain Canvas and RaF
      
      ['gravity', 'Gravity'], // like click to add a ship from codepen
      ['gravity_physics', 'The Physics of Gravity'], // explain physics of gravity (diagram, vectors)
      ['orbiting_planets', 'Orbiting Planets'], // we fake gravity for the planets
      ['orbiting_planets_with_ships', 'Orbiting With Ships'], // but the ships respect gravity

      ['ship', 'What can we do with a ship?'], // Show single ship. JS object illustrate params
      ['ship_behaviour', 'Make the ship behave'], // Chase, run, laser, missile
      ['fighting_ships', 'Fighting Ships'], // in the orbiting planets

      // two quick asides -- nerdy hobbies of the 80's
      ['adnd', 'AD&D'], // complex, messy, different rules for everything
      ['traveller', 'Traveller'], // clean, orthogonal, systematic, nicely designed
      ['starmaps', 'Sectors, Sectors, Systems, Planets'], // forms and images from traveller books

      // Lets make some space
      ['make_stars', 'Lets make some stars'], // random starfield. Auto zoom, pan (pick system at random, easing), different density on randomisation; explain spacing algorithm. 'next' key zooms in to a star as lead in to next slide
      ['make_system', 'Lets make a System'], // star with random number of orbitin planets (sped up). 'next' key zooms in to a planet as lead in to next slide



      ['foxes_and_rabbits', 'Foxes and Rabbits'], // haha fooled you. not going to show you the planet just yet
      ['foxes_rabbits_grass', 'Foxes, Rabbits and Grass'], // http://www.shodor.org/interactivate/activities/RabbitsAndWolves/
      // the world simulation thing

      // http://en.wikipedia.org/wiki/Prospective_Outlook_on_Long-term_Energy_Systems

      ['make_planet', 'Lets make a planet'], // what makes up a planet? Show the stats.
      ['make_economy', 'Lets make an economy'], // make the stats interplay (sliding charts from codepen) change over time, exonomic cycles
      ['', 'Lets make it interesting'], // create some surplus and deficit for the same of the game
      // now it has motivation to send ships out to do things


      ['', 'Spaceward Ho!'], // zoom back out to the system. Ships spawn from planet, travel to other planet in sustem
      ['', 'How to own a planet'], // planet, orbit and outer system ownership??
      ['', 'Tech Up'], // lets tweak our ship a bit. Add jump range and speed.
      ['', 'To The Stars...'], // Ships start forming trade routes
      ['', 'Motivated Empires'], // Ships have a motivation to comquer, colonize or trade

      ['', 'Make it Big'] // how to run serverside and across multiple machines (theory and challenge)
    ];
    
    
    

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
