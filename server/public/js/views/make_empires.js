/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.make_empires = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'onClose', 'render', 'start', 'stop', 'draw', 'tick');
    this.render();
    $(window).on('resize', this.render);
  },
  onClose: function(){
    $(window).off('resize', this.render);
    this.stop();
  },
  draw: function(){

    var self = this;

    if(!this.running){
      return;
    }

    var ctx = this.cview.getContext('2d');
    var ctxfx = this.fxview.getContext('2d');

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);
    
    var xw = this.w/8;
    var xh = this.h/8;
    var xx = Math.min(this.w, this.h)/8;
    // draw here

    // scale for drawing elements within a system
    var scale = xx / Math.min(this.w, this.h)



    this.universe.systems.each(function(system){

      var data = system.toJSON();

      // center of system
      var cx = data.x;
      var cy = data.y;

      // top left of system
      var lx = data.x - xx;
      var ly = data.y - xx;

      var systemBorder = function(){
        var colors = [];
        system.planets.each(function(planet){
          if(!planet.empire){
            colors.push(false);
            return;
          }
          colors.push(planet.empire.get('color'));
        });

        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#888';
        if(_.uniq(colors).length === 1 && colors[0]){
          // if this empire owns the whole system, draw it in their color
          ctx.strokeStyle = colors[0];
        }

        var r = Math.min(self.w, self.h);
        ctx.lineWidth = xw/32;
        ctx.beginPath();
        ctx.arc(data.x, data.y, xx, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
      }();


      // ctx.rect(data.x - xx, data.y - xx, xx * 2, xx * 2);
      // ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '10pt arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.name, data.x, data.y + xx*1.5);
      // count of ships in system
      ctx.fillText(system.ships.length, data.x, data.y + xx*1.25);

      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(scale*1.5, scale*1.5);
      
      ctx.strokeStyle = '#fff';

      system.stars.each(function(star){
        var data = star.toJSON();
        ctx.fillStyle = data.color;
        ctx.strokeStyle = data.color;
        var p = 12;
        var r = data.size * xw/24;
        var m = 0.7;
        ctx.save();
        ctx.beginPath();
        ctx.translate(data.x, data.y);
        ctx.moveTo(0,0-r);
        for (var i = 0; i < p; i++) {
          ctx.rotate(Math.PI / p);
          ctx.lineTo(0, 0 - (r*m));
          ctx.rotate(Math.PI / p);
          ctx.lineTo(0, 0 - r);
        }
        ctx.fill();
        ctx.restore();
      });

      system.planets.each(function(planet){
        var data = planet.toJSON();
        data.x = Number(data.x);
        data.y = Number(data.y);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        if(planet.empire){
          ctx.strokeStyle = planet.empire.get('color');
          ctx.fillStyle = planet.empire.get('color');
        }
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(data.x, data.y, xw/24 * data.size*2, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.stroke();
      });

      system.ships.each(function(ship){
        var data = ship.toJSON();
        var z = xw/4;
        ctx.fillStyle = ship.empire.get('color');
        ctx.strokeStyle = ship.empire.get('color');

        ctx.save();
        ctx.translate(data.x, data.y);        
        // rotate 45 degrees clockwise
        ctx.rotate(de_ra(data.a));

        ctx.lineWidth = z/2;
        ctx.fillStyle = data.color;
        ctx.strokeStyle = data.color;
        ctx.beginPath();
        ctx.moveTo(0, -1.5*z);
        ctx.lineTo(z, z);
        ctx.lineTo(0, 0);
        ctx.lineTo(-z, z);
        ctx.lineTo(0, -1.5*z);
        ctx.closePath();     
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

    });


    // empire stats

    var yy = xh/2;

    ctx.font = 'bold 10pt arial';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('ships', 1 * xw, yy);
    ctx.fillText('planets', 2 * xw, yy);
    ctx.fillText('systems', 3 * xw, yy);

    self.universe.empires.each(function(empire){
      yy += xh/4;
      ctx.fillStyle = empire.get('color');
      ctx.textAlign = 'center';
      ctx.fillText(empire.ships.length, 1 * xw, yy);
      ctx.fillText(empire.planets.length, 2 * xw, yy);
      ctx.fillText(empire.systems.length, 3 * xw, yy);

      ctx.textAlign = 'left';
      ctx.fillText(empire.get('name'), 4 * xw, yy);
    });

    // ships in jumpspace
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12pt arial';
    ctx.textAlign = 'right';
    ctx.fillText(this.universe.ships.length, this.w - xw, xh);


    // draw jumplines from source to target
    this.universe.ships.each(function(ship){

      if(!ship.origin_system || ! ship.target_system){
        return;
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; //ship.empire.get('color');
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(ship.origin_system.get('x'), ship.origin_system.get('y'));
      ctx.lineTo(ship.target_system.get('x'), ship.target_system.get('y'));
      ctx.stroke();
      ctx.closePath();     

      ctx.fillStyle = ship.empire.get('color');
      ctx.beginPath();
      ctx.arc(ship.get('space_x'), ship.get('space_y'), xw/16, 0, 2 * Math.PI, true);
      ctx.fill();
      ctx.closePath();     

    });



    //

    ctx.restore();
    ctxfx.restore();

    this.requestId = window.requestAnimationFrame(this.draw);

  },
  tick: function(){

    var self = this;

    if(!this.running){
      return;
    }

    // tick here



    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.universe = new App.Models.Universe();
    this.universe.addEmpire({
      name: 'Meat Eaters',
      color: '#0c0'
    });

    this.universe.addEmpire({
      name: 'Criminal Element',
      color: '#cc0'
    });

    this.period = 100;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);

    // restart every 20s
  },
  stop: function(){
    this.running = false;
    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    if(this.requestId){
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  },
  fitToView: function(){
    var sx = this.cw / this.w;
    var sy = this.ch / this.h;
    this.scale = Math.min(sx, sy);

    this.x = (this.cw / 2) - ((this.w * this.scale)/2);
    this.y = (this.ch / 2) - ((this.h * this.scale)/2);
  },
  render : function(){
    this.stop();
    this.$el.html(this.template());
    this.$('.canvas').html('<canvas id="canvas"></canvas>');
    this.$('.fx').html('<canvas id="fx"></canvas>');

    // virtual scren size
    this.w = 1024;
    this.h = 768;

    // actual screen size
    this.cview = document.getElementById('canvas');
    this.cw = this.cview.width = this.$('.canvas').width();
    this.ch = this.cview.height = this.$('.canvas').height();

    this.fxview = document.getElementById('fx');
    this.fxview.width = this.$('.fx').width();
    this.fxview.height = this.$('.fx').height();

    this.fitToView();

    this.start();

  }
});
