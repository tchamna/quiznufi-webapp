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
// Import Firebase SDKs and initialize Firebase (same as before)

// State Variables
// State Variables
let currentQuestion = 0;
let score = 0;
let timeLeft = 0;
let timerInterval;
let autoNextTimeout;
let allQuizData = []; // Array to hold all questions fetched from Firestore
let shuffledQuizData = []; // Array to hold shuffled questions for the quiz
let totalQuestions = 0; // Total number of questions in the round

// DOM Elements
const questionEl = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const questionProgressText = document.getElementById('question-progress-text'); // New element for question progress text
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const questionCountInput = document.getElementById('question-count'); // Input element for number of questions

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
timerSound.loop = false; // Set to false to allow the music to end before restarting

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
    if (allQuizData.length === 0) {
        await initializeQuiz(); // Ensure that questions are fetched before proceeding
    }

    setNumberOfQuestions(); // Set the number of questions based on user input

    // Hide start screen and show quiz screen
    startScreen.style.display = 'none';
    document.getElementById('question-container').style.display = 'block';
    document.getElementById('options-container').style.display = 'flex';
    nextBtn.style.display = 'inline-block';

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
 * Displays the final results of the quiz.
 */
function showResults() {
    progressBar.style.width = `100%`;
    questionProgressText.textContent = `${totalQuestions}/${totalQuestions}`; // Show final state as total/total
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
}


/**
 * Updates the progress bar based on the current question.
 */
function updateProgressBar() {
    const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;
    const questionProgressText = document.getElementById('question-progress-text');
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

// Event Listener for Start Quiz Button
startBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    startQuiz();
});

// Event Listener for Next Question Button
nextBtn.addEventListener('click', () => {
    nextQuestion();
});
