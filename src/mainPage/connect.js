import Client from '../PRIVATE-config.json';
import { useState } from 'react';

const clientId = Client.ID;
const params = new URLSearchParams(window.location.search);
const code = params.get("code");




export default function Connect() {
    // state to track if the user has clicked the "Begin" button
    const [active, setActive] = useState(false);

    // event handler for the "Begin" button
    const handleBegin = () => {
        setActive(!active);
        loadProfile();
    }

    // render the authentication button if there is no code in the URL
    if (!code) {
        return (<button onClick={authenticate}>Authenticate</button>)
    }

    // render the "Begin" button if there is a code in the URL but the user has not clicked "Begin"
    else if (!active) {
        return (<button onClick={handleBegin}>Begin</button>)
    }

    // render the profile information if the user has clicked "Begin"
    else {
        return (
            <>
                <section id="profileInfo">
                <h2>Logged in as <span id="displayName"></span></h2>
                <span id="avatar"></span>
                <ul>
                    <li>User ID: <span id="id"></span></li>
                    <li>Email: <span id="email"></span></li>
                    <li>Spotify URI: <a id="uri" href="#"></a></li>
                    <li>Link: <a id="url" href="#"></a></li>
                    <li>Profile Image: <span id="imgUrl"></span></li>
                </ul>
                </section>
                <button onClick={fetchPlaylists}>Fetch Playlists</button>
                <ul id="playlists"></ul>
            </>
        )
    }
}


// Function to authenticate the user
function authenticate() {

    // If there is no code in the URL, redirect to the Spotify Accounts service
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    }
    
}


// Function to load the user's profile information
async function loadProfile() {

    // initialize variables
    let accessToken = await getAccessToken(clientId, code);
    let profile = await fetchProfile(accessToken);

    // loop until we have a profile
    console.log(profile);
    while (!profile.display_name) {
        redirectToAuthCodeFlow(clientId);
        accessToken = await getAccessToken(clientId, code);
        profile = await fetchProfile();
    }
    populateUI(profile);
}


// Function to redirect to the Spotify Accounts service
async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:3000/callback");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;

}


// Function to generate a code verifier
function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


// Function to generate a code challenge
async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


// Function to get an access token
async function getAccessToken(clientId, code) {

    // get the code verifier from local storage
    const verifier = localStorage.getItem("verifier");

    // create the request parameters
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:3000/callback");
    params.append("code_verifier", verifier);

    // make the request
    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    // return and store the access token
    const { access_token } = await result.json();
    localStorage.setItem("token", access_token);
    return access_token;
}


// Function to fetch the user's profile information
async function fetchProfile() {
    const token = localStorage.getItem("token");
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}


// Function to fetch the user's playlists
async function fetchPlaylists() {

    

    // get the user's playlists
    const token = localStorage.getItem("token");
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    // parse the playlists and return them as an array with the name and ID
    const playlistsObject = await result.json();
    const playlists = [];
    for (let playlist of playlistsObject.items) {
        playlists.push([playlist.name, playlist.id]);
    }

    const playlistContainer = document.getElementById('playlists');
    playlistContainer.innerHTML = '';

    // Dynamically add items to the list
    playlists.forEach(playlist => {
        // Create the list item
        const playlistEntry = document.createElement('li');

        // Create the radio button
        const radioButton = document.createElement('input');
        radioButton.setAttribute('type', 'radio');
        radioButton.setAttribute('name', 'playlist');
        radioButton.setAttribute('value', playlist[0]);
        radioButton.setAttribute('id', `playlist-${playlist[0]}`);

        // Create a label for the radio button
        const label = document.createElement('label');
        label.setAttribute('for', `playlist-${playlist[0]}`);
        label.textContent = playlist[0];

        // Append the radio button and label to the list item
        playlistEntry.appendChild(radioButton);
        playlistEntry.appendChild(label);

        // Append the list item to the playlist container
        playlistContainer.appendChild(playlistEntry);
    });
}


// Function to populate the UI with the user's profile information
function populateUI(profile) {
    try {
        document.getElementById("displayName").innerText = profile.display_name;
        if (profile.images[0]) {
            const profileImage = new Image(200, 200);
            profileImage.src = profile.images[0].url;
            document.getElementById("avatar").appendChild(profileImage);
            document.getElementById("imgUrl").innerText = profile.images[0].url;
        }
        document.getElementById("id").innerText = profile.id;
        document.getElementById("email").innerText = profile.email;
        document.getElementById("uri").innerText = profile.uri;
        document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
        document.getElementById("url").innerText = profile.href;
        document.getElementById("url").setAttribute("href", profile.href);
    } catch (error) {
        console.error("Error populating UI:", error);
    }
}