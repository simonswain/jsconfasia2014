App.Models.Universe = Backbone.Model.extend({
  defaults: {
    id: null,
    systemLimit: 5,
    systemGrid: 7,
    empireLimit: 2,
    name: 'The Universe',
    radius: 512,
    w: 1024,
    h: 1024,
  },
  initialize: function(opts) {
    _.bindAll(this, 'run', 'addShip', 'initSystems', 'addEmpire');
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
    var self = this;
    var len = this.get('systemLimit');
    var grid = this.get('systemGrid');

    var w = this.get('w');
    var h = this.get('h');

    var q = [];
    var n;
    while (q.length < len){
      n = random0to(grid);
      if(q.indexOf(n)!== -1){
        continue;
      }
      q.push(n);
    }
    
    q.forEach(function(pos){
      var x, y;
      if(pos < 2){
        y = h * 0.3;
        x = w * 0.42;
        if(pos === 1){
          x = w * 0.735;
        }
      } else if(pos < 5){ 
        y = h * 0.5;
        x = w/2 - w/4 + ((pos - 2) * w/3);
      } else{
        y = h * 0.315;
        x = w/2 - w/4 + ((pos - 2) * w/3);
      }

      if(pos > 4){
        y = h * 0.7;
        x = w * 0.42;
        if(pos === 6){
          x = w * 0.735;
        }
      }

      var system = new App.Models.System({
        x: x,
        y: y,
        name: GREEK[random0to(GREEK.length-1)] + ' ' + DEMONS[random0to(DEMONS.length-1)],
        universe: self
      });
      self.systems.add(system);
    });

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
  }
});


var DEMONS = ['gares', 'aim', 'alloces', 'amdusias', 'amon', 'amy', 'andras', 'andrealphus', 'andromalius', 'asmoday', 'astaroth', 'bael', 'balam', 'barbatos', 'bathin', 'beleth', 'belial', 'baalberith', 'bifrons', 'botis', 'buer', 'buné', 'caim', 'cimeies', 'crocell', 'dantalion', 'decarabia', 'eligos', 'focalor', 'foras', 'forneus', 'furcas', 'furfur', 'gäap', 'glasya-labolas', 'gremory', 'gusion', 'häagenti', 'halphas', 'flauros', 'ipos', 'leraje', 'malphas', 'marax', 'marbas', 'marchosias', 'murmur', 'naberius', 'orias', 'orobas', 'osé', 'paimon', 'phenex', 'purson', 'räum', 'ronové', 'sabnock', 'sallos', 'samigina', 'seere', 'shax', 'sitri', 'stolas', 'valac', 'valefor', 'vapula', 'vassago', 'vepar', 'viné', 'vual', 'zagan', 'zepar'];

var GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
