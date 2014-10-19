App.Models.System = Backbone.Model.extend({
  defaults: {
    id: null,
    name: 'Unknown System',
    color: '#fff',
    radius: 1024,
    w: 1024,
    h: 1024,
    x: null,
    y: null
  },
  interval: 25,
  initialize: function(opts) {
    _.bindAll(this, 'run','addPlanet','initPlanets');

    this.universe = opts.universe || false;

    this.set({
      id: uuid.v4()
    });

    this.starCount = 1;

    this.planetCount = random.from1to(3) + 1;

    this.stars = new App.Collections.Stars();
    this.planets = new App.Collections.Planets();
    this.ships = new App.Collections.Ships([]);
    this.booms = [];

    this.initStars();
    this.initPlanets();

    this.run();
    this.ticks ++;

  },
  run: function(){
    var self = this;
    this.ships.each(function(ship){
      if(!ship){
        return;
      }
      if(ship.get('boom')){
        self.booms.push({
          x: ship.get('x'),
          y: ship.get('y'),
          color: ship.get('color'),
          ttl: 5,
          type: ship.get('boom')
        });
        self.ships.remove(ship);
      }
    });
    this.ships.each(function(ship){
      // ship has gone(eg jumped)
      if(!ship){
        return;
      }
      ship.run();
    });
    this.timer = setTimeout(this.run, this.interval);
  },
  initStars: function(){

    while(this.stars.length < this.starCount){
      this.addStar();
    }

    this.timer = false;
    this.run();

  },

  addStar: function(i){

    // only allowing one star, in the center of the system for now,
    // but keeping in collection to we can have more later

    var self = this;

    var x, y;

    if(this.stars.length === 0){
      x = this.get('w')/2;
      y = this.get('h')/2;
    }

    var star = new App.Models.Star({
      x: x,
      y: y,
      name: 'Star',
      system: this
    });

    this.stars.add(star);
  },

  initPlanets: function(){
    while(this.planets.length < this.planetCount){
      this.addPlanet();
    }
  },

  addPlanet: function(i){
    var planet = new App.Models.Planet({
      name: 'Planet ' + String(Number(this.planets.length + 1)),
      system: this
    });
    this.planets.add(planet);
  },
  
  addShip: function(ship){
    this.ships.add(ship);
  },

  removeShip: function(ship){
    this.ships.remove(ship);
  },

  // fake ship created in system
  spawnShip: function(){

    var x, y;

    x = random.from0upto(this.get('radius'));
    y = random.from0upto(this.get('radius'));

    var ship = new App.Models.Ship({
      state: 'system',
      x: random0to(this.get('w')),
      y: random0to(this.get('h'))
    }, {
      system: this,
    });

    this.ships.add(ship);

  }

});
