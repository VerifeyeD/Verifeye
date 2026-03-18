// Main Dataset Pool
// Note: Replace the "src" links with paths to your actual images in the assets folder!
const arcadeLevelsPool = [
    {
        src: "https://via.placeholder.com/800x500.png?text=Man+with+7+fingers", 
        isAI: true,
        explanation: "This image is AI-generated. The generative model failed to render the anatomy correctly, giving the subject seven fingers on one hand—a common artifact in deepfakes.",
        hotspots: [{ top: "50%", left: "40%", text: "Extra fingers" }]
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=Real+Photograph+of+a+City", 
        isAI: false,
        explanation: "This is a genuine photograph. The lighting, reflections, and background text are perfectly consistent with reality.",
        hotspots: [] 
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=AI+Generated+Earrings", 
        isAI: true,
        explanation: "This is an AI-generated portrait. If you look closely at the jewelry, the earrings are completely asymmetrical and blend unnaturally into the skin.",
        hotspots: [
            { top: "60%", left: "30%", text: "Mismatched earring" },
            { top: "62%", left: "70%", text: "Earring blending into skin" }
        ]
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=Real+Portrait", 
        isAI: false,
        explanation: "This is a real photograph. The textures of the clothing, the stray hairs, and the background depth of field are all authentic.",
        hotspots: []
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=AI+Generated+Text+Sign", 
        isAI: true,
        explanation: "This is AI-generated. While the overall image looks realistic, the text on the sign in the background is complete gibberish and alien-like, a dead giveaway for generative AI.",
        hotspots: [{ top: "30%", left: "80%", text: "Gibberish text" }]
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=Real+Dog+Running", 
        isAI: false,
        explanation: "This is a real photo. The motion blur and lighting are physically accurate.",
        hotspots: []
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=AI+Melted+Background", 
        isAI: true,
        explanation: "This is an AI generation. Look at the background objects—they melt into each other without clear physical boundaries.",
        hotspots: [{ top: "20%", left: "85%", text: "Melting background elements" }]
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=Real+Street+Market", 
        isAI: false,
        explanation: "This is genuine. All the background text on the signs is perfectly legible and physically consistent.",
        hotspots: []
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=AI+Glasses+Error", 
        isAI: true,
        explanation: "This is an AI-generated face. The frame of the glasses doesn't connect properly over the bridge of the nose.",
        hotspots: [{ top: "40%", left: "50%", text: "Incomplete glasses frame" }]
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=Real+Crowd", 
        isAI: false,
        explanation: "This is a genuine photograph of a crowd. Every face in the background has consistent lighting and proportions.",
        hotspots: []
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=AI+Zipper+Glitch", 
        isAI: true,
        explanation: "This is AI-generated. The zipper on the jacket merges directly into the fabric instead of functioning mechanically.",
        hotspots: [{ top: "75%", left: "50%", text: "Nonsensical zipper" }]
    },
    {
        src: "https://via.placeholder.com/800x500.png?text=Real+Historical+Photo", 
        isAI: false,
        explanation: "This is a real historical photo. The film grain is consistent throughout the entire image.",
        hotspots: []
    }
];

let currentSessionLevels = [];
let currentLevelIndex = 0;
let score = 0;

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

    // Initialize Game
    window.initGame = function() {
        // 1. Shuffle the entire pool of images
        const shuffledPool = shuffleArray([...arcadeLevelsPool]);
        
        // 2. Take only the first 10 items (or fewer if the pool is small)
        currentSessionLevels = shuffledPool.slice(0, 10);
        
        currentLevelIndex = 0;
        score = 0;
        
        document.getElementById('total-rounds').innerText = currentSessionLevels.length;
        document.getElementById('end-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        updateScoreBoard();
        loadLevel();
    };

    window.loadLevel = function() {
        // Pull the level from our randomized 10-item session array
        const level = currentSessionLevels[currentLevelIndex];
        
        // Reset UI
        document.getElementById('image-stage').classList.remove('dimmed');
        document.getElementById('hotspots-container').innerHTML = '';
        document.getElementById('controls-area').style.display = 'block';
        document.getElementById('feedback-panel').style.display = 'none';
        
        // Load Image
        const imgEl = document.getElementById('game-image');
        imgEl.src = level.src;
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

        // If it's an AI image, dim the image and plot the hotspots
        if (level.isAI && level.hotspots.length > 0) {
            imageStage.classList.add('dimmed');
            
            const hotspotContainer = document.getElementById('hotspots-container');
            level.hotspots.forEach(spot => {
                const dot = document.createElement('div');
                dot.className = 'hotspot';
                dot.style.top = spot.top;
                dot.style.left = spot.left;
                
                const tooltip = document.createElement('span');
                tooltip.className = 'tooltip';
                tooltip.innerText = spot.text;
                
                dot.appendChild(tooltip);
                hotspotContainer.appendChild(dot);
            });
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