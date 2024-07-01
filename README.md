# Spotify ShuffleTrue
## [shuffletrue.com](https://shuffletrue.com/) - A tool to improve the Spotify shuffle experience

### Purpose
Spotify utilizes an algorithmic shuffling system which leads to the user hearing some songs less frequently. ShuffleTrue aims to fix this by taking an existing playlist, randomizing the order, and placing this in a new playlist. By playing this new playlist in order, the user can simulate true random shuffling.

### Features
- Authenticate with your Spotify account
- View and select from your existing playlists
- Randomly shuffle the selected playlist
- Create a new playlist with the shuffled order

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/spotify-true-shuffle.git
    cd spotify-true-shuffle
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a Spotify developer application to get your client ID and client secret. Follow the instructions [here](https://developer.spotify.com/documentation/general/guides/app-settings/).

### Usage

1. Change URIs from production `https://shuffletrue.com/` to development `http://localhost:3000`. This is most easily done with search and replace within src/mainPage/connect.js

2. Start the development server:
    ```sh
    npm start
    ```

3. Open your browser and go to `http://localhost:3000`.

4. Log in with your Spotify account.

5. Select a playlist from the list.

6. Click the "Shuffle" button to create a new playlist with the shuffled order.

### Technologies Used
- React
- Spotify Web API
- Node.js

### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any changes.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgements
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Create React App](https://create-react-app.dev/)

### Contact
For any inquiries, please contact:
- Theodore Tasman: [contact@ttasman.com](mailto:contact@ttasman.com)
- GitHub: [tedtasman](https://github.com/tedtasman)
