// StreamSim Application
export default function initStreamSim(container, windowData) {
    container.classList.add('streamsim-container');
    
    // Create the StreamSim UI
    container.innerHTML = `
        <div class="streamsim-app">
            <div class="streamsim-main">
                <div class="streamsim-video-container">
                    <video id="video-preview" autoplay muted></video>
                    <div class="streamsim-overlay">
                        <div class="streamsim-viewer-count">
                            <span id="viewer-count">0</span> viewers
                        </div>
                    </div>
                </div>
                <div class="streamsim-controls">
                    <button id="start-stream" class="streamsim-button">Start Stream</button>
                    <button id="stop-stream" class="streamsim-button" disabled>Stop Stream</button>
                    <div class="streamsim-settings">
                        <h3>Stream Settings</h3>
                        <div class="streamsim-setting">
                            <label for="chat-style">Chat Style:</label>
                            <select id="chat-style">
                                <option value="normal">Normal</option>
                                <option value="happy">Happy</option>
                                <option value="angry">Angry</option>
                                <option value="meme">Meme</option>
                            </select>
                        </div>
                        <div class="streamsim-setting">
                            <label for="chat-frequency">Chat Frequency:</label>
                            <input type="range" id="chat-frequency" min="1" max="10" value="5">
                        </div>
                        <button id="create-poll" class="streamsim-button">Create Poll</button>
                    </div>
                </div>
            </div>
            <div class="streamsim-chat-panel">
                <div class="streamsim-chat-header">
                    <h3>Live Chat</h3>
                    <button id="popout-chat" class="streamsim-button small">Popout</button>
                </div>
                <div id="chat-messages" class="streamsim-chat-messages"></div>
                <div class="streamsim-chat-input">
                    <input type="text" id="chat-input" placeholder="Say something..." disabled>
                    <button id="send-chat" class="streamsim-button" disabled>Send</button>
                </div>
            </div>
        </div>
        <div id="poll-modal" class="streamsim-modal hidden">
            <div class="streamsim-modal-content">
                <div class="streamsim-modal-header">
                    <h3>Create Poll</h3>
                    <button id="close-poll-modal" class="streamsim-button small">×</button>
                </div>
                <div class="streamsim-modal-body">
                    <div class="streamsim-setting">
                        <label for="poll-question">Question:</label>
                        <input type="text" id="poll-question" placeholder="Ask a question...">
                    </div>
                    <div class="streamsim-setting">
                        <label>Options:</label>
                        <div id="poll-options">
                            <div class="poll-option">
                                <input type="text" placeholder="Option 1" class="poll-option-input">
                            </div>
                            <div class="poll-option">
                                <input type="text" placeholder="Option 2" class="poll-option-input">
                            </div>
                        </div>
                        <button id="add-option" class="streamsim-button small">+ Add Option</button>
                    </div>
                    <div class="streamsim-setting">
                        <label for="poll-duration">Duration (seconds):</label>
                        <input type="number" id="poll-duration" min="10" max="300" value="60">
                    </div>
                </div>
                <div class="streamsim-modal-footer">
                    <button id="create-poll-submit" class="streamsim-button">Create Poll</button>
                </div>
            </div>
        </div>
    `;
    
    // State
    let isStreaming = false;
    let chatMessages = [];
    let viewerCount = 0;
    let chatInterval;
    let pollActive = false;
    let currentPoll = null;
    let videoStream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let popoutWindow = null;
    
    // DOM Elements
    const videoPreview = document.getElementById('video-preview');
    const viewerCountDisplay = document.getElementById('viewer-count');
    const startStreamButton = document.getElementById('start-stream');
    const stopStreamButton = document.getElementById('stop-stream');
    const chatStyleSelect = document.getElementById('chat-style');
    const chatFrequencyInput = document.getElementById('chat-frequency');
    const createPollButton = document.getElementById('create-poll');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat');
    const popoutChatButton = document.getElementById('popout-chat');
    const pollModal = document.getElementById('poll-modal');
    const closePollModalButton = document.getElementById('close-poll-modal');
    const addOptionButton = document.getElementById('add-option');
    const createPollSubmitButton = document.getElementById('create-poll-submit');
    
    // Event Listeners
    startStreamButton.addEventListener('click', startStream);
    stopStreamButton.addEventListener('click', stopStream);
    createPollButton.addEventListener('click', openPollModal);
    closePollModalButton.addEventListener('click', closePollModal);
    addOptionButton.addEventListener('click', addPollOption);
    createPollSubmitButton.addEventListener('click', createPoll);
    popoutChatButton.addEventListener('click', popoutChat);
    sendChatButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Functions
    async function startStream() {
        try {
            // Get user camera
            videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            videoPreview.srcObject = videoStream;
            
            // Start recording
            mediaRecorder = new MediaRecorder(videoStream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.start(1000);
            
            // Update UI
            startStreamButton.disabled = true;
            stopStreamButton.disabled = false;
            chatInput.disabled = false;
            sendChatButton.disabled = false;
            
            // Start simulating viewers and chat
            isStreaming = true;
            simulateViewers();
            simulateChat();
            
        } catch (error) {
            console.error('Error starting stream:', error);
            alert('Could not access camera and microphone. Please check permissions.');
        }
    }
    
    function stopStream() {
        // Stop streaming
        isStreaming = false;
        
        // Stop media recording
        if (mediaRecorder) {
            mediaRecorder.stop();
            
            // Clean up video stream
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                videoStream = null;
            }
            
            videoPreview.srcObject = null;
        }
        
        // Update UI
        startStreamButton.disabled = false;
        stopStreamButton.disabled = true;
        chatInput.disabled = true;
        sendChatButton.disabled = true;
        
        // Clear intervals
        clearInterval(chatInterval);
        
        // Save recorded video (optional)
        if (recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Create download link (optional)
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'stream.webm';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            recordedChunks = [];
        }
    }
    
    function simulateViewers() {
        if (!isStreaming) return;
        
        // Randomly increase or decrease viewer count
        const change = Math.random() > 0.7 ? -1 : 1;
        viewerCount = Math.max(0, viewerCount + change);
        viewerCountDisplay.textContent = viewerCount;
        
        setTimeout(simulateViewers, 2000);
    }
    
    function simulateChat() {
        if (chatInterval) {
            clearInterval(chatInterval);
        }
        
        // Get chat frequency (1-10)
        const frequency = parseInt(chatFrequencyInput.value);
        const interval = 11 - frequency; // Convert to seconds (10 - 1)
        
        chatInterval = setInterval(() => {
            if (!isStreaming) return;
            
            // Generate a random chat message
            const chatStyle = chatStyleSelect.value;
            const randomMessage = generateRandomChatMessage(chatStyle);
            
            addChatMessage(randomMessage.username, randomMessage.message, randomMessage.color);
            
            // If poll is active, simulate votes
            if (pollActive && currentPoll) {
                simulatePollVote();
            }
        }, interval * 1000);
    }
    
    function generateRandomChatMessage(style) {
        const usernames = ['GamerX', 'StreamFan', 'CoolViewer', 'ChatLover', 'ViewerPro', 'StreamEnjoyer', 'GameFan', 'ChatKing', 'StreamQueen', 'ViewerJoy'];
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#8000FF', '#0080FF', '#FF0080'];
        
        const username = usernames[Math.floor(Math.random() * usernames.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        let messages;
        
        switch (style) {
            case 'happy':
                messages = [
                    'This stream is amazing! 😄',
                    'You\'re doing great! 👍',
                    'I love this content! ❤️',
                    'Best stream ever! 🎉',
                    'You make me smile! 😊',
                    'This is so much fun! 🥳',
                    'Keep up the good work! 🌟',
                    'You\'re awesome! 🤩',
                    'I can\'t stop watching! 👀',
                    'This brightened my day! ☀️'
                ];
                break;
            case 'angry':
                messages = [
                    'This is terrible! 😠',
                    'You need to improve! 👎',
                    'I\'ve seen better! 🙄',
                    'Are you even trying? 😤',
                    'This is a waste of time! ⏱️',
                    'Do you know what you\'re doing? 🤦',
                    'I\'m leaving! 👋',
                    'Fix your stream! 🛠️',
                    'This is so bad! 💢',
                    'I can\'t believe I\'m watching this! 😡'
                ];
                break;
            case 'meme':
                messages = [
                    'POG! PogChamp',
                    'KEKW',
                    'monkaS',
                    'OMEGALUL',
                    'Jebaited',
                    'PepeHands',
                    'FeelsBadMan',
                    'FeelsGoodMan',
                    'MonkaW',
                    'LUL'
                ];
                break;
            default: // normal
                messages = [
                    'Hello there!',
                    'How\'s it going?',
                    'Nice stream!',
                    'First time watching, I like it!',
                    'What game is this?',
                    'Where are you from?',
                    'How long have you been streaming?',
                    'Do you stream regularly?',
                    'I like your content!',
                    'Thanks for streaming!'
                ];
        }
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        return { username, message, color };
    }
    
    function addChatMessage(username, message, color = '#000') {
        const chatMessage = {
            username,
            message,
            color,
            timestamp: new Date().getTime()
        };
        
        chatMessages.push(chatMessage);
        
        // Limit chat history to 100 messages
        if (chatMessages.length > 100) {
            chatMessages.shift();
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `
            <span class="username" style="color: ${color}">${username}:</span>
            <span class="message">${message}</span>
        `;
        
        // Add to chat container
        chatMessagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        
        // If popout window is open, add message there too
        if (popoutWindow && !popoutWindow.closed) {
            const popoutChatContainer = popoutWindow.document.getElementById('popout-chat-messages');
            if (popoutChatContainer) {
                const popoutMessageElement = messageElement.cloneNode(true);
                popoutChatContainer.appendChild(popoutMessageElement);
                popoutChatContainer.scrollTop = popoutChatContainer.scrollHeight;
            }
        }
    }
    
    // More functions for handling polls, chat popout, etc.
    // ...existing code...
    
    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;
        
        addChatMessage('You', message, '#FF0000');
        
        chatInput.value = '';
    }
    
    function openPollModal() {
        pollModal.classList.remove('hidden');
    }
    
    function closePollModal() {
        pollModal.classList.add('hidden');
    }
    
    function addPollOption() {
        const pollOptions = document.getElementById('poll-options');
        const optionCount = pollOptions.children.length;
        
        const optionElement = document.createElement('div');
        optionElement.className = 'poll-option';
        optionElement.innerHTML = `
            <input type="text" placeholder="Option ${optionCount + 1}" class="poll-option-input">
        `;
        
        pollOptions.appendChild(optionElement);
    }
    
    function createPoll() {
        const question = document.getElementById('poll-question').value.trim();
        if (question === '') {
            alert('Please enter a poll question');
            return;
        }
        
        const optionInputs = document.querySelectorAll('.poll-option-input');
        const options = [];
        
        for (let i = 0; i < optionInputs.length; i++) {
            const optionText = optionInputs[i].value.trim();
            if (optionText !== '') {
                options.push({
                    text: optionText,
                    votes: 0
                });
            }
        }
        
        if (options.length < 2) {
            alert('Please add at least two options');
            return;
        }
        
        const duration = parseInt(document.getElementById('poll-duration').value);
        
        // Create poll
        currentPoll = {
            question,
            options,
            duration,
            startTime: new Date().getTime(),
            totalVotes: 0
        };
        
        // Close modal
        closePollModal();
        
        // Add poll to chat
        const pollElement = document.createElement('div');
        pollElement.className = 'streamsim-poll';
        pollElement.id = 'current-poll';
        pollElement.innerHTML = `
            <div class="streamsim-poll-question">${question}</div>
            <div class="streamsim-poll-options">
                ${options.map((option, index) => `
                    <div class="streamsim-poll-option">
                        <span>${option.text}</span>
                        <div class="streamsim-poll-option-bar">
                            <div class="streamsim-poll-option-fill" style="width: 0%" id="poll-option-fill-${index}"></div>
                            <div class="streamsim-poll-option-percent" id="poll-option-percent-${index}">0%</div>
                        </div>
                        <span id="poll-option-votes-${index}">0</span>
                    </div>
                `).join('')}
            </div>
            <div class="streamsim-poll-footer">
                <div class="streamsim-poll-timer">Time remaining: <span id="poll-timer">${duration}</span> seconds</div>
                <div class="streamsim-poll-total">Total votes: <span id="poll-total-votes">0</span></div>
            </div>
        `;
        
        chatMessagesContainer.appendChild(pollElement);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        
        // Start poll timer
        pollActive = true;
        const timerInterval = setInterval(() => {
            const timeRemaining = Math.max(0, Math.floor((currentPoll.startTime + currentPoll.duration * 1000 - new Date().getTime()) / 1000));
            document.getElementById('poll-timer').textContent = timeRemaining;
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                endPoll();
            }
        }, 1000);
        
        // Add poll announcement to chat
        addChatMessage('System', `A poll has been created: "${question}"`, '#FF9900');
    }
    
    function simulatePollVote() {
        if (!currentPoll) return;
        
        // Randomly select an option
        const optionIndex = Math.floor(Math.random() * currentPoll.options.length);
        currentPoll.options[optionIndex].votes++;
        currentPoll.totalVotes++;
        
        // Update poll UI
        updatePollUI();
    }
    
    function updatePollUI() {
        if (!currentPoll) return;
        
        document.getElementById('poll-total-votes').textContent = currentPoll.totalVotes;
        
        for (let i = 0; i < currentPoll.options.length; i++) {
            const percent = currentPoll.totalVotes === 0 ? 0 : Math.round((currentPoll.options[i].votes / currentPoll.totalVotes) * 100);
            document.getElementById(`poll-option-fill-${i}`).style.width = `${percent}%`;
            document.getElementById(`poll-option-percent-${i}`).textContent = `${percent}%`;
            document.getElementById(`poll-option-votes-${i}`).textContent = currentPoll.options[i].votes;
        }
    }
    
    function endPoll() {
        pollActive = false;
        
        // Find winning option
        let maxVotes = -1;
        let winningOptions = [];
        
        for (let i = 0; i < currentPoll.options.length; i++) {
            if (currentPoll.options[i].votes > maxVotes) {
                maxVotes = currentPoll.options[i].votes;
                winningOptions = [currentPoll.options[i].text];
            } else if (currentPoll.options[i].votes === maxVotes) {
                winningOptions.push(currentPoll.options[i].text);
            }
        }
        
        let resultMessage;
        if (currentPoll.totalVotes === 0) {
            resultMessage = 'The poll has ended with no votes.';
        } else if (winningOptions.length === 1) {
            resultMessage = `The poll has ended. The winner is: "${winningOptions[0]}" with ${maxVotes} votes (${Math.round((maxVotes / currentPoll.totalVotes) * 100)}%).`;
        } else {
            resultMessage = `The poll has ended. It's a tie between: "${winningOptions.join('" and "')}" with ${maxVotes} votes each.`;
        }
        
        // Add result to chat
        addChatMessage('System', resultMessage, '#FF9900');
        
        // Remove poll after a delay
        setTimeout(() => {
            const pollElement = document.getElementById('current-poll');
            if (pollElement) {
                pollElement.remove();
            }
            currentPoll = null;
        }, 5000);
    }
    
    function popoutChat() {
        // Close existing popout if open
        if (popoutWindow && !popoutWindow.closed) {
            popoutWindow.close();
        }
        
        // Create new popout window
        popoutWindow = window.open('', 'StreamSim Chat', 'width=400,height=600');
        
        // Create popout chat content
        popoutWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>StreamSim Chat</title>
                <style>
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        font-family: 'Tahoma', sans-serif;
                    }
                    
                    .popout-chat-container {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                    }
                    
                    .popout-chat-header {
                        padding: 10px;
                        background-color: #0066CC;
                        color: white;
                        text-align: center;
                    }
                    
                    .popout-chat-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                    }
                    
                    .chat-message {
                        margin-bottom: 10px;
                    }
                    
                    .chat-message .username {
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="popout-chat-container">
                    <div class="popout-chat-header">
                        <h2>Live Chat</h2>
                    </div>
                    <div id="popout-chat-messages" class="popout-chat-messages"></div>
                </div>
            </body>
            </html>
        `);
        
        // Wait for the window to load then populate with existing messages
        popoutWindow.onload = () => {
            const popoutChatContainer = popoutWindow.document.getElementById('popout-chat-messages');
            
            // Add existing messages
            chatMessages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = 'chat-message';
                messageElement.innerHTML = `
                    <span class="username" style="color: ${msg.color}">${msg.username}:</span>
                    <span class="message">${msg.message}</span>
                `;
                popoutChatContainer.appendChild(messageElement);
            });
            
            // Scroll to bottom
            popoutChatContainer.scrollTop = popoutChatContainer.scrollHeight;
        };
    }
    
    // Set up event listeners for settings changes
    chatStyleSelect.addEventListener('change', simulateChat);
    chatFrequencyInput.addEventListener('input', simulateChat);
    
    // Clean up when window closes
    return function cleanup() {
        // Stop streaming if active
        if (isStreaming) {
            stopStream();
        }
        
        // Close popout window if open
        if (popoutWindow && !popoutWindow.closed) {
            popoutWindow.close();
        }
        
        // Remove event listeners
        if (chatInterval) {
            clearInterval(chatInterval);
        }
    };
}

