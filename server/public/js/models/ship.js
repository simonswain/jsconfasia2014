App.Models.Ship = Backbone.Model.extend({
  defaults: { 

    id: null,
    // ships spawn on planet
    state: 'planet',

    // initial intent is to load population
    intent: 'load',

    name:'Ship', 
    boom: false,
    // in-system position and movement
    x: 0, // system x when in system
    y: 0, // system y when in system
    vx: 0, // system x velocity
    vy: 0, // system y velocity
    a: 0, // angle ship is facing when in system
    v: 0, // velocity
    pr: null, // orbital position radius when at planet
    pa: null, // oribital position angle when at planet

    space_x: null,
    space_y: null,

    pop: 0, //  how many population the ship is carrying
    max_pop: 1000,

    // vector away from planet cw or ccw
    rot: ((Math.random() > 0.5) ? 1 : -1),
    
    // attributes
    jump_speed: 1, // warp drive speed
    jump_range: 1, // warp drive range
    jump_pct: null, // % of jump complete
    thrust: 1, // grav drive power
    laser_power: 1, // laser power
    laser_range: 0.1 + random0to(10)/100, // laser range as fraction of system radius
    laser_accuracy: 5,
    laser: false, // laser firing?
    laser_x: null,
    laser_y: null,
    hit: false, // ship is hit? (for animation)
    missile: 0,
    energy_max: 200,
    energy: 200,
    recharge: 1, //rate of recharge
    power: 5,
    damage: 0,
    shield: 0
  },
  interval: 20,
  initialize: function(vals, opts) {
    _.bindAll(this, 
              'run','runSpace','runPlanet','runSpace',
              'systemPhysics','leavePlanet','boom', 'prepJump', 'doJump','unJump'
             );


    var energy = 200 + random0to(200);
    this.set({
      id: uuid.v4(),
      jump_speed: random1to(5),
      jump_range: random1to(5),
      laser_accuracy: random1to(10),
      laser_power: random0to(20) + 5,
      power: random0to(5),
      thrust: 20 + random1to(50)/10,
      recharge: 1 + ( random1to(10) ) / 10,
      energy_max: energy,
      energy: energy
    });

    // ship belongs to this empire
    this.empire = opts.empire || false;

    // ship is in orbit at this planet (starts with birth planet)
    this.planet = opts.planet || false;

    // ship is in this system
    this.system = opts.system || false;

    this.target_planet = null;
    this.target_system = null;
    this.origin_system = null;

  },
  runPlanet: function(){
    // things to do when the ship is locked in orbit at a planet
    var self = this;
    if(!this.planet){
      return;
    }

    var state = this.get('state');
    var intent = this.get('intent');

    // load up some population

    if(this.planet.empire === this.empire){
      // repaired? cargo? fuel?
      var capacity = this.get('max_pop') - this.get('pop');
      if(capacity > 0){
        var getpop = this.planet.takePop(capacity);
        this.set('pop', this.get('pop') + getpop);
      }
      
      if(this.get('pop') >= this.get('max_pop')){
        // ready to leave
        this.set('intent', 'colonize');
        this.leavePlanet();
        return;
      }
    }


  },
  runSystem: function(){

    // things to do when the ship is in a system
    var self = this;

    // if enemy ships in system, then fight
    if(!this.system){
      return;
    }

    // else go to an unoccupied or enemy planet

    // load up opts to tell physics what to do
    var opts = {
      fight: false,
      jump: false
    }

    // how many enemies in the system
    var enemies;
    enemies = this.system.ships.reduce(function(total, x){
      if(!x){
        return;
      }
      if(x.empire !== self.empire){
        total ++;
      }
      return total;
    }, 0);

    if(enemies > 0){
      opts.fight = true;
    }

    // pick planet in local system to populate
    if(enemies === 0){

      if(this.get('intent') === 'jump'){
        opts.jump = true;
      } else if(!this.target_planet){
        var potentials;
        potentials = this.system.planets.reduce(function(list, planet){
          if(!planet){
            return total;
          }         
          if(planet.empire !== self.empire){
            list.push(planet);
          }
          return list;
        }, []);

        // ship will thrust towards this planet
        if(potentials.length > 0){
          this.target_planet = potentials[random0to(potentials.length)];
          this.set({'intent':'colonize'});
        } else if(this.system.ships.filter(function(x){
          return (x != self && x.empire === self.empire && x.get('intent') === 'patrol');
        }).length > 1){
          // try and jump. if no suitable target then stay on patrol
          if(!self.prepJump()){
            this.set({
              intent: 'patrol'
            });
          }
        } else {
          // no potentials -- keep the system safe unless enough
          // friendlies patrolling? go out-system and colonize
          this.set({
            intent: 'patrol'
          });
        }
      }
    }
    
    this.systemPhysics(opts);
    
  },
  prepJump: function(){

    // select a target, and set jump intent to naviagte to the
    // outersystem

    if(this.get('intent') === 'jump'){
      return;
    }

    var self = this;

    // only if there are other stars present
    if(!this.system.universe){
      return;
    }

    var targets = this.system.universe.systems.filter(function(x){
      return (x !== self.system);
    });

    var targetGroups = _.groupBy(targets, function(system){
      var state;

      var empty = system.planets.reduce(function(total, planet){
        if(!planet.empire){
          total ++;
        }
        return total;
      }, 0);

      var friend = system.planets.reduce(function(total, planet){
        if(planet.empire === self.empire){
          total ++;
        }
        return total;
      }, 0);

      var enemy = system.planets.reduce(function(total, planet){
        if(planet.empire && planet.empire !== self.empire){
          total ++;
        }
        return total;
      }, 0);

      if(empty === system.planets.length){
        return 'empty';
      }

      if(friend > 0 && enemy > 0 && friend + enemy === system.planets.length){
        return 'contested';
      }

      if(friend > 0 && friend < system.planets.length && enemy === 0){
        // partially owned
        return 'partial';
      }

      if(friend === system.planets.length){
        return 'friend';
      }

      if(enemy === system.planets.length){
        return 'enemy';
      }

      if(enemy > 0){
        return 'borderlands';
      }


      return 'mixed';
      
    });

    if(targetGroups.contested){
      // then partially occupied  systems (support our troops)
      targets = targetGroups.contested;
    } else if (targetGroups.partial){
      // continue to colonize partially owned systems
      targets = targetGroups.partial;
    } else if (targetGroups.empty){
      // then try and find an unowned system (colonize the wastelands)
      targets = targetGroups.empty;
    } else if(targetGroups.borderlands){
      // take enemy borderlands
      targets = targetGroups.borderlands;
    } else if (targetGroups.enemy) {
      // then try enemy systems (fight them at home)
      targets = targetGroups.enemy;
    } else {
      // nowhere to go, stay in system. bad luck
      return false;
    }
    //console.log(targetGroups);
    var target = targets[random0to(targets.length)];
    //console.log(targets.length, this.system.get('name'), target.get('name'))

    this.target_system = target;
    this.origin_system = this.system;
    this.target_planet = null;
    this.set({
      intent: 'jump'
    });
    return true;
  },
  doJump: function(){
    // select a target, and set jump intent to naviagte to the
    // outersystem
    this.system.removeShip(this);
    this.system = null;
    this.set({
      state: 'space',
      intent: null,
      jump_pct: 0
    });
    this.origin_system.universe.addShip(this);
  },
  unJump: function(){
    // select a target, and set jump intent to naviagte to the
    // outersystem
    this.origin_system.universe.removeShip(this);

    // position on edge of system closest to origin system

    var theta = G.angle(this.target_system.get('x'), this.target_system.get('y'), this.origin_system.get('x'), this.origin_system.get('y'));
    
    var r = this.target_system.get('radius');
    var x = this.target_system.get('w')/2 - (r * Math.cos(theta));
    var y = this.target_system.get('h')/2 - (r * Math.sin(theta));

    this.system = this.target_system;
    this.target_system = null;
    this.origin_system = null;
    this.target_planet = null;

    this.set({
      state: 'system',
      intent: 'colonize',
      jump_pct: null,
      x: x,
      y: y
    });
    this.system.addShip(this);
  },
  runSpace: function(){
    // things to do when the ship is in deep space
    var ship = this;
    if(!ship.origin_system || ! ship.target_system){
      return;
    }

    var theta = G.angle(ship.target_system.get('x'), ship.target_system.get('y'), ship.origin_system.get('x'), ship.origin_system.get('y'));
    var range = G.distance(ship.target_system.get('x'), ship.target_system.get('y'), ship.origin_system.get('x'), ship.origin_system.get('y'));

    var pct = ship.get('jump_pct');
    pct  += 1;

    if(pct > 100){
      // unjump here
      pct = 100;
      this.unJump();
      return;
    }
    
    var dist = range * (1 - (pct/100));
    
    var space_x = ship.target_system.get('x') - (dist * Math.cos(theta));
    var space_y = ship.target_system.get('y') - (dist * Math.sin(theta));
    
    //console.log(pct, ship.origin_system.get('x'), ship.origin_system.get('y'), ship.target_system.get('x'), ship.target_system.get('y'), Number(space_x.toFixed(2)), Number(space_y.toFixed(2)));

    ship.set({
      jump_pct: pct,
      space_x: space_x,
      space_y: space_y
    });


  },
  boom: function(type, x, y){
    
    if(this.get('boom')){
      return;
    }

    if(!type){
      type = true;
    }

    if(!x){
      x = this.get('x')
    }

    if(!y){
      y = this.get('y')
    }

    this.set({
      x: x,
      y: y,
      boom: type,
      color: this.empire.get('color')
    });
    this.empire.ships.remove(this);

  },
  run: function(){

    var ship = this.toJSON();

    if(ship.boom){
      return;
    }

    var state = this.get('state');
    var intent = this.get('intent');

    ship.hit = false; // consumed by animation
    ship.laser = false;
    ship.laser_x = null;
    ship.laser_y = null;

    // basics
    ship.energy = ship.energy + ( ship.recharge * ( 1 - ( 1 / ship.energy_max ) * ship.damage ) );
    if ( ship.energy > ship.energy_max ) {
      ship.energy = ship.energy_max;
    }

    ship.damage = ship.damage - ship.recharge;

    if ( ship.damage < 0 ) {
      ship.damage = 0;
    }

    // ship is destroyed!
    if (ship.damage > ship.energy_max) {
      this.boom();
      return;
    }


    this.set(ship);
    switch(state){
      case 'planet':      
      this.runPlanet();
      break;

      case 'system':
      this.runSystem();
      break;

      case 'space':
      this.runSpace();
      break;
    }

  },

  enterSystem: function(system){
    this.system.universe.removeShip(this);
    this.system.addShip(this);
    this.system = system;
    this.set({state: 'system'});
  },

  leaveSystem: function(system){
    // this.system.removeShip(this);
    // this.system = null;
    // this.system.universe.addShip(this);
    // this.set({state: 'space'});
  },

  enterPlanet: function(){
    this.planet = planet;
    this.set({state: 'planet'});
    this.planet.ships.add(this);
    this.system.removeShip(this); 
  },

  leavePlanet: function(){    
    if(!this.planet){
      return;
    }
    this.set({
      'x': this.planet.get('x'),
      'y': this.planet.get('y'),
      'state': 'system'
    });
    this.planet.ships.remove(this);
    this.system.ships.add(this);
    this.planet = null;
  },

  spacePhysics: function(){

    // progress towards jump target. If reached, insert at edge of
    // system, at angle of system departed from

  },

  systemPhysics: function(opts){

    if(this.get('boom')){
      return;
    }

    if(!this.system){
      return;
    }

    var self = this;

    if(!opts){
      opts = {};
    }

    var ship = this.toJSON();

    var intent = ship.intent;
    var x, y, a, v, gx, gy, thrust, angle;
    var radius;
    radius = this.system.get('radius');

    ship.x = Number(ship.x);
    ship.y = Number(ship.y);

    ship.vx = 0; //Number(ship.vx);
    ship.vy = 0; //Number(ship.vy);

    ship.vx = Number(ship.vx);
    ship.vy = Number(ship.vy);

    thrust = Number(ship.thrust);

    // star gravity
    this.system.stars.each(
      function(star){

        var g, px, py, angle;

        px = star.get('x');
        py = star.get('y');

        // angle between ship and star
        var theta = G.angle (px, py, ship.x, ship.y);
        // distance between ship and star
        var r = G.distance (ship.x, ship.y, px, py);

        // force of gravity from stars on ship
        g = 600 * ( 5 / ( r * r ) )
        //g = 1000 * ( 50 / ( r * r ) )

        // max gravity
        if ( g > 1 ) {
          g = 1;
        }

        // convert gravity to xy. apply
	ship.vx = ship.vx + g * Math.cos(theta);
	ship.vy = ship.vy + g * Math.sin(theta);

        // thrust vector across star's pull
        angle = de_ra ( ra_de (theta) + (ship.rot * 90) ); 
        var tx = (3 * ship.thrust * g) * Math.cos(angle)
        var ty = (3 * ship.thrust * g) * Math.sin(angle)
        ship.vx = ship.vx + tx;
        ship.vy = ship.vy + ty;

      });


    // planet gravity
    this.system.planets.each(
      function(planet){

        var g, px, py, angle;

        px = planet.get('x');
        py = planet.get('y');

        // angle between ship and planet
        var theta = G.angle (px, py, ship.x, ship.y);
        // distance between ship and planet
        var r = G.distance (ship.x, ship.y, px, py);

        // force of gravity from planets on ship
        g = 200 * ( 5 / ( r * r ) )
        //g = 1000 * ( 50 / ( r * r ) )

        // max gravity
        if ( g > 0.2 ) {
          g = 0.2;
        }
        //console.log(g);

        // convert gravity to xy. apply
	ship.vx = ship.vx + g * Math.cos(theta);
	ship.vy = ship.vy + g * Math.sin(theta);


        // thrust vector across planet's pull
        if(this.target_planet !== planet){
          angle = de_ra ( ra_de (theta) + (ship.rot * 90) ); 
          var tx = (0.2 * ship.thrust * g) * Math.cos(angle)
          var ty = (0.2 * ship.thrust * g) * Math.sin(angle)
          ship.vx = ship.vx + tx;
          ship.vy = ship.vy + ty;
        }

      });

    //find enemy ships and attack
    var fight = function(){

      var c = 0;
      var t = 0;
      var a = 0;       

      ship.laser = false;
      ship.laser_x = null;
      ship.laser_y = null;

      self.system.ships.each(function(model){

        if(model.get('boom') === true){
          return;
        }
        

        // must be in system space
        if(model.get('state') !== 'system'){
          return;
        }

        // friendly
        if(model.empire === self.empire){
          return;
        }       

        var other = model.toJSON();
        var theta = G.angle (other.x, other.y, ship.x, ship.y);
        var range = G.distance (other.x, other.y, ship.x, ship.y);

        // chase or tun
        if(true || range < radius * 0.2){
          c ++;

          // always attack
          a = a + de_ra (ra_de (theta));

          // run away from bigger, chase smaller. if energy < 20%
          // always run
          // if (other.power > ship.power || ship.energy < ship.energy_max * 0.2) {
          //   a = a + de_ra ( ra_de (theta) + 180 );
          // } else { 
          //   a = a + de_ra (ra_de (theta));
          // }
        }

        // enemy in range to shoot?
        if(!ship.laser && range < (2 * radius * ship.laser_range) && ship.energy > ship.energy_max * 0.2 ) {
          // laser uses energy
          ship.energy = ship.energy - 1;
          ship.laser = true;
          var f = ( random1to(2) === 1 ) ? -1 : 1;
          ship.laser_x = other.x + ( f * random1to( 20 - ship.laser_accuracy ) );
          ship.laser_y = other.y + ( f * random1to( 20 - ship.laser_accuracy ) );
          if (G.distance (ship.laser_x, ship.laser_y, other.x, other.y) < radius / 10 ) {
            model.set({
              hit: true,
              energy: Math.max(0, other.energy - ship.laser_power),
              damage: other.damage + ship.laser_power
            });
          }
        }
      });

      if(c>0){
        a = a / c;
        a = a % 360;
	ship.vx = ship.vx + (0.25 * ship.thrust) * Math.cos(a);
	ship.vy = ship.vy + (0.25 * ship.thrust) * Math.sin(a);          
      }

    };
    
    var target_planet = function(){
      var planet = self.target_planet;

      // already colonized?
      if(planet.empire === self.empire){
        self.target_planet = false;
        return;
      }

      var theta = G.angle (planet.get('x'), planet.get('y'), ship.x, ship.y);
      ship.vx += (0.75 * ship.thrust) * Math.cos(theta);
      ship.vy += (0.75 * ship.thrust) * Math.sin(theta);
      var range = G.distance (planet.get('x'), planet.get('y'), ship.x, ship.y);

      // if in range, shoot at target planet to remove population
      if(planet.get('pop') > 0 && range < (radius * 0.05) && ship.energy > ship.energy_max * 0.2) {
        // laser uses energy
        ship.energy = ship.energy - 1;
        ship.laser = true;
        ship.laser_x = planet.get('x');
        ship.laser_y = planet.get('y');
        self.system.booms.push({
          x: planet.get('x'),
          y: planet.get('y'),
          type: 'takeover',
          color: self.empire.get('color'),
          ttl: 10
        });          
        planet.killPop(ship.laser_power);         

        // take over planet, consume ship
        if(!planet.empire || planet.get('pop') === 0){
          // colonize dead planet
          if(planet.get('pop') === 0){
            planet.set({
              pop: ship.pop
            });
          } else {
            // take over unowned planet
            planet.set({
              pop: Number(planet.get('pop')) + ship.pop
            });
          }
          if(planet.empire){
            planet.empire.removePlanet(planet);
          }
          self.empire.addPlanet(planet);
          self.system.booms.push({
            x: planet.get('x'),
            y: planet.get('y'),
            type: 'colonize',
            color: self.empire.get('color'),
            ttl: 10
          });
          self.boom('nop');
          return;
        }
      }
    };



    var jumpzone = function(){
      var theta = G.angle (self.system.get('w')/2, self.system.get('h')/2, ship.x, ship.y) + Math.PI;
      ship.vx += (1.75 * ship.thrust) * Math.cos(theta);
      ship.vy += (1.75 * ship.thrust) * Math.sin(theta);
      var range = (self.system.get('w')/2, self.system.get('h')/2, ship.x, ship.y);
      //if(range > self.system.get('radius') * 0.4){
        self.doJump();
      //}
    };

    if(opts.fight){
      fight();
    }

    if(!opts.fight && this.target_planet){
      target_planet();
    }


    if(opts.jump){
      // fly to jump safe area (outer system)
        self.doJump();
      //jumpzone();
    }

    // // ship thrust based on intent
    
    // // console.log(angle, thrust);
    // if(intent === 'jump'){
    //   // thrust away from planet to get to edge of system
    //   angle = de_ra ( ra_de (theta) + 180 ); 
    //   ship.vx = ship.vx + (0.5 * thrust) * Math.cos(angle);
    //   ship.vy = ship.vy + (0.5 * thrust) * Math.sin(angle);
    // }

    // if(intent === 'jump'){
    // thrust to edge of system in direction of target star (safe jump range)
    // }
    
    // damping
    ship.vx = ship.vx * 0.92;
    ship.vy = ship.vy * 0.92;

    // angle ship is facing from movement vector
    ship.a = ra_de ( G.angle ( 0, 0, ship.vx, ship.vy ) ) - 90;

    ship.x += Number(ship.vx);
    ship.y += Number(ship.vy);

    // stay in system bounds
    if(this.system){
      if ( ship.x < 0 ) {
        ship.x = 0;
      }

      if ( ship.x > this.system.get('w') ) {
        ship.x = this.system.get('w');
      }

      if ( ship.y < 0 ) {
        ship.y = 0;
      }

      if ( ship.y > this.system.get('h') ) {
        ship.y = this.system.get('h');
      }
    }

    this.set({
      x: ship.x,
      y: ship.y,
      vx: ship.vx,
      vy: ship.vy,
      a: ship.a,
      laser: ship.laser,
      laser_x: ship.laser_x,
      laser_y: ship.laser_y
    });
  },

  planetPhysics: function(){
    // orbit, space evenly with other ships in orbit
  },

});

var G = {
  angle: function  ( x1, y1, x2, y2 ) {
    var x = x1 - x2;
    var y = y1 - y2;
    return Math.atan2(y,x);
  },
  distance: function ( x1, y1, x2, y2 ) {
    var x = Math.abs(x1-x2);
    var y = Math.abs(y1-y2);
    return Math.sqrt( (x*x) + (y*y) );
  },
}

function ra_de(r) {
  return r*(180/Math.PI);
}

function de_ra(d) {
  var pi = Math.PI;
  return (d)*(pi/180);
}
