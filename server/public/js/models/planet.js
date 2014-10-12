App.Models.Planet = Backbone.Model.extend({
  defaults: {
    'name':'Unknown Planet',
    'age': 0,
    'interval': 100,
    'x': 0,
    'y': 0,
    'r': 0, // orbit radius
    'a': 0, // orbit angle
    'v': 0.0001, //orbital velocity in degrees
    size: 1, // size for drawing

    land: 1000, // available area
    agr: 0,
    pop: 0,
    birthrate: 0.002,
    deathrate: 0.001,

    //
    pol: 0,
    ind: 0,
    cr: 0,

    // deltas from last tick
    d_pop: 0,
    d_agr: 0,
    d_ind: 0,
    d_pol:0,
    d_cr:0,

    out_agr: 0,
    out_ind: 0
  },
  initialize: function(opts) {

    opts = opts || {};

    _.bindAll(this, 'run', 'stop', 'physics');

    var r, a, v, rr;
    r = 0;
    a = 0;
    v = 0;

    if(opts.system){    
      rr = opts.system.get('radius');
      r = ((0.1 * rr) + (0.4 *random.from0to(rr))).toFixed(2),
      a = random.from0to(360),
      v = 0.0001 + (random.from0to(100)/10000);
    }

    var land = 10000 * random.from1to(10);

    this.set({
      id: uuid.v4(),
      r: r,
      a: a,
      v: v,
      pop: (15 + random.from1to(25)) * land/100,
      agr: (15 + random.from1to(25)) * land/100,
      ind: (5 + random.from1to(5)) * land/100,
      pol: 0,
      size: 1 * random.from1to(9),
      land: land,
      cr: 0,
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

    // 'POP + IND + AGR cannot exceed Size of Planet',
    // 'POP has birthrate and deathrate',
    // 'IND increases POL',
    // 'POL increases deathrate',
    // 'IND output is ~ POP',
    // 'IND increases AGR',
    // 'POP is limited by AGR',
    // 'IND creates credit to make Ships',
    // 'Suplus POP will leave via ship',
    // 'IND & AGR can be traded'

    
    var data = this.toJSON();

    // pollution recovery
    data.pol = data.pol * 0.98;

    data.pol += ((data.ind + data.pop) / data.land)  * 0.2;
    if (data.pol >= 100){
      data.pol = 100;
    }

    var births = data.pop * (data.birthrate/100 * (50 + random.from1to(50)));
    var deaths = data.pop * (data.deathrate/100 * (50 + random.from1to(50)));

    births = 0;
    deaths = 0;
   
    deaths += 0.5 * data.pop * (data.pol/100);

    // use tech to increase efficiency

    // pollution reduces ag output
    data.out_agr = data.agr * (1 - (data.pol/100));

    data.pop += births;
    data.pop -= deaths;

    if(data.pop > data.out_agr){
      deaths -= data.pop - data.out_agr;
      data.pop = data.out_agr;
    }


    data.d_pop = births + deaths;

    // pop and ind creates pol, expressed as a percentage of total
    // environmental destruction

    // output is reduced by this percentage

    // pollution recovery


    // pop consumes ag

    // ind consumes raw

    // ind produces goods

    // ships take pop and colonizes

    // ships take ag, raw, goods and sell. profit goes to this planet
    // (ship home planet)

    // planet wants to buy ag, raw, goods depending on stats ('need' factor)

    // Calculate earnings from planet
    var earnings = ((data.ind / 1000) * (data.pop / 1000)) * ((50 + random0to(50))/100);

    data.d_cr = earnings;
    data.cr += earnings;
    data.age ++;


    // enough credit spawns ships to carray away pop

    this.set(data);

    if(this.system){
      // wrap in check for system so planet can be simmed in isolation

      if(this.system.empire && this.system.ships.length === 0){
        this.spawnShip();
      }

      if(this.system.empire && this.get('cr') > this.shipcost){
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
      cr: this.get('cr') - shipcost
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

