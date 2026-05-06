document.addEventListener('DOMContentLoaded', () => {
    
    // --- CUSTOM ALERT FUNCTION ---
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

    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // --- 1. YOUR 10-ITEM DATASET ---
    const localDataset = [
        // --- 5 AI IMAGES ---
        {
            src: "../assets/images/dataset/ai_1.jpg", 
            isAI: true,
            explanation: "This is AI-generated. Notice the structural errors here.",
            // I added a temporary hotspot here so you can SEE the marking feature work!
            hotspots: [{ x: 50, y: 50, text: "Temporary Mark: Look here!" }] 
        },
        {
            src: "../assets/images/dataset/ai_2.jpg", 
            isAI: true,
            explanation: "AI generated. The background details blend together unnaturally.",
            hotspots: [{ x: 40, y: 60, text: "Temporary Mark: Weird blending" }] 
        },
        {
            src: "../assets/images/dataset/ai_3.jpg", 
            isAI: true,
            explanation: "AI generated. Look closely at the lighting and shadows; they contradict each other.",
            hotspots: [{ x: 70, y: 30, text: "Temporary Mark: Lighting error" }] 
        },
        {
            src: "../assets/images/dataset/ai_4.jpg", 
            isAI: true,
            explanation: "AI generated. The textures on these surfaces are completely inconsistent.",
            hotspots: [{ x: 20, y: 80, text: "Temporary Mark: Texture glitch" }] 
        },
        {
            src: "../assets/images/dataset/ai_5.jpg", 
            isAI: true,
            explanation: "AI generated. There is nonsensical text or warped geometry in this area.",
            hotspots: [{ x: 80, y: 50, text: "Temporary Mark: Warped shape" }] 
        },

        // --- 5 REAL IMAGES ---
        {
            src: "../assets/images/dataset/real_1.jpg", 
            isAI: false,
            explanation: "Genuine photograph. The physics of the scene make perfect sense.",
            hotspots: [] // Always empty for real images
        },
        {
            src: "../assets/images/dataset/real_2.jpg", 
            isAI: false,
            explanation: "Genuine photograph. Notice the consistent depth of field.",
            hotspots: [] 
        },
        {
            src: "../assets/images/dataset/real_3.jpg", 
            isAI: false,
            explanation: "Genuine photograph. All structural lines are straight and logical.",
            hotspots: [] 
        },
        {
            src: "../assets/images/dataset/real_4.jpg", 
            isAI: false,
            explanation: "Genuine photograph. The textures and materials look physically accurate.",
            hotspots: [] 
        },
        {
            src: "../assets/images/dataset/real_5.jpg", 
            isAI: false,
            explanation: "Genuine photograph. Complex details like foliage or crowds are rendered perfectly.",
            hotspots: [] 
        }
    ];

    function generateDynamicLevels() {
        // Shuffles the array and selects all 10 items for the game
        return shuffleArray([...localDataset]).slice(0, 10); 
    }

    let currentSessionLevels = [];
    let currentLevelIndex = 0;
    let score = 0;

    window.initGame = function() {
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
        
        document.getElementById('image-stage').classList.remove('dimmed');
        document.getElementById('hotspots-container').innerHTML = '';
        document.getElementById('controls-area').style.display = 'block';
        document.getElementById('feedback-panel').style.display = 'none';
        
        const imgEl = document.getElementById('game-image');
        imgEl.style.opacity = '0.5'; 
        imgEl.src = level.src;
        
        // --- THE ZOOM FIX FOR WATERMARKS ---
        // This zooms the image by 15% and anchors it to the top, pushing the bottom watermark out of view.
        imgEl.style.transform = 'scale(1.15)'; 
        imgEl.style.transformOrigin = 'center top';
        
        imgEl.onload = function() {
            imgEl.style.opacity = '1';
        };
        
        imgEl.onerror = function() {
            imgEl.src = "https://via.placeholder.com/800x500?text=Image+Not+Found+-+Check+File+Name";
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
        document.getElementById('controls-area').style.display = 'none';
        
        const feedbackPanel = document.getElementById('feedback-panel');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackText = document.getElementById('feedback-explanation');
        const imageStage = document.getElementById('image-stage');
        const hotspotsContainer = document.getElementById('hotspots-container');

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

        if (level.isAI) {
            imageStage.classList.add('dimmed');
        }

        // --- THE MARKING FEATURE RENDERER ---
        hotspotsContainer.innerHTML = ''; 
        if (level.hotspots && level.hotspots.length > 0) {
            level.hotspots.forEach(spot => {
                const spotEl = document.createElement('div');
                spotEl.className = 'hotspot';
                spotEl.style.left = `${spot.x}%`;
                spotEl.style.top = `${spot.y}%`;
                
                const tooltip = document.createElement('span');
                tooltip.className = 'tooltip';
                tooltip.innerText = spot.text;
                
                spotEl.appendChild(tooltip);
                hotspotsContainer.appendChild(spotEl);
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

    initGame();

    // --- THE MAGIC COORDINATE FINDER ---
    document.addEventListener('click', function(e) {
        const imageStage = document.getElementById('image-stage');
        if (imageStage && imageStage.contains(e.target) && e.target.id === 'game-image') {
            const rect = imageStage.getBoundingClientRect();
            const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
            const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
            
            const copyText = `{ x: ${x}, y: ${y}, text: "Explain the AI mistake here" }`;
            prompt("Copy this code and paste it into your localDataset hotspots array:", copyText);
        }
    });

});