var koa = require('koa')
var parse = require('co-body');
var session = require('koa-session');
var csrf = require('koa-csrf');
var route = require('koa-route');

var app = koa()

app.keys = ['session key', 'csrf example']
app.use(session(app))
// This will catch the CSRF error!!!!
app.use(function* (next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = err.message
  }
});
app.use(csrf())
app.use(route.get('/token', getToken))
app.use(route.post('/post', post))

function* getToken() {
  this.body = this.csrf;
}

function* post() {
  this.body = {ok: true}
}

var request = require('supertest')
var assert = require('assert')

describe('CSRF ', function() {
  var token;
  var agent = request.agent(app.listen())
  it('...capture token', function(done) {
    agent.get('/token')
    .expect(function(res){
      token = res.text;
    })
    .end(done)
  });

  it('should be able to POST to /post with a valid csrf token', function(done) {
    agent.post('/post')
    .set('x-csrf-token', token)
    .send({msg: 'foo'})
    .expect(200)
    .expect(function(res){
      assert.equal(res.text, '{"ok":true}')
    })
    .end(done)
  });

  it('should fail without agent', function(done) {
    request(app.listen()).post('/post')
    .set('x-csrf-token', token)
    .send({msg: 'foo'})
    .expect(403)
    .expect('invalid csrf token')
    .end(done)
  });
});

