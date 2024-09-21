// Quiz Data
const quizData = [
    {
        question: "Comment appelle-t-on la cuillère en fe'efe'e?",
        options: ["Mfɑ̀'", "Wúzɑ̄", "Lū'"],
        correct: "Lū'",
        time: 30 // 30 seconds for this question
    },
    {
        question: "Pó ncēh wú ntám ...",
        options: ["Kā'", "Cak", "Pú'ŋwɑ'ni"],
        correct: "Pú'ŋwɑ'ni",
        time: 45 // 45 seconds for this question
    },
    {
        question: "Wū yi pó ndáh ncēh wen lɑ́ mɑ́",
        options: ["Mvī", "Zēn", "Ndhī", "Nū"],
        correct: "Zēn",
        time: 60 // 60 seconds for this question
    },
    // Ajoutez plus de questions selon vos besoins
];

// State Variables
let currentQuestion = 0;
let score = 0;
let timeLeft = 0;
let timerInterval;

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
    'resources/correct_answer3.mp3'
];

const wrongSounds = [
    'resources/wrong_answer1.mp3',
    'resources/wrong_answer2.mp3',
    'resources/wrong_answer3.mp3',
    'resources/wrong_answer4.mp3'
];

const timerSound = new Audio('resources/clock-timer-reverb.mp3');
timerSound.loop = true;

/**
 * Commence le compte à rebours du timer.
 * @param {number} duration - Durée du timer en secondes.
 */
function startTimer(duration) {
    timeLeft = duration;
    timeEl.textContent = timeLeft;
    timerSound.currentTime = 0;
    timerSound.play().catch(error => {
        console.warn('Timer sound playback was prevented:', error);
    });

    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerSound.pause();
            disableOptions();
            highlightCorrectAnswer();
            nextBtn.disabled = false;
        }
    }, 1000);
}

/**
 * Charge la question actuelle et génère les boutons d'options.
 */
function loadQuestion() {
    resetState();
    const currentQuizData = quizData[currentQuestion];
    questionEl.textContent = currentQuizData.question;
    optionsContainer.innerHTML = ''; // Vider les options précédentes

    currentQuizData.options.forEach((option, index) => {
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
 * Réinitialise l'état avant de charger une nouvelle question.
 */
function resetState() {
    nextBtn.disabled = true;
    clearInterval(timerInterval);
    timerSound.pause();
}

/**
 * Sélectionne une option et vérifie la réponse.
 * @param {HTMLElement} selectedButton - Le bouton sélectionné.
 * @param {string} correctAnswer - La bonne réponse.
 */
function selectOption(selectedButton, correctAnswer) {
    const allOptionButtons = document.querySelectorAll('.option-btn');
    clearInterval(timerInterval);
    timerSound.pause();

    if (selectedButton.textContent === correctAnswer) {
        selectedButton.classList.add('correct');
        score++;
        scoreEl.textContent = score;
        playRandomSound(correctSounds);
    } else {
        selectedButton.classList.add('wrong');
        playRandomSound(wrongSounds);
        // Mettre en évidence la bonne réponse
        allOptionButtons.forEach(button => {
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            }
        });
    }

    // Désactiver tous les boutons d'options
    allOptionButtons.forEach(button => button.disabled = true);
    nextBtn.disabled = false;
}

/**
 * Désactive toutes les options lorsque le temps est écoulé.
 */
function disableOptions() {
    const allOptionButtons = document.querySelectorAll('.option-btn');
    allOptionButtons.forEach(button => button.disabled = true);
}

/**
 * Met en évidence la bonne réponse lorsque le temps est écoulé.
 */
function highlightCorrectAnswer() {
    const currentQuizData = quizData[currentQuestion];
    const allOptionButtons = document.querySelectorAll('.option-btn');
    allOptionButtons.forEach(button => {
        if (button.textContent === currentQuizData.correct) {
            button.classList.add('correct');
        }
    });
}

/**
 * Affiche les résultats finaux du quiz.
 */
function showResults() {
    progressBar.style.width = `100%`;
    document.querySelector('.quiz-container').innerHTML = `
        <h2>Laksǐ Mie!</h2>
        <p>Yo mvǎkpii: ${score} nɑ́ ${quizData.length}</p>
        <button id="replay-btn" class="replay-btn">Patntō'</button>
    `;
    document.getElementById('replay-btn').addEventListener('click', () => {
        if (confirm("Ǒ mɑnkwé' lah mbátntām ndéndēē é?")) {
            location.reload();
        }
    });
}

/**
 * Met à jour la barre de progression.
 */
function updateProgressBar() {
    const progressPercent = ((currentQuestion) / quizData.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

/**
 * Joue un son aléatoire à partir d'un tableau de chemins de fichiers audio.
 * @param {Array} soundsArray - Tableau contenant les chemins des fichiers audio.
 */
function playRandomSound(soundsArray) {
    const randomIndex = Math.floor(Math.random() * soundsArray.length);
    const sound = new Audio(soundsArray[randomIndex]);
    sound.play().catch(error => {
        console.warn('Audio playback was prevented:', error);
    });
}

/**
 * Démarre le quiz après l'interaction de l'utilisateur.
 */
function startQuiz() {
    startScreen.style.display = 'none';
    document.getElementById('question-container').style.display = 'block';
    document.getElementById('options-container').style.display = 'flex';
    nextBtn.style.display = 'inline-block';
    loadQuestion();
}

// Gestionnaire de clic pour le bouton "Start Quiz".
startBtn.addEventListener('click', () => {
    startQuiz();
});

// Gestionnaire de clic pour le bouton "Question Suivante".
nextBtn.addEventListener('click', () => {
    currentQuestion++;
    updateProgressBar();
    if (currentQuestion < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
});
