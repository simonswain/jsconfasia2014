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
    birthrate: random0to(200) * 0.0005,
    deathrate: 0.001,
    shipcost: 5000,
    //
    pol: 0,
    ind: 0,
    cr: 1000,

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

    _.bindAll(this, 'run', 'physics','takePop','spawnShip','addShip','removeShip');

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
      size: 2 + random.from0to(3),
      land: land,
      cr: 1000,
      shipcost: 2500 + random0to(2500)
    });


    this.system = opts && opts.system || null;
    this.empire = null;
    this.ships = new App.Collections.Ships([]);
    this.timer = false;
    this.run();
  },
  run: function(){

    var self = this;
    this.ships.each(function(x){
      if(!x){
        return;
      }
      x.run();
    });

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

    if(this.empire){
      // Calculate earnings from planet
      var earnings = ((data.ind / 1000) * (data.pop / 1000)) * ((50 + random0to(50))/100);

      data.d_cr = earnings;
      data.cr += earnings;
    }

    data.age ++;

    // enough credit spawns ships to carray away pop

    this.set(data);

    if(this.empire){

      // wrap in check for system so planet can be simmed in isolation

      // if(this.system.empire && this.system.ships.length === 0){
      //   this.spawnShip();
      // }

      if(this.get('cr') > this.get('shipcost')){
        this.spawnShip();
      }

    }

    this.timer = setTimeout(this.run, this.get('interval'));
  },
  takePop: function(max){
    // up to 10% of pop, or max
    var pop = Math.floor(this.get('pop') * 0.1);
    pop = Math.min(pop, max);
    this.set('pop', this.get('pop') - pop);
    return pop;
  },
  killPop: function(n){
    var pop = this.get('pop');
    var before = pop;
    pop = Math.max(0, pop - n*10);
    if(pop<0){
      pop = 0;
    }
    this.set({'pop': pop});
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
  addShip: function(ship){
    this.ships.add(ship);
  },

  removeShip: function(ship){
    this.ships.remove([ship]);
  },
  spawnShip: function(){

    var self = this;

    // use the money no matter what
    this.set({
      cr: this.get('cr') - this.get('shipcost')
    });

    var friends = this.system.ships.filter(function(x){
      return (x.empire === self.empire);
    });
    
    if(friends.length > 2){
      return;
    }

    // calculate desired ship
    
    //console.log(' @ Spawn ' + this.system.get('name') + ':' + this.get('name') + ':' + this.empire.get('name'));
    
    var ship = new App.Models.Ship({
      state: 'planet',
      x: this.get('x'),
      y: this.get('y')
    }, {
      empire: this.empire,
      system: this.system,
      planet: this
    });

    // add to planet's ships
    this.addShip(ship);
    
    // add to planets empire
    this.empire.addShip(ship);

  }
});
