# Má'zhínǔ Nufī

Má'zhínǔ Nufī is an interactive quiz application designed to help users learn the Nufi language. The app fetches quiz questions from a Firebase Firestore database, allowing for dynamic content updates without modifying the client-side code.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

- Dynamic quiz questions fetched from Firebase Firestore
- Real-time updates without redeploying the app
- Timer for each question
- Score tracking
- Audio feedback for correct and incorrect answers
- Responsive design suitable for various devices
- Social media integration for community engagement

**Note** : Note: If you prefer not to set up a full Firebase project, you can use a simpler approach. Just uncomment the following line in your index.html:
`<script type="module" src="script_simple.js"></script>`

In this file, you can directly embed your questions and other quiz data without connecting to Firebase. This allows you to manage your quiz content locally without the need for a backend setup.

## Demo

[![Watch the demo](https://img.youtube.com/vi/ClZlieJshkQ/0.jpg)](https://youtu.be/ClZlieJshkQ)


## Installation

### Prerequisites

- Node.js and npm installed
- Firebase account with Firestore database set up
- A local web server to serve the application (e.g., Live Server extension for VS Code)

### Steps

1. **Clone the Repository**

   `git clone https://github.com/yourusername/mazhinu-nufi.git`
   `cd mazhinu-nufi`

2. **Install Dependencies**
If you plan to use build tools or npm packages, install dependencies:

`npm install`

3. **Set Up Firebase**

- Create a Firebase project in the Firebase Console.
- Enable Firestore in your Firebase project.
- Add a collection named questions to your Firestore database.
- Add quiz questions to the questions collection with the following fields:
    - question (string): The quiz question.
    - options (array of strings): Possible answers.
    - correct (string): The correct answer (should match one of the options).
    - time (number): Time limit for the question in seconds.
**Note**: You can use the python script `upload_quiz_to_firebase_from_csv.py` to automatically upload quiz data from csv to Firebase

4. **Configure Firebase in the App**

In the script_firebasedb.js file, replace the Firebase configuration object with your project's configuration:

    // Your Firebase configuration
    const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
};

5. **Serve the Application**

Use a local web server to run the application:

**Option A: Live Server Extension (VS Code)**

Install the Live Server extension.
Open the project folder in VS Code.
Right-click index.html and select "Open with Live Server".

**Option B: Python HTTP Server**
python -m http.server 8000
Navigate to http://localhost:8000/ in your browser.


6. **Usage**

- Open the application in your browser.
- Click on the "Ghěnmbhi" (Start) button to begin the quiz.
- Answer each question within the allotted time.
- Your score will be displayed at the end of the quiz.
- Click "Patntō'" to replay the quiz.


**Acknowledgments**

Created by Shck Tchamna for Resulam.
Special thanks to Resulam for supporting the development of this application.

