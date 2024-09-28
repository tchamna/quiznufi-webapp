// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

// Your Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// State Variables
let currentQuestion = 0;
let score = 0;
let timeLeft = 0;
let timerInterval;
let autoNextTimeout;
let allQuizData = []; // Array to hold all questions fetched from Firestore
let shuffledQuizData = []; // Array to hold shuffled questions for the quiz
let totalQuestions = 0; // Total number of questions in the round
let isGuest = false; // Indicates if the user is a guest

// DOM Elements
const questionEl = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const questionProgressText = document.getElementById('question-progress-text');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const questionCountInput = document.getElementById('question-count');

// Audio Resources
const correctSounds = [
    'resources/correct_answer1.mp3',
    'resources/correct_answer2.mp3',
];

const wrongSounds = [
    'resources/wrong_answer1.mp3',
    'resources/wrong_answer2.mp3',
];

// Create the background music audio object
const timerSound = new Audio('resources/background_music_Kameni_Lebong_Esclavage.mp3');
timerSound.loop = false;

// Event Listener for when the music ends, so it can restart
timerSound.addEventListener('ended', () => {
    timerSound.currentTime = 0;
    timerSound.play().catch(error => {
        console.warn('Timer sound playback was prevented:', error);
    });
});

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Validates and sets the number of questions for the quiz.
 */
function setNumberOfQuestions() {
    const availableQuestions = allQuizData.length;
    let numberOfQuestions = parseInt(questionCountInput.value, 10); // Get input value

    // Validate input
    if (isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
        alert(`Invalid number. Starting with all available questions.`);
        numberOfQuestions = availableQuestions;
    } else if (numberOfQuestions > availableQuestions) {
        alert(`Nte'sínǔ síé ndɑ̌' ${availableQuestions}. Ngɑ̌ indáksí ō pi nkwee yāā...`);
        numberOfQuestions = availableQuestions;
    }

    totalQuestions = numberOfQuestions;
    shuffledQuizData = allQuizData.slice(0, numberOfQuestions); // Use the selected number of questions
    shuffleArray(shuffledQuizData); // Shuffle the selected questions
}

/**
 * Initializes the quiz by fetching and shuffling questions.
 */
async function initializeQuiz() {
    try {
        // Fetch questions from Firestore
        const querySnapshot = await getDocs(collection(db, "questions"));
        querySnapshot.forEach((doc) => {
            allQuizData.push(doc.data());
        });

        // Shuffle all questions once fetched
        shuffleArray(allQuizData);

    } catch (error) {
        console.error('Error fetching quiz data:', error);
        alert('Failed to load quiz data. Please try again later.');
    }
}

/**
 * Starts the quiz after fetching questions and setting the number of questions.
 */
async function startQuiz() {
    console.log('Starting the quiz...');
    if (allQuizData.length === 0) {
        await initializeQuiz(); // Ensure that questions are fetched before proceeding
    }

    setNumberOfQuestions(); // Set the number of questions based on user input

    // Hide start screen and show quiz screen
    startScreen.style.display = 'none';
    document.querySelector('header').style.display = 'block'; // Show the header
    document.getElementById('question-container').style.display = 'block';
    document.getElementById('options-container').style.display = 'flex';
    nextBtn.style.display = 'inline-block';

    console.log('Header is now visible.');

    // Start background music once when the quiz starts
    try {
        await timerSound.play(); // Use await to handle any playback errors
    } catch (error) {
        console.warn('Timer sound playback was prevented:', error);
    }

    loadQuestion();
}

/**
 * Starts the countdown timer.
 * @param {number} duration - Duration in seconds.
 */
function startTimer(duration) {
    timeLeft = duration;
    timeEl.textContent = timeLeft;

    // Clear any existing interval to avoid conflicts
    clearInterval(timerInterval);

    // Set a new interval to update the timer every second
    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;

        // Check if time has run out
        if (timeLeft <= 0) {
            clearInterval(timerInterval); // Stop the timer
            highlightCorrectAnswer(); // Highlight the correct answer
            disableOptions(); // Disable all options
            nextBtn.disabled = false; // Enable the "Next" button

            // Automatically move to the next question after 15 seconds
            autoNextTimeout = setTimeout(() => {
                nextQuestion();
            }, 15000);
        }
    }, 1000); // 1000 milliseconds = 1 second
}

/**
 * Loads the current question and generates shuffled option buttons.
 */
