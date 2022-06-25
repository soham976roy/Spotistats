const express=require('express');
const Buffer=require('safe-buffer').Buffer;
const querystring=require('query-string');
const cors=require('cors');
const bodyParser=require('body-parser');
const axios=require('axios').default;

const app=express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
// app.use('/favicon.ico', express.static('images/favicon.ico'));

const client_id = '4cbce9c52cf34fc782119c767da85ea5';
const client_secret='66c75ae453dd40b2bc748682ec8b3be7';
const redirect_uri = 'http://localhost:8001/callback';
// const FINAL_RESPONSE_URI='http://localhost:8001'


const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  
  
  const stateKey = 'spotify_auth_state';

  app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    const scope = 'streaming user-read-email user-top-read user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state';

  
    const queryParams = querystring.stringify({
      client_id: client_id,
      response_type: 'code',
      redirect_uri: redirect_uri,
      state: state,
      scope: scope,
    });
  
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
  });
  app.get('/callback', (req, res) => {
    const code = req.query.code || null;
  
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
    })
    .then(response => {
      if (response.status === 200) {
        const { access_token, refresh_token, expires_in } = response.data;

        const queryParams = querystring.stringify({
          access_token,
          refresh_token,
          expires_in,
        });

        res.redirect(`http://localhost:3000/?${queryParams}`);

      } else {
        res.redirect(`/?${querystring.stringify({ error: 'invalid_token' })}`);
      }
    })
    .catch(error => {
      res.send(error);
    });
  });

  app.get('/refresh_token', (req, res) => {
    const { refresh_token } = req.query;
  
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
    })
      .then(response => {
        res.send(response.data);
      })
      .catch(error => {
        res.send(error);
      });
  });


app.listen(8001,()=>{
    console.log('listening')
});
