module.exports = function(env){

  if(!env){
    env = 'development';
  }

  var nickname = 'deepspace';

  var server = {
    host: 'localhost',
    port: 3002
  }

  var host = 'localhost';

  var redis = {
    host: '127.0.0.1',
    port: 6379,
    predis: 'deepspace'
  };


  switch ( env ) {
  case 'test' :
    server.port = 3003;
    break;

  case 'development' :
    server.port = 3002;
    break;

  case 'production' :
    server.port = 3001;
    break;
  }

  return {
    nickname: nickname,
    env: env,
    server: server,
    redis: redis
  };

}
