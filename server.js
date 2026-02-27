'use strict';

const express = require('express');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');

const runner = require('./test-runner');

app.use(cors({ origin: '*' })); // FCC suele permitir esto
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/hello', function (req, res) {
  const name = req.query.name || 'Guest';
  res.type('txt').send('hello ' + name);
});

const travellers = function (req, res) {
  let data = {};
  if (req.body && req.body.surname) {
    switch (req.body.surname.toLowerCase()) {
      case 'polo':
        data = { name: 'Marco', surname: 'Polo', dates: '1254 - 1324' };
        break;
      case 'colombo':
        data = { name: 'Cristoforo', surname: 'Colombo', dates: '1451 - 1506' };
        break;
      case 'vespucci':
        data = { name: 'Amerigo', surname: 'Vespucci', dates: '1454 - 1512' };
        break;
      case 'da verrazzano':
      case 'verrazzano':
        data = { name: 'Giovanni', surname: 'da Verrazzano', dates: '1485 - 1528' };
        break;
      default:
        data = { name: 'unknown' };
    }
  }
  res.json(data);
};

app.route('/travellers').put(travellers);

// --- FCC test runner API ---
let error;
app.get(
  '/_api/get-tests',
  cors(),
  function (req, res, next) {
    if (error) return res.json({ status: 'unavailable' });
    next();
  },
  function (req, res, next) {
    if (!runner.report) return next();
    res.json(testFilter(runner.report, req.query.type, req.query.n));
  },
  function (req, res) {
    runner.on('done', function () {
      process.nextTick(() =>
        res.json(testFilter(runner.report, req.query.type, req.query.n))
      );
    });
  }
);

// Ejecuta el runner UNA sola vez
runner.run();

// Solo escuchar si se ejecuta directamente (compatibilidad FCC)
if (!module.parent) {
  const port = process.env.PORT || 3000;
  app.listen(port, function () {
    console.log('Listening on port ' + port);
  });
}

module.exports = app;

// --- helper ---
function testFilter(tests, type, n) {
  let out;
  switch (type) {
    case 'unit':
      out = tests.filter(t => t.context.match('Unit Tests'));
      break;
    case 'functional':
      out = tests.filter(t => t.context.match('Functional Tests'));
      break;
    default:
      out = tests;
  }
  if (n !== undefined) return out[n] || out;
  return out;
}