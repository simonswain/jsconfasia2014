/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.canvas = Backbone.View.extend({
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

    var x = xw;
    var yy = 2 * xh;

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold ' + Math.floor(xh * 0.6) + 'pt courier';
    ctx.textAlign = 'left';

    this.content.forEach(function(s){
      ctx.fillText(s, x, yy);
      yy += xh * 1.2;
    });

    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.floor(xh * 0.6) + 'pt courier';
    ctx.textAlign = 'right';
    ctx.fillText(this.angle + '°', this.w * 0.8, this.h - 2*xh);

    //


    // draw ship body
    ctx.save();
    ctx.translate(this.w * 0.8 , this.h/2);
    var z = 2 * xw;
    ctx.scale(z, z);
    ctx.rotate(de_ra(this.angle));

    ctx.lineWidth = 0.025;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-1.5, 0);
    ctx.lineTo(1.5, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -1.5);
    ctx.lineTo(0, 1.5);
    ctx.closePath();
    ctx.stroke();


    ctx.lineWidth = 0.1;
    ctx.strokeStyle = '#f00';
    ctx.beginPath();

    ctx.moveTo(-1, 0.75);
    ctx.lineTo(0, -1);
    ctx.lineTo(1, 0.75);

    ctx.closePath();
    ctx.stroke();



    ctx.restore();



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

    this.angle += 1;
    if(this.angle >= 360){
      this.angle = 0;
    }

    //

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
  },
  init: function(){
    var self = this;

    this.angle = 0;

    this.content = [
      'ctx.save();',
      'ctx.translate(x, y);',
      'ctx.scale(size);',
      'ctx.rotate(angle);',
      'ctx.beginPath();',
      'ctx.moveTo(-1, 0.75);',
      'ctx.lineTo(0, -1);',
      'ctx.lineTo(1, 0.75);',
      'ctx.closePath();',
      'ctx.stroke();',
      'ctx.restore();'
    ];

    this.period = 25;

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
