require("dotenv").config();

const twit = require('./twit');
const fs = require('fs');
const path = require('path');
const T = require("./twit");
const paramsPath = path.join(__dirname, 'params.json');

function writeParams(data){
    console.log('Writing params...', data);
    return fs.writeFileSync(paramsPath, JSON.stringify(data));
}

function readParams(){
    console.log('Reading params...');
    const data = fs.readFileSync(paramsPath);
    return JSON.parse(data.toString());
}

function getTweets(since_id){
    return new Promise((resolve,reject) => {
        let params = {
            q: "@BotSocialCredit",
            count: 10,
        };
        if (since_id){
            params.since_id = since_id;

        }
        console.log('Getting tweets...', params)
        twit.get("search/tweets", params,(err,data) => {
            if(err){
                return reject(err);
            }
            return resolve(data);
        });
    });
}

function likePost(id){
    return new Promise ((resolve, reject) => {
        let params = {
            id,
        };
        twit.post("favorites/create" , params, (err,data) => {
            if(err){
                return reject(err);
            }
            return resolve(data);
        });
    });
}

function retweetPost(id){
    return new Promise ((resolve, reject) => {
        let params = {
            id,
        };
        twit.post("statuses/retweet/:id" , params, (err,data) => {
            if(err){
                return reject(err);
            }
            return resolve(data);
        });
    });
}






async function main(){
    try{
        const params = readParams();
        const data = await getTweets(params.since_id);
        const tweets = data.statuses;
        console.log('We got the tweets',tweets.length);
        for await(let tweet of tweets){
            try{
                await likePost(tweet.id_str);
                console.log('Successfully liked tweet' + tweet.id_str);
                
            }catch(e){
                console.log('Could not like tweet ' + tweets.id_str);
            }
            params.since_id = tweet.id_str;
        }
        writeParams(params);
    }
        catch(e){
            console.error(e);
        }
}

console.log('Starting bot. Get ready');

setInterval(main,10000);