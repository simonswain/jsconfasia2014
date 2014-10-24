App.Models.Universe = Backbone.Model.extend({
  defaults: {
    id: null,
    systemLimit: 5,
    empireLimit: 2,
    name: 'The Universe',
    radius: 512,
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
  interval: 25,
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
    var spacing = this.get('radius') * 0.4;

    var gen = function(max){
      var n = (max * 0.1) + (random.from0upto(max * 0.8));
      return n;
    };


    d = 0;

    if(this.systems.length === 0){
      x = gen(this.get('w'));
      y = gen(this.get('h') * 0.75);
    }
    
    var ok = false;
    while (this.systems.length > 0 && !ok){
      ok = true;
      x = gen(this.get('w'));
      y = gen(this.get('h') * 0.75);
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
      name: GREEK[random0to(GREEK.length-1)] + ' ' + DEMONS[random0to(DEMONS.length-1)],
      universe: this
    });
    this.systems.add(system);
  }
});


var DEMONS = ['gares', 'aim', 'alloces', 'amdusias', 'amon', 'amy', 'andras', 'andrealphus', 'andromalius', 'asmoday', 'astaroth', 'bael', 'balam', 'barbatos', 'bathin', 'beleth', 'belial', 'baalberith', 'bifrons', 'botis', 'buer', 'buné', 'caim', 'cimeies', 'crocell', 'dantalion', 'decarabia', 'eligos', 'focalor', 'foras', 'forneus', 'furcas', 'furfur', 'gäap', 'glasya-labolas', 'gremory', 'gusion', 'häagenti', 'halphas', 'flauros', 'ipos', 'leraje', 'malphas', 'marax', 'marbas', 'marchosias', 'murmur', 'naberius', 'orias', 'orobas', 'osé', 'paimon', 'phenex', 'purson', 'räum', 'ronové', 'sabnock', 'sallos', 'samigina', 'seere', 'shax', 'sitri', 'stolas', 'valac', 'valefor', 'vapula', 'vassago', 'vepar', 'viné', 'vual', 'zagan', 'zepar'];

var GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
