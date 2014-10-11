App.Models.Planet = Backbone.Model.extend({
  defaults: {
    'name':'Unknown Planet',
    'age': 0,
    'interval': 25,
    'x': 0,
    'y': 0,
    'r': 0, // orbit radius
    'a': 0, // orbit angle
    'v': 0.0001, //orbital velocity in degrees
    land: 1000,
    size: 1,

    // non-renewable raw materials
    raw: 0,
    // abount of reource consumee
    consumed: 0,

    agriculture: 0,
    population: 0,
    birthrate: 0.002,
    deathrate: 0.001,

    //
    pollution: 0,
    industry: 0,

    tech: 1,
    credit: 0
  },
  initialize: function(opts) {

    opts = opts || {};

    _.bindAll(this, 'run','stop', 'physics');

    var r, a, v, rr;
    
    r = a = v = 0;

    if(opts.system){    
      rr = opts.system.get('radius');
      r = ((0.1 * rr) + (0.4 *random.from0to(rr))).toFixed(2),
      a = random.from0to(360),
      v = 0.0001 + (random.from0to(100)/10000);
    }

    this.set({
      id: uuid.v4(),
      r: r,
      a: a,
      v: v,
      population: 1000 * random.from1to(10),
      size: 1 * random.from1to(9),
      land: 10000 * random.from1to(10),
      credit: 0,
      raw: 1000000 * random.from1to(10)
    });


    this.system = opts && opts.system || null;
    this.empire = null;
    this.ships = new App.Collections.Ships();
    this.shipcost = 1000;
    this.timer = false;

    this.run();
  },
  run: function(){
    
    this.physics();

    // population growth
    
    var data = this.toJSON();
    var births = data.population * (data.birthrate/100 * (50 + random.from1to(50)));
    var deaths = data.population * (data.deathrate/100 * (50 + random.from1to(50)));
    data.population += births;
    data.population += deaths;

    // population death

    // population consumes ag

    // industry consumes raw

    // industry produces goods

    // ships take population and colonizes

    // ships take ag, raw, goods and sell. profit goes to this planet
    // (ship home planet)

    // planet wants to buy ag, raw, goods depending on stats ('need' factor)

    // Calculate earnings from planet
    var earnings = random.from0to(5);

    this.set({
      population: data.population,
      age: this.get('age') + 1,
      credit: this.get('credit') + earnings
    });

    if(this.system){
      // wrap in check for system so planet can be simmed in isolation

      if(this.system.empire && this.system.ships.length === 0){
        this.spawnShip();
      }

      if(this.system.empire && this.get('credit') > this.shipcost){
        this.spawnShip();
      }

    }

    this.timer = setTimeout(this.run, this.get('interval'));
  },

  physics: function(){

    if(!this.system){
      return;
    }

    var a, r, v, x, y, rr;

    rr = this.system.get('radius');
    var w = this.system.get('w');
    var h = this.system.get('h');

    a = this.get('a');
    r = this.get('r');
    v = this.get('v');
    
    a += v;
    a = a % 360;

    x = ((w/2) + r * Math.cos(a)).toFixed(2);
    y = ((h/2) + r * Math.sin(a)).toFixed(2);

    this.set({
      a: a,
      x: x,
      y: y
    });

  },
  spawnShip: function(){

    var x, y;

    x = random.from0upto(this.system.get('radius'));
    y = random.from0upto(this.system.get('radius'));

    // calculate desired ship
    var shipcost = this.shipcost;

    this.set({
      credit: this.get('credit') - shipcost
    });

    console.log(' @ Spawn ' + this.system.get('name') + ':' + this.get('name') + ':' + this.system.empire.get('name'));

    var ship = new App.Models.Ship({
      state: 'system',
      ux: this.system.get('x'),
      uy: this.system.get('y'),
      x: x,
      y: y
    }, {
      empire: this.system.empire,
      planet: this
    })

    this.ships.add(ship);

    if(this.system){
      this.system.ships.add(ship);
    }

    if(this.empire){
      this.system.empire.ships.add(ship);
    }

  },
  stop: function(){
  }
});

