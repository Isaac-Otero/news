const express = require('express');
const request = require('request');
const path = require('path');
const stories = require('./stories');

const app = express();

app.use((req, res, next) => {
    console.log('Request details. Method:', req.method, 'OG URL:', req.originalUrl);

    next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');

    next();
});

app.use(express.static(path.join(__dirname, 'client/dist')));

//check if backend got call
app.get('/ping', (req, res) => {
    res.send('pong!');
});

app.get('/stories', (req, res) => {
    res.json(stories);
});

app.get('/stories/:title', (req, res) => {
    const { title } = req.params;

    res.json(stories.filter(story => story.title.includes(title)));
});

//https://hacker-news.firebaseio.com/v0/topstories.json
app.get('/topstories', (req, res, next) => {
    request(
        { url: 'https://hacker-news.firebaseio.com/v0/topstories.json' },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return next(new Error('Error in your request'));
            }

            const topStories = JSON.parse(body);

            const limit = 10;

            Promise.all(
                topStories.slice(0, limit).map(story => {
                    return new Promise((resolve, reject) => {
                        request(
                        {url: `https://hacker-news.firebaseio.com/v0/item/${story}.json`},
                        (error, response, body) => {
                            if(error || response.statusCode!==200){
                                return reject(new Error('Error requestin story item'));
                            }
                            resolve (JSON.parse(body));
                        }
                    );
                })
          
                })
            )
            .then(fullTopStories =>{
                res.json(fullTopStories);
            })
            .catch(error => next(error));
        
        }
    )
});

//middleware to handle errors, catches any errors that occur
app.use((err, req, res, next) => {
    res.status(500).json({ type: 'error', message: err.message })
});

//port
app.listen(3000, () => {
    console.log('listening on 3000');
});