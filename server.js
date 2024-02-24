const express = require('express');
const http = require('http');
var path = require('path');

const app = express();
const server = http.createServer(app);

const { dirname } = require('path');
const appDir = dirname(require.main.filename);

app.set('views', './public');
app.set('view engine', 'pug');

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.locals.basedir = publicPath;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PhoneValidator = require(appDir + '/src/phoneValidator/PhoneValidator');

app.get('/', (req, res) => {
  res.render('demos/bareBonesDemo');
})

app.post('/', (req, res) => {
  let number = {countryCode: req.body.countryCode, domesticPortion: req.body.domesticPortion};
  if(PhoneValidator.isPhoneNumber(number)) {
    var valid = true;
  } else {
    var valid = false;
  }
  res.render('demos/bareBonesDemo', {
    number: number,
    valid: valid
  });
})

app.get('/demoWithMoreDesign', (req, res) => {
  res.render('demos/demoWithMoreDesign/');
})

app.post('/demoWithMoreDesign', (req, res) => {
  let number = {countryCode: req.body.countryCode, domesticPortion: req.body.domesticPortion};
  if(PhoneValidator.isPhoneNumber(number)) {
    var valid = true;
  } else {
    var valid = false;
  }
  res.render('demos/demoWithMoreDesign/', {
    number: number,
    valid: valid
  });
})

const PORT = process.env.PORT || 4444;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});