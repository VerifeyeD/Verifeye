document.addEventListener('DOMContentLoaded', () => {
    const QUIZ_HISTORY_KEY = 'verifeye-self-assessment-history';
    const QUIZ_HISTORY_LIMIT = 4;

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

    function pauseActiveMedia() {
        document.getElementById('game-audio').pause();
        document.getElementById('game-video').pause();
    }

    function renderHotspots(level) {
        const hotspotsContainer = document.getElementById('hotspots-container');
        hotspotsContainer.innerHTML = '';

        if (level.mediaType !== 'image' || !level.isAI || !Array.isArray(level.hotspots)) {
            return;
        }

        level.hotspots.forEach((spot) => {
            const spotElement = document.createElement('div');
            spotElement.className = 'hotspot';
            spotElement.style.left = `${spot.x}%`;
            spotElement.style.top = `${spot.y}%`;

            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            tooltip.innerText = spot.text;

            spotElement.appendChild(tooltip);
            hotspotsContainer.appendChild(spotElement);
        });
    }

    function shuffleArray(array) {
        const copy = [...array];
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
        }
        return copy;
    }

    function getPromptForMediaType(mediaType) {
        if (mediaType === 'audio') {
            return 'Listen closely for voice smoothness, pacing, and other synthetic cues before guessing.';
        }
        if (mediaType === 'video') {
            return 'Watch for face warping, inconsistent motion, or flickering details before you decide.';
        }
        return 'Inspect the image for texture glitches, strange geometry, or unusually smooth details.';
    }

    let currentSessionLevels = [];
    let currentLevelIndex = 0;
    let score = 0;
    let hasStoredCurrentQuiz = false;

    function getRecentQuizHistory() {
        try {
            const rawValue = localStorage.getItem(QUIZ_HISTORY_KEY);
            const parsed = JSON.parse(rawValue || '[]');
            return Array.isArray(parsed) ? parsed.filter(Array.isArray) : [];
        } catch (error) {
            console.warn('Failed to read quiz history:', error);
            return [];
        }
    }

    function getExcludedItemIds() {
        return getRecentQuizHistory().flat();
    }

    function rememberCompletedQuiz() {
        if (hasStoredCurrentQuiz || !currentSessionLevels.length) {
            return;
        }

        const history = getRecentQuizHistory();
        history.push(currentSessionLevels.map((item) => item.id));
        while (history.length > QUIZ_HISTORY_LIMIT) {
            history.shift();
        }

        localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
        hasStoredCurrentQuiz = true;
    }

    async function fetchQuizItems() {
        const excludedItemIds = getExcludedItemIds();
        const query = new URLSearchParams({
            ts: String(Date.now())
        });

        if (excludedItemIds.length) {
            query.set('exclude', excludedItemIds.join(','));
        }

        const response = await fetch(`/api/self-assessment/quiz?${query.toString()}`, {
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error('Could not load self-assessment quiz data.');
        }

        const payload = await response.json();
        return shuffleArray(payload.items);
    }

    window.initGame = async function() {
        try {
            pauseActiveMedia();
            document.getElementById('game-container').style.display = 'block';
            document.getElementById('end-screen').style.display = 'none';
            document.getElementById('media-prompt').innerText = 'Loading quiz items...';

            currentSessionLevels = await fetchQuizItems();
            currentLevelIndex = 0;
            score = 0;
            hasStoredCurrentQuiz = false;

            document.getElementById('total-rounds').innerText = currentSessionLevels.length;
            updateScoreBoard();
            loadLevel();
        } catch (error) {
            console.error(error);
            showCustomAlert('Quiz Unavailable', 'The self-assessment media set could not be loaded right now. Please try again in a moment.', 'error');
        }
    };

    window.loadLevel = function() {
        const level = currentSessionLevels[currentLevelIndex];
        if (!level) {
            showEndScreen();
            return;
        }

        pauseActiveMedia();

        const imageStage = document.getElementById('image-stage');
        const imageElement = document.getElementById('game-image');
        const audioElement = document.getElementById('game-audio');
        const videoElement = document.getElementById('game-video');

        imageStage.classList.remove('dimmed');
        document.getElementById('hotspots-container').innerHTML = '';
        document.getElementById('controls-area').style.display = 'block';
        document.getElementById('feedback-panel').style.display = 'none';
        document.getElementById('media-type-pill').innerText = level.mediaType.toUpperCase();
        document.getElementById('round-pill').innerText = `Question ${currentLevelIndex + 1} of ${currentSessionLevels.length}`;
        document.getElementById('media-prompt').innerText = getPromptForMediaType(level.mediaType);

        imageElement.style.display = 'none';
        audioElement.style.display = 'none';
        videoElement.style.display = 'none';
        imageElement.removeAttribute('src');
        audioElement.removeAttribute('src');
        videoElement.removeAttribute('src');
        videoElement.onloadedmetadata = null;
        videoElement.ontimeupdate = null;

        if (level.mediaType === 'image') {
            imageElement.style.display = 'block';
            imageElement.style.opacity = '0.4';
            imageElement.src = level.src;
            imageElement.onload = function() {
                imageElement.style.opacity = '1';
            };
            imageElement.onerror = function() {
                imageElement.alt = 'Image failed to load';
                imageElement.style.opacity = '1';
            };
        } else if (level.mediaType === 'audio') {
            audioElement.style.display = 'block';
            audioElement.src = level.src;
            audioElement.load();
        } else if (level.mediaType === 'video') {
            videoElement.style.display = 'block';
            videoElement.src = level.src;
            videoElement.onloadedmetadata = function() {
                if (typeof level.clipStart === 'number') {
                    videoElement.currentTime = level.clipStart;
                }
            };
            videoElement.ontimeupdate = function() {
                if (typeof level.clipEnd === 'number' && videoElement.currentTime >= level.clipEnd) {
                    videoElement.pause();
                }
            };
            videoElement.load();
        }
    };

    window.makeGuess = function(userGuessedAI) {
        const level = currentSessionLevels[currentLevelIndex];
        const isCorrect = userGuessedAI === level.isAI;

        pauseActiveMedia();

        if (isCorrect) {
            score += 1;
            updateScoreBoard();
        }

        showFeedback(isCorrect, level);
    };

    window.showFeedback = function(isCorrect, level) {
        const imageStage = document.getElementById('image-stage');
        const feedbackPanel = document.getElementById('feedback-panel');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackIcon = document.getElementById('feedback-icon');
        const feedbackText = document.getElementById('feedback-explanation');
        const feedbackSource = document.getElementById('feedback-source');

        document.getElementById('controls-area').style.display = 'none';
        feedbackPanel.style.display = 'block';

        if (isCorrect) {
            feedbackPanel.className = 'feedback-panel correct-theme';
            feedbackTitle.innerText = 'Correct!';
            feedbackIcon.innerHTML = "<i class='bx bx-check-circle'></i>";
        } else {
            feedbackPanel.className = 'feedback-panel incorrect-theme';
            feedbackTitle.innerText = 'Not Quite!';
            feedbackIcon.innerHTML = "<i class='bx bx-x-circle'></i>";
        }

        if (level.isAI) {
            imageStage.classList.add('dimmed');
        }

        feedbackText.innerText = level.explanation;
        renderHotspots(level);
        if (level.sourceUrl) {
            feedbackSource.innerHTML = `Source: <a href="${level.sourceUrl}" target="_blank" rel="noopener noreferrer">${level.sourceName}</a> (${level.license})`;
        } else {
            feedbackSource.innerText = `Source: ${level.sourceName} (${level.license})`;
        }
    };

    window.nextRound = function() {
        currentLevelIndex += 1;
        if (currentLevelIndex < currentSessionLevels.length) {
            loadLevel();
        } else {
            showEndScreen();
        }
    };

    window.showEndScreen = function() {
        pauseActiveMedia();
        rememberCompletedQuiz();
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('end-screen').style.display = 'block';
        document.getElementById('final-score').innerText = `${score}/${currentSessionLevels.length}`;

        const msgEl = document.getElementById('final-message');
        const percentage = currentSessionLevels.length ? score / currentSessionLevels.length : 0;

        if (percentage === 1) {
            msgEl.innerText = 'Perfect run. You handled images, voices, and video clips with an expert eye.';
        } else if (percentage >= 0.7) {
            msgEl.innerText = 'Strong result. You are catching a lot of the tells, but a few synthetic clips still slipped through.';
        } else if (percentage >= 0.4) {
            msgEl.innerText = 'Solid start. Review the explanations and try again to sharpen your instincts across all three media types.';
        } else {
            msgEl.innerText = 'AI media is getting convincing. Use the glossary and articles, then come back for another round.';
        }
    };

    function updateScoreBoard() {
        document.getElementById('current-score').innerText = score;
    }

    initGame();
});
