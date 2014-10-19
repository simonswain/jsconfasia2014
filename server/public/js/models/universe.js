App.Models.Universe = Backbone.Model.extend({
  defaults: {
    id: null,
    systemLimit: 5,
    empireLimit: 2,
    name: 'The Universe',
    radius: 1024,
    w: 1024,
    h: 1024,
  },
  initialize: function(opts) {
    _.bindAll(this, 'run', 'addSystem','addShip', 'initSystems','addEmpire');
    this.systems = new App.Collections.Systems();
    this.empires = new App.Collections.Empires();
    // ships in jump space
    this.ships = new App.Collections.Ships();
    this.initSystems();
    this.run();
  },
  interval: 250,
  run: function(){
    var self = this;
    this.ships.each(function(ship){
      if(!ship){
        return;
      }
      ship.run();
    });
    this.timer = setTimeout(this.run, this.interval);
  },
  addShip: function(ship){
    this.ships.add(ship);
  },
  removeShip: function(ship){
    this.ships.remove(ship);
  },
  initSystems: function(){
    while(this.systems.length < this.get('systemLimit')){
      this.addSystem();
    }
  },
  addEmpire: function(opts){
    var empire;
    empire = new App.Models.Empire(opts);
    this.empires.add(empire);
    var system;;
    var planet;
    var ok = false;
    while(!ok){
      system = this.systems.at(random0to(this.systems.length));
      planet = system.planets.at(random0to(system.planets.length));
      if(!planet.empire){
        empire.addPlanet(planet);
        ok = true;
      }
    }
    return empire;
  },
  addSystem: function(i){

    var self = this;
    
    var x, y;
    var d;
    var spacing = this.get('radius') * 0.2;

    var gen = function(max){
      return (max * 0.1) + random.from0upto(max * 0.55);
    };


    d = 0;

    if(this.systems.length === 0){
      x = gen(this.get('w'));
      y = gen(this.get('h'));
    }
    
    var ok = false;
    while (this.systems.length > 0 && !ok){
      ok = true;
      x = gen(this.get('w'));
      y = gen(this.get('h'));
      self.systems.each(function(p){
        var dx = Math.abs(p.get('x') - x);
        var dy = Math.abs(p.get('y') - y);
        var dd = Math.sqrt((dx*dx) + (dy*dy));
        if (dd < spacing){
          ok = false;
        }
      });
    }

    var system = new App.Models.System({
      x: x,
      y: y,
      name: 'System ' + String(Number(this.systems.length + 1)),
      universe: this
    });
    this.systems.add(system);
  }
});
