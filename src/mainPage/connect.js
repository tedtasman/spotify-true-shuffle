import Client from '../PRIVATE-config.json';
import { useState } from 'react';

const clientId = Client.ID;
const params = new URLSearchParams(window.location.search);
const code = params.get("code");




export default function Connect() {
    const [active, setActive] = useState(false);

    const handleClick = () => {
        setActive(!active);
        loadProfile();
    }
    console.log("active: ", active);
    if (!code) {
        return (<button onClick={authenticate}>Authenticate</button>)
    }
    else if (!active) {
        return (<button onClick={handleClick}>Begin</button>)
    }
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
            </>
        )
    }
}




function authenticate() {

    // If there is no code in the URL, redirect to the Spotify Accounts service
    if (!code) {
        redirectToAuthCodeFlow(clientId);
    }
    
}

async function loadProfile() {

    // initialize variables
    let accessToken = await getAccessToken(clientId, code);
    let profile = await fetchProfile(accessToken);

    // loop until we have a profile
    console.log(profile);
    while (!profile.display_name) {
        redirectToAuthCodeFlow(clientId);
        accessToken = await getAccessToken(clientId, code);
        profile = await fetchProfile(accessToken);
    }
    populateUI(profile);
}


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

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:3000/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}


async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

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