function loadQuestion() {
    console.log(`Loading question ${currentQuestion + 1} of ${totalQuestions}`);
    resetState();
    const currentQuizData = shuffledQuizData[currentQuestion];
    questionEl.textContent = currentQuizData.question;
    optionsContainer.innerHTML = ''; // Clear previous options

    // Shuffle the options before displaying
    let shuffledOptions = [...currentQuizData.options];
    shuffleArray(shuffledOptions);

    shuffledOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.classList.add('option-btn');
        button.textContent = option;
        button.disabled = false;
        button.setAttribute('aria-label', `Option ${index + 1}: ${option}`);
        button.addEventListener('click', () => selectOption(button, currentQuizData.correct));
        optionsContainer.appendChild(button);
    });

    nextBtn.disabled = true;
    clearInterval(timerInterval);
    startTimer(currentQuizData.time);
    updateProgressBar(); // Update progress bar for each question loaded

    // Call the setEqualButtonHeights function to adjust button heights
    setEqualButtonHeights(); // Reuse your existing function
}


/**
 * Reuse the existing setEqualButtonHeights function.
 * Adjusts the height of all buttons to match the tallest one.
 */
function setEqualButtonHeights() {
    const buttons = document.querySelectorAll('.option-btn');
    let maxHeight = 0;

    // Reset height to auto to recalculate heights
    buttons.forEach(btn => {
        btn.style.height = 'auto';
    });

    // Calculate the maximum height
    buttons.forEach(btn => {
        const btnHeight = btn.scrollHeight;
        if (btnHeight > maxHeight) {
            maxHeight = btnHeight;
        }
    });

    // Set all buttons to the maximum height
    buttons.forEach(btn => {
        btn.style.height = `${maxHeight}px`;
    });
}


/**
 * Resets the state before loading a new question.
 */
function resetState() {
    nextBtn.disabled = true;
    clearInterval(timerInterval);
    clearTimeout(autoNextTimeout);
}

/**
 * Handles the selection of an option and checks the answer.
 * @param {HTMLElement} selectedButton - The selected button element.
 * @param {string} correctAnswer - The correct answer.
 */
function selectOption(selectedButton, correctAnswer) {
    const allOptionButtons = document.querySelectorAll('.option-btn');
    clearInterval(timerInterval);

    if (selectedButton.textContent === correctAnswer) {
        selectedButton.classList.add('correct');
        score++;
        scoreEl.textContent = score;
        playRandomSound(correctSounds);
    } else {
        selectedButton.classList.add('wrong');
        playRandomSound(wrongSounds);
        // Highlight the correct answer
        allOptionButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            }
        });
    }

    // Disable all option buttons
    allOptionButtons.forEach(button => button.disabled = true);
    nextBtn.disabled = false;
}

/**
 * Disables all option buttons when time runs out.
 */
function disableOptions() {
    const allOptionButtons = document.querySelectorAll('.option-btn');
    allOptionButtons.forEach(button => button.disabled = true);
}

/**
 * Highlights the correct answer when time runs out.
 */
function highlightCorrectAnswer() {
    const currentQuizData = shuffledQuizData[currentQuestion];
    const allOptionButtons = document.querySelectorAll('.option-btn');
    allOptionButtons.forEach(button => {
        if (button.textContent === currentQuizData.correct) {
            button.classList.add('correct');
        }
    });
}

/**
 * Displays the final results of the quiz and saves the score to Firestore.
 */
async function showResults() {
    console.log('Showing results...');
    progressBar.style.width = `100%`;
    questionProgressText.textContent = `${totalQuestions}/${totalQuestions}`;
    document.querySelector('.quiz-container').innerHTML = `
        <h2>Laksǐ Mie!</h2>
        <p>Yo mvǎkpii: ${score} nɑ́ ${totalQuestions}</p>
        <button id="replay-btn" class="replay-btn">Patntō'</button>
    `;

    document.getElementById('replay-btn').addEventListener('click', () => {
        if (confirm("Ǒ mɑnkwé' lah mbátntām ndéndēē é?")) {
            location.reload();
        }
    });

    // Save score to Firestore leaderboard only if the user is authenticated (not a guest)
    if (!isGuest) {
        try {
            const user = auth.currentUser;
            if (user) {
                const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : '0.00';
                const leaderboardRef = collection(db, 'leaderboard');
                await addDoc(leaderboardRef, {
                    uid: user.uid,
                    email: user.email,
                    score: score,
                    totalQuestions: totalQuestions,
                    percentage: parseFloat(percentage), // Store as a number for sorting
                    timestamp: new Date()
                });
                console.log('Score saved to leaderboard.');
            }
        } catch (error) {
            console.error('Error saving score to leaderboard:', error);
            alert('Failed to save score to leaderboard.');
        }
    } else {
        console.log('Guest user did not save score to leaderboard.');
    }

    // Call displayLeaderboard after saving the score
    await displayLeaderboard(); // Ensure this is called correctly
}

/**
 * Updates the progress bar based on the current question.
 */
function updateProgressBar() {
    const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;
    console.log(`Updating progress bar to ${progressPercent}%`);
    progressBar.style.width = `${progressPercent}%`;
    questionProgressText.textContent = `${currentQuestion + 1}/${totalQuestions}`;
}

