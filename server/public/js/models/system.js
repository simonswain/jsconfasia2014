App.Models.System = Backbone.Model.extend({
  defaults: {
    id: null,
    name: 'Unknown System',
    color: '#fff',
    radius: 768,
    w: 1024,
    h: 768,
    x: null,
    y: null,
    // for demo modes set to false
    max_empire_ships: 2,
    enabled_easy_spawn: false,
    enabled_fight: true,
    enabled_colonize: true
  },
  interval: 25,
  initialize: function(opts) {
    _.bindAll(this, 'run','addPlanet','initPlanets');

    this.universe = opts.universe || false;

    this.set({
      id: uuid.v4()
    });

    this.starCount = 1;
    if(opts.planetCount){
      this.planetCount = opts.planetCount;
    } else {
      this.planetCount = random.from1to(3) + 1;
    }

    this.stars = new App.Collections.Stars();
    this.planets = new App.Collections.Planets();
    this.ships = new App.Collections.Ships([]);
    this.booms = [];

    this.empire = null;

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
        var ttl = 10;
        var type = ship.get('boom');
        if(type === 'ship'){
          ttl = 20;
          // additional boom for ship
          self.booms.push({
            x: ship.get('x'),
            y: ship.get('y'),
            color: 'rgba(255, 255, 255, 0.7)',
            ttl: 5
          });
        }
        self.booms.push({
          x: ship.get('x'),
          y: ship.get('y'),
          color: ship.get('color'),
          ttl: ttl,
          type: type
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

    var empires = _.uniq(this.planets.map(function(planet){
      return planet.empire;
    }));

    if(empires.length === 1 && empires[0] !== null){
      this.empire = empires[0];
      this.empire.addSystem(this);
    } else {
      if(this.empire){
        this.empire.removeSystem(this);
      }
      this.empire = null;
    }


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
    this.planets.sort();
    // rename planets in order
    this.planets.each(function(x, i){
    var name = NATO[i];
      name = name.substr(0,1).toUpperCase() + name.substr(1);
      x.set({
        name: name
      });
    });
  },

  addPlanet: function(i){
    var name = NATO[this.planets.length];
    name = name.substr(0,1).toUpperCase() + name.substr(1);
    var planet = new App.Models.Planet({
      name: name,
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

var NATO = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu'];

