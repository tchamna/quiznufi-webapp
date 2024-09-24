// Import Firebase SDKs

// Import Firebase SDKs from local modules
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs } from "firebase/firestore";


// Your Firebase configuration (retrieved from environment variables)
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


// State Variables
let currentQuestion = 0;
let score = 0;
let timeLeft = 0;
let timerInterval;
let autoNextTimeout;
let shuffledQuizData = []; // Array to hold shuffled questions

// DOM Elements
const questionEl = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

// Audio Resources
const correctSounds = [
    'resources/correct_answer1.mp3',
    'resources/correct_answer2.mp3',
];

const wrongSounds = [
    'resources/wrong_answer1.mp3',
    'resources/wrong_answer2.mp3',
];

const timerSound = new Audio('resources/quiz-game-music-loop.mp3');
timerSound.loop = true;

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
 * Initializes the quiz by fetching and shuffling questions.
 */
async function initializeQuiz() {
    try {
        // Fetch questions from Firestore
        const querySnapshot = await getDocs(collection(db, "questions"));
        querySnapshot.forEach((doc) => {
            shuffledQuizData.push(doc.data());
        });

        // Shuffle the questions
        shuffleArray(shuffledQuizData);
    } catch (error) {
        console.error('Error fetching quiz data:', error);
        alert('Failed to load quiz data. Please try again later.');
    }
}

/**
 * Starts the countdown timer.
 * @param {number} duration - Duration in seconds.
 */
function startTimer(duration) {
    timeLeft = duration;
    timeEl.textContent = timeLeft;

    if (timerSound.paused) {
        timerSound.play().catch(error => {
            console.warn('Timer sound playback was prevented:', error);
        });
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            highlightCorrectAnswer();
            disableOptions();
            nextBtn.disabled = false;

            // Move to the next question automatically after 15 seconds
            autoNextTimeout = setTimeout(() => {
                nextQuestion();
            }, 15000);
        }
    }, 1000);
}

/**
 * Loads the current question and generates shuffled option buttons.
 */
function loadQuestion() {
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
}

/**
 * Resets the state before loading a new question.
 */
function resetState() {
    nextBtn.disabled = true;
    clearInterval(timerInterval);
    clearTimeout(autoNextTimeout);
    timerSound.pause(); // Reset the background music
    timerSound.currentTime = 0;
    timerSound.play(); // Restart the background music
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
    timerSound.play(); // Keep background music playing
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
 * Displays the final results of the quiz.
 */
function showResults() {
    progressBar.style.width = `100%`;
    document.querySelector('.quiz-container').innerHTML = `
        <h2>Laksǐ Mie!</h2>
        <p>Yo mvǎkpii: ${score} nɑ́ ${shuffledQuizData.length}</p>
        <button id="replay-btn" class="replay-btn">Patntō'</button>
    `;
    document.getElementById('replay-btn').addEventListener('click', () => {
        if (confirm("Ǒ mɑnkwé' lah mbátntām ndéndēē é?")) {
            location.reload();
        }
    });
}

/**
 * Updates the progress bar based on the current question.
 */
function updateProgressBar() {
    const progressPercent = ((currentQuestion) / shuffledQuizData.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
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
 * Starts the quiz after user interaction.
 */
function startQuiz() {
    initializeQuiz().then(() => {
        startScreen.style.display = 'none';
        document.getElementById('question-container').style.display = 'block';
        document.getElementById('options-container').style.display = 'flex';
        nextBtn.style.display = 'inline-block';
        loadQuestion();
    });
}

/**
 * Proceeds to the next question in the quiz.
 */
function nextQuestion() {
    currentQuestion++;
    updateProgressBar();
    if (currentQuestion < shuffledQuizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Event Listener for Start Quiz Button
startBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    startQuiz();
});

// Event Listener for Next Question Button
nextBtn.addEventListener('click', () => {
    nextQuestion();
});
