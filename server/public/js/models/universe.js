App.Models.Universe = Backbone.Model.extend({
  defaults: {
    id: null,
    name: 'The Universe',
    radius: 1024,
    w: 1024,
    h: 1024,
  },
  initialize: function() {
    _.bindAll(this, 'addSystem','initSystems');
    this.systemLimit = 8;
    this.systems = new App.Collections.Systems();
    this.initSystems();
  },

  initSystems: function(){
    while(this.systems.length < this.systemLimit){
      this.addSystem();
    }
  },

  addSystem: function(i){

    var self = this;
    
    var x, y;
    var d;
    var spacing = this.get('radius') * 0.15;

    var gen = function(max){
      return (max * 0.1) + random.from0upto(max * 0.55);
    };


    d = 0;

    if(this.systems.length === 0){
      x = gen(this.get('w'));
      y = gen(this.get('h'));
    }
    
    var ok = false;
    while (this.systems.length > 0 && !ok){
      ok = true;
      x = gen(this.get('w'));
      y = gen(this.get('h'));
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
      name: 'System ' + String(Number(this.systems.length + 1)),
      universe: this
    });
    this.systems.add(system);
  }
});