/**
 * Plays a random sound from the provided array.
 * @param {Array} soundsArray - Array of sound file paths.
 */
function playRandomSound(soundsArray) {
    const randomIndex = Math.floor(Math.random() * soundsArray.length);
    const sound = new Audio(soundsArray[randomIndex]);
    sound.play().catch(error => {
        console.warn('Audio playback was prevented:', error);
    });
}

/**
 * Proceeds to the next question in the quiz.
 */
function nextQuestion() {
    currentQuestion++;
    if (currentQuestion < totalQuestions) {
        loadQuestion();
    } else {
        showResults();
    }
}

/**
 * Displays the leaderboard by fetching top scores from Firestore.
 */
async function displayLeaderboard() {
    console.log('Displaying leaderboard...');
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.classList.add('leaderboard');
    leaderboardContainer.innerHTML = '<h2>Leaderboard</h2>';

    try {
        const leaderboardRef = collection(db, 'leaderboard');
        const q = query(
            leaderboardRef,
            orderBy('percentage', 'desc'),  // Primary sort: percentage descending
            orderBy('timestamp', 'asc'),    // Secondary sort: timestamp ascending
            limit(10)                       // Limit to top 10 entries
        );
        const querySnapshot = await getDocs(q);
        console.log('Fetched leaderboard data:', querySnapshot.docs.length); // Debugging statement

        const leaderboardList = document.createElement('ol');

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Ensure totalQuestions is greater than zero to avoid division by zero
            const totalQuestions = data.totalQuestions || 0;
            const score = data.score || 0;
            const percentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : '0.00';
            
            const listItem = document.createElement('li');
            listItem.textContent = `${data.email}: ${percentage}% (${score}/${totalQuestions})`;
            leaderboardList.appendChild(listItem);
        });

        leaderboardContainer.appendChild(leaderboardList);
    } catch (error) {
        console.error('Error retrieving leaderboard:', error);
        alert('Failed to load leaderboard.');
        return; // Exit the function if there's an error
    }

    // Remove any existing leaderboard to prevent duplicates
    const existingLeaderboard = document.querySelector('.leaderboard');
    if (existingLeaderboard) {
        existingLeaderboard.remove();
    }

    document.querySelector('.quiz-container').appendChild(leaderboardContainer);
    console.log('Leaderboard displayed successfully.');
}

// Event Listener for Start Quiz Button
startBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    startQuiz();
});

// Event Listener for Next Question Button
nextBtn.addEventListener('click', () => {
    console.log('Next button clicked');
    nextQuestion();
});

/* Authentication Code Starts Here */

// DOM Elements for authentication
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const showSignupLink = document.getElementById('show-signup');

const signupForm = document.getElementById('signup-form');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupBtn = document.getElementById('signup-btn');
const showLoginLink = document.getElementById('show-login');

const continueGuestBtn = document.getElementById('continue-guest-btn'); // New
const signOutBtn = document.getElementById('signout-btn'); // Now in footer

// Toggle between login and signup forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    console.log('Switched to Signup form');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    console.log('Switched to Login form');
});

// Handle login
loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully');
        // User logged in
        authContainer.style.display = 'none';
        startScreen.style.display = 'block';
        signOutBtn.style.display = 'block';
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
    }
});

// Handle signup
signupBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log('Signup button clicked'); // Debugging statement
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User signed up successfully'); // Debugging statement
        // User signed up and logged in
        authContainer.style.display = 'none';
        startScreen.style.display = 'block';
        signOutBtn.style.display = 'block';
    } catch (error) {
        console.error('Signup failed:', error); // Debugging statement
        alert('Signup failed: ' + error.message);
    }
});

// Handle "Continue as Guest"
continueGuestBtn.addEventListener('click', () => {
    console.log('Continue as Guest clicked');
    isGuest = true;
    authContainer.style.display = 'none';
    startScreen.style.display = 'block';
    signOutBtn.style.display = 'none'; // Hide sign out button for guest users
});

// Monitor Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is authenticated
        console.log('User is signed in:', user.email);
        authContainer.style.display = 'none';
        startScreen.style.display = 'block';
        signOutBtn.style.display = 'block';
        isGuest = false; // Reset guest status if a user logs in
    } else {
        // User is signed out
        console.log('No user is signed in');
        if (!isGuest) {
            authContainer.style.display = 'block';
            startScreen.style.display = 'none';
            signOutBtn.style.display = 'none';
        }
        // If isGuest is true, do not display signOutBtn
    }
});

// Handle Sign Out
signOutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log('User signed out');
        authContainer.style.display = 'block';
        startScreen.style.display = 'none';
        signOutBtn.style.display = 'none';
    }).catch((error) => {
        console.error('Sign-out error:', error);
        alert('Failed to sign out. Please try again.');
    });
});
