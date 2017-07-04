const request = require("request-promise-native");
const cheerio = require('cheerio');

const express = require('express')
const app = express();
const cors = require('cors');

const bodyParser  = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'));


app.post('/scores', function (req, res) {
  if (!req.body.username || !req.body.password) 
    return res.status(403).send({parsedHTML: "Enter your username/password"});

  const session = request.jar();
  const authOptions = { method: 'POST',
    url: 'https://account.collegeboard.org/login/authenticateUser',
    jar: session,
    formData: {  username: req.body.username,
        password: req.body.password,
        idp: "ECL",
        isEncrypted: "N",
        DURL: "https://apscore.collegeboard.org/scores/view-your-scores",
        appId: 287,
        formState: 1
    } 
  };

  const getScoresOptions = { method: 'GET',
    url: 'https://apscore.collegeboard.org/scores/view-your-scores',
    jar: session
  };

  const governerOptions = {
    method: 'GET',
    jar: session,
    url: 'http://governor.collegeboard.org/clientID=d-aposr/requestedUrl=https://apscore.collegeboard.org/scores/view-your-scores'
  };


  request(governerOptions).then(body => {

    return request(authOptions); 
  }).then(err => {
    // major wtf right here. returns a 200 on wrong passwords
    return res.send({parsedHTML: 'Wrong collegeboard password/username bruh'});
  })
    // but gives you a 302 on the right password wtaf
  .catch(body => {
    request(getScoresOptions).then(body => {
      const $ = cheerio.load(body);
      res.send({parsedHTML: $('div #scoresListArea').html()});
    })
  })
})

app.listen(process.env.PORT, function () {
  console.log('Listening!')
});

