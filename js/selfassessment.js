document.addEventListener('DOMContentLoaded', () => {
    
    // Custom Alert Function
    window.showCustomAlert = function(title, message, type, onSuccessCallback = null) {
        const overlay = document.getElementById('custom-alert-overlay');
        const alertBox = document.getElementById('custom-alert-box');
        const icon = document.getElementById('custom-alert-icon');
        document.getElementById('custom-alert-title').innerText = title;
        document.getElementById('custom-alert-message').innerText = message;
        if (type === 'error') {
            alertBox.className = 'custom-alert-box custom-alert-error';
            icon.innerHTML = "<i class='bx bx-error-circle'></i>";
        } else {
            alertBox.className = 'custom-alert-box custom-alert-success';
            icon.innerHTML = "<i class='bx bx-check-circle'></i>";
        }
        overlay.classList.add('show');
        window.currentAlertCallback = onSuccessCallback;
    };

    window.closeCustomAlert = function() {
        document.getElementById('custom-alert-overlay').classList.remove('show');
        if (typeof window.currentAlertCallback === 'function') {
            window.currentAlertCallback();
            window.currentAlertCallback = null;
        }
    };

    // Fisher-Yates Array Shuffle Algorithm
    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // --- NEW: AUTOMATED LEVEL GENERATOR ---
    // This function creates 10 random levels using live APIs, completely bypassing manual URLs
    function generateDynamicLevels() {
        let levels = [];
        
        // Generate 5 FAKE (AI) Levels
        for (let i = 0; i < 5; i++) {
            levels.push({
                // Add a random number to force a new image every time (Cache-busting)
                src: `https://thispersondoesnotexist.com/?random=${Math.random()}`, 
                isAI: true,
                explanation: "This is an AI-generated face created by a Generative Adversarial Network (GAN). Since this image was generated live, we can't point to a specific spot, but look closely at the edges of the hair, the symmetry of the ears/glasses, or the background. GANs often struggle with these details and cause them to 'melt' together.",
                hotspots: [] // No hotspots for dynamic images
            });
        }

        // Generate 5 REAL Levels
        for (let i = 0; i < 5; i++) {
            levels.push({
                // Picsum gives a random real photograph
                src: `https://picsum.photos/800/500?random=${Math.random()}`, 
                isAI: false,
                explanation: "This is a genuine photograph pulled from a live photography database. Notice how the lighting, depth of field, and structural lines are perfectly logical and consistent.",
                hotspots: []
            });
        }

        // Shuffle the 10 levels so the user never knows if the next one is real or fake
        return shuffleArray(levels);
    }

    // Game Variables
    let currentSessionLevels = [];
    let currentLevelIndex = 0;
    let score = 0;

    // Initialize Game
    window.initGame = function() {
        // Generate a fresh batch of 10 dynamic images every time they play
        currentSessionLevels = generateDynamicLevels();
        
        currentLevelIndex = 0;
        score = 0;
        
        document.getElementById('total-rounds').innerText = currentSessionLevels.length;
        document.getElementById('end-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        updateScoreBoard();
        loadLevel();
    };

    window.loadLevel = function() {
        const level = currentSessionLevels[currentLevelIndex];
        
        // Reset UI
        document.getElementById('image-stage').classList.remove('dimmed');
        document.getElementById('hotspots-container').innerHTML = '';
        document.getElementById('controls-area').style.display = 'block';
        document.getElementById('feedback-panel').style.display = 'none';
        
        // Load Image (Show a loading state while the API fetches the image)
        const imgEl = document.getElementById('game-image');
        imgEl.style.opacity = '0.5'; 
        imgEl.src = level.src;
        
        imgEl.onload = function() {
            imgEl.style.opacity = '1';
        };
    };

    window.makeGuess = function(userGuessedAI) {
        const level = currentSessionLevels[currentLevelIndex];
        const isCorrect = (userGuessedAI === level.isAI);
        
        if (isCorrect) {
            score++;
            updateScoreBoard();
        }

        showFeedback(isCorrect, level);
    };

    window.showFeedback = function(isCorrect, level) {
        // Hide controls, show feedback
        document.getElementById('controls-area').style.display = 'none';
        
        const feedbackPanel = document.getElementById('feedback-panel');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackText = document.getElementById('feedback-explanation');
        const imageStage = document.getElementById('image-stage');

        feedbackPanel.style.display = 'block';

        if (isCorrect) {
            feedbackPanel.className = 'feedback-panel correct-theme';
            feedbackTitle.innerText = "Correct!";
            feedbackIcon.innerHTML = "<i class='bx bx-check-circle'></i>";
        } else {
            feedbackPanel.className = 'feedback-panel incorrect-theme';
            feedbackTitle.innerText = "Not Quite!";
            feedbackIcon.innerHTML = "<i class='bx bx-x-circle'></i>";
        }

        feedbackText.innerText = level.explanation;

        // Dim the image slightly if it's AI to match the theme
        if (level.isAI) {
            imageStage.classList.add('dimmed');
        }
    };

    window.nextRound = function() {
        currentLevelIndex++;
        if (currentLevelIndex < currentSessionLevels.length) {
            loadLevel();
        } else {
            showEndScreen();
        }
    };

    window.showEndScreen = function() {
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('end-screen').style.display = 'block';
        
        document.getElementById('final-score').innerText = `${score}/${currentSessionLevels.length}`;
        
        const msgEl = document.getElementById('final-message');
        const percentage = score / currentSessionLevels.length;
        
        if (percentage === 1) {
            msgEl.innerText = "Flawless! You have an incredible eye for catching manipulated media.";
        } else if (percentage >= 0.5) {
            msgEl.innerText = "Good job! You spotted some of the artifacts, but a few deepfakes managed to slip by you.";
        } else {
            msgEl.innerText = "AI is getting tricky! Review the articles and glossary to learn more about visual artifacts, and try again.";
        }
    };

    function updateScoreBoard() {
        document.getElementById('current-score').innerText = score;
    }

    // Start the game on load
    initGame();
});