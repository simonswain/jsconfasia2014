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

    var xw = this.w/16;
    var xh = this.h/16;

    // draw here

    self.system.stars.each(function(star){
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
      // ctx.lineWidth = 2;
      // ctx.beginPath();
      // ctx.arc(data.x, data.y, data.size * xw/24, 0, 2 * Math.PI, true);
      // ctx.fill();
      // ctx.stroke();
    });

    var vals = [
      'population',
      'agriculture',
      'pollution',
      'industry',
      'credit'
    ];

    self.system.planets.each(function(planet){
      var data = planet.toJSON();
      data.x = Number(data.x);
      data.y = Number(data.y);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(data.x, data.y, xw/24 * data.size, 0, 2 * Math.PI, true);
      ctx.fill();
      ctx.stroke();

      var xl = data.x + xw/10;
      var xr = data.x - xw/10;
      var yy = data.y + (data.size * xw/8);

      ctx.fillStyle = '#666';
      ctx.font = '10pt arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.name, data.x, data.y - (2*data.size * xw/24));

      vals.forEach(function(k){

        ctx.textAlign = 'left';
        ctx.fillText(k.substr(0,3), xl, yy);

        ctx.textAlign = 'right';
        ctx.fillText(data[k].toFixed(0), xr, yy);
        yy += xw/4;
      });      
    });

    self.system.ships.each(function(ship){
      var data = ship.toJSON();
      var z = xw / 8;
      ctx.fillStyle = '#c00';
      ctx.strokeStyle = '#c00';

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

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.system = new App.Models.System({
      w: this.w,
      h: this.h,
      radius: Math.min(this.w, this.h)
    });

    this.period = 1000;

  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    //setInterval(this.init.bind(this), 20000);

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
