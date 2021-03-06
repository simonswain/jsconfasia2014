/*global Backbone:true, $:true, _:true, App:true */
/*jshint multistr:true */
/*jshint browser:true */
/*jshint strict:false */

App.Views.foxes_and_rabbits = Backbone.View.extend({
  template: _.template('<div class="canvas"></div><div class="fx"></div>'),
  initialize : function(opts) {
    _.bindAll(this, 'onClose', 'render', 'start', 'stop', 'draw', 'tick','sample');
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

    // snapshot bottom half for sliding chart
    //var slideframe = ctx.getImageData(0,this.ch/2,this.cw,this.ch/2);

    ctx.save();
    ctxfx.save();

    ctxfx.fillStyle = 'rgba(1,1,1,.18)';
    ctxfx.fillRect(0,0, this.cw,this.ch);

    ctx.clearRect(0,0,this.cw,this.ch);

    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctxfx.translate(this.x, this.y);
    ctxfx.scale(this.scale, this.scale);

    var xw = this.w / this.gridw;
    var xh = this.h/2 / this.gridh;

    // draw here

    var grid = this.grid;
    var x, xx, y, yy;
    for(x = 0, xx = grid.length; x<xx; x ++){
      for(y = 0, yy = grid[x].length; y<yy; y ++){
        ctx.beginPath();
        ctx.lineStyle = '#000';
        // grazz
        ctx.fillStyle = '#000';
        // fox
        if(grid[x][y] === 2){
          ctx.fillStyle = '#f00';
        }
        // rabbit
        if(grid[x][y] === 3){
          ctx.fillStyle = '#0bb';
        }
        ctx.rect(x * xw, y * xh, xw, xh);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();     
      } 
    }

    // // chart
    var drawChart = function(){

      var segments = {
        numFox: '#c00',
        numRabbit: '#0cc'
      };
      
      var chart = self.chart;
      var w = self.w;
      var h = self.h *0.4
      ctx.save();
      ctx.translate(0, self.h * 0.55);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.fillRect(0, 0, w, h);
      ctx.fill();

      ctx.lineWidth = xw/5;

      _.each(self.chart, function(vals, key){
        ctx.strokeStyle = segments[key];
        var xstep = w /  self.chartLimit;
        ctx.beginPath();
        ctx.moveTo(0, h - (h * vals)[0]);
        vals.forEach(function(val, ix){
          val = (h/self.valMax) * val;
          ctx.lineTo(1+ix * xstep, h - val);
        });
        ctx.stroke();
        ctx.closePath();
      });

      // ctx.beginPath();
      // ctx.strokeStyle = '#444';
      // ctx.rect(0, 0, w,h);
      // ctx.stroke();

      ctx.restore();

    }();
    
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
    
    for (var l = 0; l < this.gridw; l++) {
      for (var h = 0; h < this.gridh; h++) {
        var n = this.grid[l][h];
        // grass
        if (n === 1) {
          continue
        }
        // no action
        if (Math.random() > 0.5) {
          continue
        }

        var e = Math.ceil(Math.random() * 3) - 2;
        var c;
        if (e != 0) {
          c = Math.ceil(Math.random() * 3) - 2
        } else {
          c = (Math.random() > 0.5 ? 1 : -1)
        }

        var f = l + e, d = h + c;

        if (f < 0) {
          f = this.gridw - 1
        } else {
          if (f >= this.gridw) {
            f = 0
          }
        }

        if (d < 0) {
          d = this.gridh - 1
        } else {
          if (d >= this.gridh) {
            d = 0
          }
        }

        var m = this.grid[f][d];
        var b = n + m;
        if (n == 2) {
          if (m == 3) {
            if (Math.random() > this.foxbirth) {
              this.grid[f][d] = 1
            } else {
              this.grid[f][d] = 2
            }
          } else {
            if (Math.random() < this.foxdeath) {
              this.grid[l][h] = 1
            } else {
              if (m == 1) {
                this.grid[l][h] = 1;
                this.grid[f][d] = 2
              }
            }
          }
        } else {
          if (n == 3) {
            if (m == 2) {
              this.grid[l][h] = 1
            } else {
              if (m == 1) {
                if (Math.random() < this.rabbitbirth) {
                  this.grid[f][d] = 3
                } else {
                  this.grid[l][h] = 1
                }
                this.grid[f][d] = 3
              }
            }
          }
        }
        delta = (this.grid[l][h] + this.grid[f][d]) - b;
        if (delta == -1) {
          if (b < 5) {
            this.numFox--;
          } else {
            this.numFox++;
            this.numRabbit--;
          }
        } else {
          if (delta == -2) {
            this.numRabbit--;
          } else {
            if (delta == 2) {
              this.numRabbit++;
            }
          }
        }
      }
    }


    //
    this.foxhist.push(this.numFox);
    while(this.foxhist.length > this.w){
      this.foxhist.shift();
    }

    this.rabbithist.push(this.numRabbit);
    while(this.rabbithist.length > this.w){
      this.rabbithist.shift();
    }

    if(this.tickTimer){
      clearTimeout(this.tickTimer);
    }
    this.tickTimer = setTimeout(this.tick.bind(this), this.period);
    this.sampleTimer = setTimeout(this.sample.bind(this), 125);
  },
  sample: function(){
    
    var self = this;
    _.each(['numRabbit','numFox'], function(key){
      var val = self[key];
      if(val > self.valMax){
        self.valMax = val;
      }
      self.chart[key].push(val);
      while(self.chart[key].length > self.chartLimit+1){
        self.chart[key].shift();
      }
    });
  },
  toggle: function(){
    if(this.gridw === 128){
      this.gridw = 64;
      this.gridh = 32;
    } else {
      this.gridw = 128;
      this.gridh = 64;
    }
    this.init();
  },
  init: function(){
    var self = this;

    if(!this.gridw){
      this.gridw = 64;
      this.gridh = 32;
    }

    this.period = 25;
    this.valMax = 100;
    this.chart = {
      numRabbit: [],
      numFox: []
    };
    
    this.chartLimit = 100;

    this.foxnum = 0.03;
    this.rabbitnum = 0.3;
    this.foxdeath = 0.04;
    this.foxbirth = 0.8;
    this.rabbitbirth = 0.07;

    this.foxhist = [];
    this.rabbithist = [];

    this.numFox = 0;
    this.numRabbit = 0;
    var x, y;
    this.grid = grid = [];
    for (x = 0; x < this.gridw; x++) {
      grid[x] = [];
      for (y = 0; y < this.gridh; y++) {
        grid[x][y] = this.makeCell();
      }
    }


  },
  makeCell: function() {
    var b = Math.random();
    var a = 1;
    if (b < this.foxnum) {
      a = 2;
      this.numFox++
    } else {
      if (b < this.foxnum + this.rabbitnum) {
        a = 3;
        this.numRabbit++
      }
    }
    return a;
  },
  start: function () {
    this.init();
    this.running = true;
    this.draw();
    setTimeout(this.tick.bind(this), this.period);
    ///setInterval(this.init.bind(this), 20000);

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
