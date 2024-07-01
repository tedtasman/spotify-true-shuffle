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

    const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
    const handlePlaylists = () => {
        setPlaylistsLoaded(!playlistsLoaded);
        fetchPlaylists();
    }

    // render the authentication button if there is no code in the URL
    if (!code) {
        return (
            <div className='Authenticate-container'>
                <button onClick={authenticate} className='Action-button'>Authenticate</button>
                <ul className='Tip-list'>
                    <li>Click the "Authenticate" button to log in to Spotify</li>
                    <li>You will be redirected to a secure Spotify login page</li>
                    <li>After logging in, you will be redirected back to ShuffleTrue</li>
                    <li>Don't worry, ShuffleTrue does not save any of your data</li>
                </ul>
            </div>
        )
    }

    // render the "Begin" button if there is a code in the URL but the user has not clicked "Begin"
    else if (!active) {
        return (
            <div className='Authenticate-container'>
                <button onClick={handleBegin} className='Action-button'>Begin</button>
                <ul className='Tip-list'>
                    <li>Click the "Begin" button to get started with ShuffleTrue</li>
                    <li>ShuffleTrue will fetch your Spotify profile information</li>
                </ul>
            </div>
        )
    }

    // render the profile information if the user has clicked "Begin"
    else {
        return (
            <div className='Body-container'>
                <div id="profileInfo" className='Profile'>
                    <h2>Logged in as <span id="displayName" style={{color:'#a2d5f5'}}></span></h2>
                    <span id="avatar" className='.Avatar'></span>
                </div>
                {playlistsLoaded ? 
                <div className='Playlists-container'>
                    <h2>Select a playlist to shuffle:</h2>
                    <ul id="playlists" className='Playlists-list'></ul>
                </div>
                : null}
                {!playlistsLoaded ? <button onClick={handlePlaylists} className='Action-button'>Fetch Playlists</button> : null}
                {playlistsLoaded ? <button onClick={shufflePlaylist} className='Action-button'>Create ShuffleTrue!</button> : null}
                <div className='Log' id='log'></div>
            </div>
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
    while (!profile.display_name) {
        redirectToAuthCodeFlow(clientId);
        accessToken = await getAccessToken(clientId, code);
        profile = await fetchProfile();
    }

    localStorage.setItem("user_id", profile.id);

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
    params.append("scope", "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private");
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

    console.log(playlists);

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
        radioButton.setAttribute('data-id', playlist[1]);
        radioButton.className = 'Playlist-radio';
        radioButton.addEventListener('click', handleSelectPlaylist);
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


function handleSelectPlaylist() {
    document.getElementById('log').innerHTML = '';
}

async function shufflePlaylist() {
    document.getElementById('log').innerHTML = 'Shuffling...';
    const token = localStorage.getItem("token");
    const user_id = localStorage.getItem("user_id").replace(/"/g, '');
    console.log(user_id);
    const selectedPlaylist = document.querySelector('input[name="playlist"]:checked');
    if (!selectedPlaylist) {
        document.getElementById('log').innerHTML = 'Please select a playlist to shuffle.';
        return;
    }
    const playlistId = selectedPlaylist.getAttribute('data-id');
    const playlistName = selectedPlaylist.value;
    const trackUris = [];

    // get the number of tracks in the playlist
    const getPlayListDetails = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    const playListDetails = await getPlayListDetails.json();
    const trackCount = playListDetails.tracks.total;
    console.log(trackCount);

    // get the track URIs
    for (let i = 0; i < trackCount; i += 100) {
        const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${i}`, {
            method: "GET", headers: { Authorization: `Bearer ${token}` }
        });
        const playlistObject = await result.json();
        const tracks = playlistObject.items;
        const currentTrackUris = tracks.map(track => track.track.uri);
        trackUris.push(...currentTrackUris);
    }

    // shuffle the track URIs
    const shuffledUris = shuffle(trackUris);

    // create a new playlist
    const newPlaylist = await fetch(`https://api.spotify.com/v1/users/${localStorage.getItem("user_id")}/playlists`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: `${playlistName} ShuffleTrue`,
            public: true,
            description: `A shuffled version of ${playlistName}, created by ShuffleTrue!`,
        })
    });

    // add the shuffled tracks to the new playlist
    const newPlaylistObject = await newPlaylist.json();
    const newPlaylistId = newPlaylistObject.id;
    console.log(newPlaylistId); 
    console.log(shuffledUris.length);
    for (let i = 0; i < shuffledUris.length; i += 100) {
        const addTracks = await fetch(`https://api.spotify.com/v1/playlists/${newPlaylistId}/tracks`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: shuffledUris.slice(i, i + 100) })
        });
        console.log(addTracks);

        if (i + 100 < shuffledUris.length) { // Check to avoid unnecessary delay after the last request
            await sleep(1000); // Sleep for 1 second to avoid rate limiting
        }
    }

    document.getElementById('log').innerHTML = 'Playlist created! Check your Spotify account for the new playlist.';

}

// Function to populate the UI with the user's profile information
function populateUI(profile) {
    try {
        document.getElementById("displayName").innerText = profile.display_name;
        if (profile.images[0]) {
            const profileImage = new Image(200, 200);
            profileImage.src = profile.images[0].url;
            profileImage.alt = "Profile Image";
            profileImage.classList.add('Avatar');
            document.getElementById("avatar").appendChild(profileImage);
        }

    } catch (error) {
        console.error("Error populating UI:", error);
    }
}


// Function to shuffle an array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle
    while (currentIndex !== 0) {

        // Pick a remaining element
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}