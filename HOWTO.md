# Building a General Purpose OAuth 2.0 Redirect Proxy For Shortcuts and Scriptable

## Foreword

This is a bit of a long read but I sure hope it would be worth it. 

## Background

I'm an avid user of [Shortcuts](https://itunes.apple.com/us/app/shortcuts/id915249334) and [Scriptable](https://itunes.apple.com/us/app/scriptable/id1405459188) and it's getting more common to encounter APIs that use [OAuth 2.0](#) to access their endpoints. 

One thing common with OAuth is a requirement of a `redirect_uri` also known as a callback url - a url that will catch the initial authorization `code` which in turn would be used to  acquire the `access_token`.  Inspired by @mark's [OAuth 2.0 in Shortcuts](https://talk.automators.fm/t/oauth-2-0-in-shortcuts/1910), I came up with an idea that maybe, I can create an proxy `redirect_uri` where I can use for both Shortcuts and Scriptable or any other app that has a url-scheme. 

## Requirements

The very basic requirement is that is should be able to forward all the companion data to a url-scheme call to the app.

Here is how I expect the authorization endpoint to call the proxy:

    https://oauth-proxy/?forward_to={url-scheme}&data1=value1&data2=value2&...

And here's what I expect the proxy to do:

1. Translate the rest of the query data (`&data1=value1&data2=value2&...`) to an input the receiving app should understand
2. Redirect to the app through the `url_scheme` provided.

## Challenges

Scriptable and Shortcuts' url-schemes accept input differently. Shortcuts only accept one input, Scriptable can have more.

* Shortcuts: `shortcuts://run-shortcut?name=Shortcut_Name&input=whatever`
* Scriptable: `scriptable:///run?scriptName=Script_Name&input1=value1&input2=value2&...`

To work around Shortcuts limitation, instead of passing a simple text on the `input` parameter, it's possible to pass a url-encoded JSON string.
This means we need to know how the app accepts arguments -- as regular query variables or JSON strings.

## Solution

So, let's list down the *ingredients* of our solution.

* accept a url-scheme as a query parameter - `forward_to`
* a flag to indicate what how it will pass the arguments to the receiving app - `arg_format`
* a way to translate query variables to the format required by the receiving app

Since I'm more familiar with javascript, I have chosen node to create the proxy. You can find the code [here](https://github.com/supermamon/oauth-proxy).
You can deploy this to your own server if you have one but if not, you can use [heroku](https://www.heroku.com/) for free as what I did for this demo.

Follow this steps to deploy our proxy to heroku.

1. [Sign-up](https://github.com/join) for a Github account if you don't have one, otherwise [Login](https://github.com/login).
2. Navigate to the [oauth-proxy](https://github.com/supermamon/oauth-proxy) repo and fork it. It should create a repo under your account. Example: `https://github.com/johnny-appleseed/oauth-proxy`.
2. [Sign-up](https://signup.heroku.com/) if you don't have an account, otherwise [Login](https://id.heroku.com/login).
2. Create a new app
3. Give your app a name, I used `my-oauth-proxy`. Choose a region closest to you.  Note that you can't use the same as mine. App names on heroku are globally unique.
4. Once your app is created, you should be on heroku's *Deploy* page. Under *Deployment method*, choose Github.
5. Connect your Github account and your repo.
6. In the Manual Deploy section, choose which branch to deploy. There's only one branch at the moment which is `master`.
7. Click *Deploy Branch* and wait for the build to complete.

You now have your own OAuth proxy.


## Usage

To use your proxy, we first need a way to build the `redirect_uri` and use it with the website providing the API.

We need a few more ingredients:

**Shortcuts**

* [URL Encode](https://www.icloud.com/shortcuts/3f649fffef574b4382f1dd23f37e9336): the built-in `URL Encode` action only encodes values that are meant to be passed as query values. But if the value itself is a URL or a URL scheme, it doesn't encode properly. This shortcut does a proper url encode.
* [Build OAuth Redirect URI](https://www.icloud.com/shortcuts/25e5d07e915d4b7a9440df482fd4a53a): a helper shortcut to generate the `redirect_uri`.
* [Save OAuth Client Info Shortcut](https://www.icloud.com/shortcuts/0d9120114cec4a3c85d2c2d80d8c6a77): a helper shortcut to save an OAuth client's credentials in the Shortcuts directory

**Scriptable**

* [json-util.js](https://github.com/supermamon/scriptable-scripts/raw/master/json-util.js) - utility module for JSON
* [basic-ui.js](https://github.com/supermamon/scriptable-scripts/raw/master/basic-ui.js) - utility module for common UI elements
* [Save OAuth Client Info.js](https://github.com/supermamon/scriptable-scripts/raw/master/Save%20OAuth%20Client%20Info%20Script.js): a script to save OAuth client credentials in the Scriptable directory

Below are the steps on how the whole thing will flow. Mainly focused on Shortcuts 

1. Create a client/app with your target API. This is usually found in your target API's website.
2. Once you created an app, you should get a `client_id` and a `client_secret`.
3. Think of the shortcut name you will use to authenticate.
4. Run the *Build OAuth Redirect URI* shortcut. Assign the resulting `redirect_uri` in your target API's website. 
5. Run the *Save OAuth Client Info* shortcut/script to save the `client_id`, `client_secret`, and `redirect_uri` as a JSON file in your iCloud drive.
6. Start creating a shortcut with the name specified on *3*.
7. This shortcut should expect input. Receiving an input means it was ran via the `redirect_uri`, otherwise it's starting an authentication.
8. To start an authentication, open the url target API's authentication endpoint.
9. When the input is received from the `redirect_uri`, use the data receive to retrieve an `access_code`.
10. Store the details of the `access_code` into a file on your iCloud drive. This `access_code` will eventually used to call the authentication endpoints of the API.

Check out these samples to tie the whole thing together. I chose Spotify as the first example because you can configure it to have more than one `redirect_uri`.

**Spotify**

* [Spotify Dashboard](https://developer.spotify.com/dashboard/applications) - create your client here
* Use the steps 1-5 above to save the necessary information on your iCloud drive.

Shortcuts

* [Spotify Get Client](https://www.icloud.com/shortcuts/627976cb4e24428cb08b2c523b31266a) - read the client information from your iCloud drive
* [Spotify Auth](https://www.icloud.com/shortcuts/8c94b9a396ce45d494fa78cfcaa5010a) - performs the actual authentication
* [Spotify Refresh Token](https://www.icloud.com/shortcuts/b1a6563cb0964a6390aacd2f2c57b0fd) - refresh the user token, if needed
* [Spotify Recently Played](https://www.icloud.com/shortcuts/9633636853354d239a6e7aa26d54ba06) - sample use of the token

Scriptable

* [spotify-api.js](https://github.com/supermamon/scriptable-scripts/raw/master/spotify-api.js) - module to interface with Spotify's api
* [spotify-auth.js](https://github.com/supermamon/scriptable-scripts/raw/master/spotify-auth.js) - script to demo authentication with Spotify
* [spotify-app.js](https://github.com/supermamon/scriptable-scripts/raw/master/spotify-app.js) - script to demo pulling date from Spotify's API 


I'm not much of a  writer but I hope you've enjoyed this article. 




