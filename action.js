class JarvisChatbot {
    constructor() {
        this.isActivated = false;
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.openedWindows = [];
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.logVoiceDebug('Calling startListening from constructor...');
        this.startListening();
        this.setupDebugBarToggle();
    }

    initializeElements() {
        this.textInput = document.getElementById('text-input');
        this.openTextBtn = document.getElementById('open-text-btn');
        this.cornerTextInput = document.getElementById('corner-text-input');
    }

    bindEvents() {
        this.openTextBtn.addEventListener('click', () => {
            this.cornerTextInput.classList.add('active');
            this.textInput.style.display = 'block';
            this.textInput.disabled = false;
            this.textInput.focus();
        });
        this.textInput.addEventListener('blur', () => {
            this.cornerTextInput.classList.remove('active');
            this.textInput.value = '';
            this.textInput.style.display = 'none';
        });
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleTextInput();
                this.textInput.blur();
            }
        });
    }

    handleTextInput() {
        const input = this.textInput.value.trim();
        if (!input) return;
        this.addMessage(input, 'user');
        this.textInput.value = '';
        if (!this.isActivated) {
            if (input.toLowerCase().includes('hi jarvis') || input.toLowerCase().includes('jarvis')) {
                this.activateJarvis();
            } else {
                this.addMessage('Say "Hi Jarvis" to activate me first.', 'bot');
            }
        } else {
            this.processCommand(input);
        }
    }

    initializeSpeechRecognition() {
        this.logVoiceDebug('Initializing speech recognition...');
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            this.showVoiceError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            this.logVoiceDebug('Speech recognition not supported.');
            return;
        }
        if (window.location.protocol === 'file:') {
            this.showVoiceError('Speech recognition may not work from file://. Please use localhost or HTTPS.');
            this.logVoiceDebug('Running from file://');
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        this.recognition.onstart = () => {
            this.isListening = true;
            this.clearVoiceError();
            this.updateMicIndicator(true);
            this.logVoiceDebug('Speech recognition started.');
        };
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateMicIndicator(false);
            this.logVoiceDebug('Speech recognition ended.');
            setTimeout(() => {
                if (!this.isActivated) {
                    this.startListening();
                }
            }, 1000);
        };
        this.recognition.onresult = (event) => {
            const transcript = event.results[event.results.length-1][0].transcript;
            this.logVoiceDebug('Speech recognition result: ' + transcript);
            if (transcript) {
                this.processVoiceInput(transcript.toLowerCase());
            }
        };
        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.updateMicIndicator(false);
            let msg = '';
            if (event.error === 'not-allowed' || event.error === 'denied') {
                msg = 'Microphone access denied. Please allow microphone access in your browser settings.';
            } else if (event.error === 'no-speech') {
                msg = 'No speech detected. Please try again.';
            } else if (event.error === 'audio-capture') {
                msg = 'No microphone found. Please check your microphone.';
            } else {
                msg = 'Voice recognition error: ' + event.error;
            }
            this.showVoiceError(msg);
            this.logVoiceDebug('Speech recognition error: ' + event.error);
            setTimeout(() => {
                if (!this.isActivated) {
                    this.startListening();
                }
            }, 1000);
        };
        this.recognition.onnomatch = () => {
            this.logVoiceDebug('No speech match found.');
        };
    }

    updateMicIndicator(isOn) {
        const mic = document.getElementById('mic-status-indicator');
        if (mic) {
            mic.className = isOn ? 'mic-status-on' : 'mic-status-off';
        }
    }

    addMessage(message, sender) {
        if (sender === 'bot') {
            alert('Jarvis: ' + message);
        } else {
            console.log('You: ' + message);
        }
    }

    startListening() {
        this.logVoiceDebug('Calling startListening...');
        if (!this.recognition) {
            this.logVoiceDebug('Recognition not initialized!');
            this.showVoiceError('Voice recognition is not initialized.');
            return;
        }
        if (!this.isListening) {
            try {
                this.recognition.start();
                this.logVoiceDebug('Recognition.start() called.');
            } catch (error) {
                this.isListening = false;
                this.logVoiceDebug('Error starting recognition: ' + error.message);
                this.showVoiceError('Error starting voice recognition. Please try again.');
            }
        } else {
            this.logVoiceDebug('Recognition already running.');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                console.log('Stopping speech recognition...');
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    }

    processVoiceInput(input) {
        console.log('Processing voice input:', input);
        this.addMessage(input, 'user');
        
        if (!this.isActivated) {
            if (input.includes('hi jarvis') || input.includes('jarvis')) {
                this.activateJarvis();
            } else {
                this.addMessage('Say "Hi Jarvis" to activate me first.', 'bot');
            }
        } else {
            this.processCommand(input);
        }
    }

    activateJarvis() {
        this.isActivated = true;
        this.addMessage('Jarvis activated! How can I help you?', 'bot');
        this.speak('Jarvis activated! How can I help you?');
    }

    deactivateJarvis() {
        this.isActivated = false;
        this.addMessage('Jarvis deactivated. Say "Jarvis" to reactivate.', 'bot');
    }

    processCommand(command) {
        const lowerCommand = command.toLowerCase();
        let response = '';
        
        // Home page command (close all opened windows)
        if (lowerCommand.includes('home page') || lowerCommand.includes('ghar aa jao') || lowerCommand.includes('ghar par aa jao') || lowerCommand.includes('home par aa jao')) {
            this.closeAllOpenedWindows();
            response = 'Sabhi khule hue page band kar diye gaye. Aap home page par aa gaye hain.';
            this.addMessage(response, 'bot');
            this.speak(response);
            return;
        }

        // Close specific website command
        if (lowerCommand.match(/(close|band kar do|close kar do|close karo|band karo)\s+([a-zA-Z0-9 .]+)/)) {
            const match = lowerCommand.match(/(close|band kar do|close kar do|close karo|band karo)\s+([a-zA-Z0-9 .]+)/);
            const siteName = match[2].trim();
            const closed = this.closeOpenedWindowByName(siteName);
            if (closed) {
                response = `${siteName} band kar diya gaya.`;
            } else {
                response = `${siteName} khula nahi tha ya band nahi ho sakta.`;
            }
            this.addMessage(response, 'bot');
            this.speak(response);
            return;
        }
        
        // Website opening commands
        if (this.tryOpenWebsite(lowerCommand)) {
            return; // Website was opened, no need for further processing
        }
        
        // Enhanced Time commands
        if (lowerCommand.includes('time') || lowerCommand.includes('what time')) {
            response = this.getDetailedTime();
        }
        // Enhanced Date commands
        else if (lowerCommand.includes('date') || lowerCommand.includes('what date') || lowerCommand.includes('today')) {
            response = this.getDetailedDate();
        }
        // Timestamp command
        else if (lowerCommand.includes('timestamp') || lowerCommand.includes('current timestamp')) {
            response = this.getTimestamp();
        }
        // Day of week command
        else if (lowerCommand.includes('day') || lowerCommand.includes('what day') || lowerCommand.includes('day of week')) {
            response = this.getDayOfWeek();
        }
        // Weather commands (simulated)
        else if (lowerCommand.includes('weather')) {
            response = 'I\'m sorry, I don\'t have access to real-time weather data yet.';
        }
        // Enhanced Calculator
        else if (lowerCommand.includes('calculate') || lowerCommand.includes('math') || lowerCommand.includes('calculator')) {
            response = this.handleCalculatorCommand(command);
        }
        // Greeting commands
        else if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('hey')) {
            response = 'Hello! How can I assist you today?';
        }
        // Help commands
        else if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
            response = 'I can help you with: opening websites, time/date/day/timestamp, advanced calculations, greetings, and general conversation. Try saying "calculate 15 plus 23" or "what time is it" or "what day is today"!';
        }
        // Goodbye commands
        else if (lowerCommand.includes('goodbye') || lowerCommand.includes('bye') || lowerCommand.includes('exit')) {
            response = 'Goodbye! Say "Jarvis" when you need me again.';
            setTimeout(() => this.deactivateJarvis(), 2000);
        }
        // Deactivate commands
        else if (lowerCommand.includes('deactivate') || lowerCommand.includes('turn off')) {
            response = 'Deactivating Jarvis. Say "Jarvis" to reactivate.';
            setTimeout(() => this.deactivateJarvis(), 2000);
        }
        // Enhanced math calculations
        else if (this.isMathCommand(command)) {
            response = this.performAdvancedCalculation(command);
        }
        // Default response
        else {
            response = 'I heard you say: "' + command + '". How can I help you with that?';
        }
        
        this.addMessage(response, 'bot');
        this.speak(response);
    }

    getDetailedTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `The current time is ${timeString} (${timeZone})`;
    }

    getDetailedDate() {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        return `Today is ${dateString}`;
    }

    getTimestamp() {
        const now = new Date();
        const timestamp = Math.floor(now.getTime() / 1000);
        const dateString = now.toISOString();
        return `Current timestamp: ${timestamp} (Unix)\nFull ISO: ${dateString}`;
    }

    getDayOfWeek() {
        const now = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[now.getDay()];
        const dateString = now.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        return `Today is ${dayName}, ${dateString}`;
    }

    handleCalculatorCommand(command) {
        if (command.includes('help') || command.includes('what can you do')) {
            return 'I can perform: addition (+), subtraction (-), multiplication (*), division (/), percentage (%), square root, power, and more. Try saying "calculate 15 plus 23" or "what is 10 percent of 200" or "square root of 16"!';
        }
        
        // If it's just "calculator" without specific calculation, return help
        if (command === 'calculator' || command === 'math') {
            return 'Calculator activated! I can help with: addition, subtraction, multiplication, division, percentage, square root, power, and more. What would you like to calculate?';
        }
        
        // Try to perform calculation
        const result = this.performAdvancedCalculation(command);
        if (result !== 'Sorry, I couldn\'t perform that calculation.') {
            return result;
        }
        
        return 'Please specify what you want to calculate. For example: "calculate 15 plus 23" or "what is 10 percent of 200"';
    }

    isMathCommand(command) {
        const mathKeywords = [
            'plus', 'add', '+', 'minus', 'subtract', '-', 'multiply', 'times', '*', 'x',
            'divide', '/', 'percent', '%', 'square root', 'sqrt', 'power', '^', '**',
            'modulo', 'mod', 'remainder', 'percentage', 'of'
        ];
        
        return mathKeywords.some(keyword => command.includes(keyword)) || /\d/.test(command);
    }

    performAdvancedCalculation(command) {
        try {
            // Extract numbers from command
            const numbers = command.match(/\d+(?:\.\d+)?/g);
            if (!numbers || numbers.length === 0) {
                return 'Please provide numbers for calculation.';
            }

            const num1 = parseFloat(numbers[0]);
            const num2 = numbers.length > 1 ? parseFloat(numbers[1]) : null;
            let result = 0;
            let operation = '';
            let explanation = '';

            // Percentage calculations
            if (command.includes('percent') || command.includes('%')) {
                if (command.includes('of') && numbers.length >= 2) {
                    result = (num1 * num2) / 100;
                    operation = 'percentage';
                    explanation = `${num1}% of ${num2} = ${result}`;
                } else if (numbers.length >= 2) {
                    result = (num1 / num2) * 100;
                    operation = 'percentage';
                    explanation = `${num1} is ${result.toFixed(2)}% of ${num2}`;
                }
            }
            // Square root
            else if (command.includes('square root') || command.includes('sqrt')) {
                result = Math.sqrt(num1);
                operation = 'square root';
                explanation = `√${num1} = ${result}`;
            }
            // Power calculations
            else if (command.includes('power') || command.includes('^') || command.includes('**')) {
                if (num2 !== null) {
                    result = Math.pow(num1, num2);
                    operation = 'power';
                    explanation = `${num1}^${num2} = ${result}`;
                } else {
                    result = Math.pow(num1, 2);
                    operation = 'square';
                    explanation = `${num1}² = ${result}`;
                }
            }
            // Basic operations
            else if (command.includes('plus') || command.includes('add') || command.includes('+')) {
                if (num2 !== null) {
                    result = num1 + num2;
                    operation = 'addition';
                    explanation = `${num1} + ${num2} = ${result}`;
                }
            }
            else if (command.includes('minus') || command.includes('subtract') || command.includes('-')) {
                if (num2 !== null) {
                    result = num1 - num2;
                    operation = 'subtraction';
                    explanation = `${num1} - ${num2} = ${result}`;
                }
            }
            else if (command.includes('multiply') || command.includes('times') || command.includes('*') || command.includes('x')) {
                if (num2 !== null) {
                    result = num1 * num2;
                    operation = 'multiplication';
                    explanation = `${num1} × ${num2} = ${result}`;
                }
            }
            else if (command.includes('divide') || command.includes('/')) {
                if (num2 !== null) {
                    if (num2 === 0) {
                        return 'Cannot divide by zero.';
                    }
                    result = num1 / num2;
                    operation = 'division';
                    explanation = `${num1} ÷ ${num2} = ${result}`;
                }
            }
            // Modulo operation
            else if (command.includes('modulo') || command.includes('mod') || command.includes('remainder')) {
                if (num2 !== null) {
                    result = num1 % num2;
                    operation = 'modulo';
                    explanation = `${num1} mod ${num2} = ${result}`;
                }
            }
            // If no specific operation found, try to interpret as basic math
            else if (numbers.length >= 2) {
                // Try to guess operation based on context
                if (command.includes('+')) {
                    result = num1 + num2;
                    operation = 'addition';
                    explanation = `${num1} + ${num2} = ${result}`;
                } else if (command.includes('-')) {
                    result = num1 - num2;
                    operation = 'subtraction';
                    explanation = `${num1} - ${num2} = ${result}`;
                } else if (command.includes('*') || command.includes('x')) {
                    result = num1 * num2;
                    operation = 'multiplication';
                    explanation = `${num1} × ${num2} = ${result}`;
                } else if (command.includes('/')) {
                    if (num2 === 0) {
                        return 'Cannot divide by zero.';
                    }
                    result = num1 / num2;
                    operation = 'division';
                    explanation = `${num1} ÷ ${num2} = ${result}`;
                }
            }

            if (explanation) {
                // Format result based on operation type
                if (operation === 'division' && result.toString().includes('.')) {
                    return `${explanation} (${result.toFixed(4)})`;
                } else if (operation === 'percentage' && result.toString().includes('.')) {
                    return `${explanation} (${result.toFixed(2)})`;
                } else {
                    return explanation;
                }
            }

            return 'Please specify the operation clearly. For example: "calculate 15 plus 23" or "what is 10 percent of 200"';
        } catch (error) {
            console.error('Calculation error:', error);
            return 'Sorry, I couldn\'t perform that calculation. Please try again with a clearer format.';
        }
    }

    tryOpenWebsite(command) {
        const websites = {
            // Social Media
            'facebook': 'https://www.facebook.com',
            'instagram': 'https://www.instagram.com',
            'twitter': 'https://www.twitter.com',
            'linkedin': 'https://www.linkedin.com',
            'youtube': 'https://www.youtube.com',
            'tiktok': 'https://www.tiktok.com',
            'snapchat': 'https://www.snapchat.com',
            'reddit': 'https://www.reddit.com',
            'pinterest': 'https://www.pinterest.com',
            'whatsapp': 'https://web.whatsapp.com',
            'telegram': 'https://web.telegram.org',
            'discord': 'https://discord.com',
            
            // Search Engines
            'google': 'https://www.google.com',
            'bing': 'https://www.bing.com',
            'yahoo': 'https://www.yahoo.com',
            'duckduckgo': 'https://duckduckgo.com',
            
            // Video Platforms
            'netflix': 'https://www.netflix.com',
            'amazon prime': 'https://www.primevideo.com',
            'disney plus': 'https://www.disneyplus.com',
            'hotstar': 'https://www.hotstar.com',
            'vimeo': 'https://www.vimeo.com',
            'dailymotion': 'https://www.dailymotion.com',
            
            // Shopping
            'amazon': 'https://www.amazon.com',
            'flipkart': 'https://www.flipkart.com',
            'myntra': 'https://www.myntra.com',
            'ajio': 'https://www.ajio.com',
            'ebay': 'https://www.ebay.com',
            'walmart': 'https://www.walmart.com',
            'target': 'https://www.target.com',
            
            // News & Information
            'bbc': 'https://www.bbc.com',
            'cnn': 'https://www.cnn.com',
            'times of india': 'https://timesofindia.indiatimes.com',
            'ndtv': 'https://www.ndtv.com',
            'hindustan times': 'https://www.hindustantimes.com',
            'wikipedia': 'https://www.wikipedia.org',
            
            // Email & Communication
            'gmail': 'https://mail.google.com',
            'outlook': 'https://outlook.live.com',
            'yahoo mail': 'https://mail.yahoo.com',
            'protonmail': 'https://mail.proton.me',
            
            // Productivity & Tools
            'github': 'https://www.github.com',
            'stack overflow': 'https://stackoverflow.com',
            'medium': 'https://medium.com',
            'quora': 'https://www.quora.com',
            'notion': 'https://www.notion.so',
            'trello': 'https://trello.com',
            'slack': 'https://slack.com',
            'zoom': 'https://zoom.us',
            'microsoft teams': 'https://teams.microsoft.com',
            
            // Maps & Travel
            'google maps': 'https://maps.google.com',
            'booking': 'https://www.booking.com',
            'makemytrip': 'https://www.makemytrip.com',
            'goibibo': 'https://www.goibibo.com',
            'airbnb': 'https://www.airbnb.com',
            
            // Banking & Finance
            'paypal': 'https://www.paypal.com',
            'paytm': 'https://paytm.com',
            'phonepe': 'https://www.phonepe.com',
            'google pay': 'https://pay.google.com',
            
            // Education
            'coursera': 'https://www.coursera.org',
            'udemy': 'https://www.udemy.com',
            'khan academy': 'https://www.khanacademy.org',
            'edx': 'https://www.edx.org',
            
            // Gaming
            'steam': 'https://store.steampowered.com',
            'roblox': 'https://www.roblox.com',
            'minecraft': 'https://www.minecraft.net',
            'twitch': 'https://www.twitch.tv',
            
            // Music
            'spotify': 'https://open.spotify.com',
            'apple music': 'https://music.apple.com',
            'soundcloud': 'https://soundcloud.com',
            'gaana': 'https://gaana.com',
            'wynk': 'https://wynk.in',
            'jiosaavn': 'https://www.jiosaavn.com'
        };

        // Check for website opening commands
        for (const [siteName, url] of Object.entries(websites)) {
            if (command.includes(siteName) && (command.includes('open') || command.includes('go to') || command.includes('visit'))) {
                this.openWebsite(url, siteName);
                return true;
            }
        }

        // Also check for direct website names without "open" command
        for (const [siteName, url] of Object.entries(websites)) {
            if (command.includes(siteName) && !command.includes('open') && !command.includes('go to') && !command.includes('visit')) {
                this.openWebsite(url, siteName);
                return true;
            }
        }

        return false;
    }

    openWebsite(url, siteName) {
        try {
            const win = window.open(url, '_blank');
            if (win) {
                this.openedWindows.push({ win, siteName: siteName.toLowerCase() });
            }
            const response = `Opening ${siteName} for you!`;
            this.addMessage(response, 'bot');
            this.speak(response);
        } catch (error) {
            console.error('Error opening website:', error);
            const response = `Sorry, I couldn't open ${siteName}. Please try again.`;
            this.addMessage(response, 'bot');
            this.speak(response);
        }
    }

    closeOpenedWindowByName(siteName) {
        siteName = siteName.toLowerCase();
        let closed = false;
        this.openedWindows = this.openedWindows.filter(obj => {
            if (obj.siteName.includes(siteName) && obj.win && !obj.win.closed) {
                obj.win.close();
                closed = true;
                return false;
            }
            return true;
        });
        return closed;
    }

    closeAllOpenedWindows() {
        this.openedWindows.forEach(obj => {
            if (obj.win && !obj.win.closed) {
                obj.win.close();
            }
        });
        this.openedWindows = [];
    }

    loadChatHistory() {
        const data = localStorage.getItem('jarvis_chat_history');
        if (data) {
            try {
                const messages = JSON.parse(data);
                messages.forEach(msg => this.renderMessage(msg));
            } catch (e) {
                localStorage.removeItem('jarvis_chat_history');
            }
        }
    }

    saveChatHistory() {
        const messages = [];
        const messageDivs = this.chatMessages.querySelectorAll('.message');
        messageDivs.forEach(div => {
            const sender = div.classList.contains('user-message') ? 'user' : 'bot';
            const text = div.querySelector('.message-text')?.textContent || '';
            const timestamp = div.querySelector('.message-timestamp')?.textContent || '';
            messages.push({ sender, text, timestamp });
        });
        localStorage.setItem('jarvis_chat_history', JSON.stringify(messages));
    }

    renderMessage({ sender, text, timestamp }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = text;
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = timestamp;
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timestampDiv);
        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);
    }

    speak(text) {
        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            this.synthesis.speak(utterance);
        }
    }

    showVoiceError(msg) {
        const el = document.getElementById('voice-error-message');
        if (el) {
            el.textContent = msg;
            el.classList.add('active');
        }
        console.error('Voice Error:', msg);
    }
    clearVoiceError() {
        const el = document.getElementById('voice-error-message');
        if (el) {
            el.textContent = '';
            el.classList.remove('active');
        }
    }

    logVoiceDebug(msg) {
        const el = document.getElementById('voice-debug-log');
        if (el) {
            el.innerHTML += `[${new Date().toLocaleTimeString()}] ${msg}<br/>`;
            el.scrollTop = el.scrollHeight;
        }
        console.log('VoiceDebug:', msg);
    }

    setupDebugBarToggle() {
        const debugBar = document.getElementById('voice-debug-log');
        const minimizeBtn = document.getElementById('debug-bar-minimize-btn');
        const showBtn = document.getElementById('debug-bar-show-btn');
        if (debugBar && minimizeBtn && showBtn) {
            showBtn.style.display = 'none';
            minimizeBtn.addEventListener('click', () => {
                debugBar.classList.add('minimized');
                setTimeout(() => { showBtn.style.display = 'flex'; }, 200); // delay for smoothness
                this.logVoiceDebug('Debug bar minimized.');
            });
            showBtn.addEventListener('click', () => {
                debugBar.classList.remove('minimized');
                showBtn.style.display = 'none';
                this.logVoiceDebug('Debug bar shown.');
            });
        }
    }
}
// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JarvisChatbot();
}); 