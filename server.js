'use strict';

const express = require('express');
const app = express();

const cors = require('cors');
const bodyParser = require('body-parser');

const runner = require('./test-runner');

app.use(cors({ origin: '*' }));
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
app.get('/_api/get-tests', cors(), function (req, res) {
  if (error) return res.json({ status: 'unavailable' });

  // Si ya hay report, devolvelo
  if (runner.report && Array.isArray(runner.report)) {
    return res.json(testFilter(runner.report, req.query.type, req.query.n));
  }

  // Si no hay report todavía, esperamos a que termine
  runner.once('done', function () {
    const report = Array.isArray(runner.report) ? runner.report : [];
    return res.json(testFilter(report, req.query.type, req.query.n));
  });

  // Failsafe: si por alguna razón no dispara "done", devolvemos [] (evita null)
  setTimeout(() => {
    const report = Array.isArray(runner.report) ? runner.report : [];
    return res.json(testFilter(report, req.query.type, req.query.n));
  }, 2000);
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Listening on port ' + port);
  console.log('Running Tests...');

  // correr tests UNA sola vez, después de levantar el server
  setTimeout(function () {
    try {
      runner.run();
    } catch (e) {
      error = e;
      console.log('Tests are not valid:');
      console.log(error);
    }
  }, 1500);
});

module.exports = app;

function testFilter(tests, type, n) {
  let out;
  switch (type) {
    case 'unit':
      out = tests.filter(t => t.context && t.context.includes('Unit Tests'));
      break;
    case 'functional':
  out = tests.filter(t =>
    t.context &&
    (t.context.includes('Functional Tests') || t.context.includes('Zombie'))
  );
  break;
    default:
      out = tests;
  }

 if (n !== undefined) {
  const i = parseInt(n, 10);
  if (Number.isNaN(i)) return [];
  return out[i] || { title: 'missing', context: '', state: 'failed', assertions: [] };
}

  return out;
}