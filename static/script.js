// Page Navigation
document.getElementById('enter-btn').addEventListener('click', function() {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('chat-interface').style.display = 'flex';
  initChatInterface();
});

// Chat Interface Functionality
let recognition;
let isListening = false;

function initChatInterface() {
  initVoiceRecognition();
  addMessage('bot', "Hello! I'm PICASO. How can I assist you today?", true);
}

function initVoiceRecognition() {
  try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = function() {
          isListening = true;
          document.getElementById('voice-btn').classList.add('active');
      };
      
      recognition.onend = function() {
          isListening = false;
          document.getElementById('voice-btn').classList.remove('active');
      };
      
      recognition.onresult = function(event) {
          const transcript = event.results[0][0].transcript;
          document.getElementById('user-input').value = transcript;
          setTimeout(() => sendMessage(), 500);
      };
      
      recognition.onerror = function(event) {
          console.error('Voice recognition error', event.error);
          document.getElementById('voice-btn').classList.remove('active');
      };
  } catch (e) {
      console.log("Voice recognition not supported");
      document.getElementById('voice-btn').style.display = 'none';
  }
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  addMessage('user', message);
  input.value = '';
  showTyping();
  
  try {
      const response = await fetch('http://localhost:10000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
      });
      const data = await response.json();
      addMessage('bot', data.response, true);
  } catch (error) {
      console.error('Error:', error);
      addMessage('bot', "Sorry, I'm having trouble connecting to the server. Please try again later.", true);
  } finally {
      removeTyping();
  }
}

function addMessage(sender, text, addSpeaker = false) {
  const chat = document.getElementById('chat-container');
  const msgDiv = document.createElement('div');
  msgDiv.className = `${sender}-message message`;
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = text;
  msgDiv.appendChild(content);

  if (addSpeaker) {
      const speakerBtn = document.createElement('button');
      speakerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      speakerBtn.className = 'speaker-btn';
      speakerBtn.onclick = () => speak(text);
      msgDiv.appendChild(speakerBtn);
  }

  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
}

function speak(text) {
  if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
  }
}

function showTyping() {
  const chat = document.getElementById('chat-container');
  const typing = document.createElement('div');
  typing.id = 'typing';
  typing.className = 'typing-indicator';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

// Event Listeners
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('voice-btn').addEventListener('click', function() {
  if (isListening) {
      recognition.stop();
  } else {
      try {
          recognition.start();
      } catch (e) {
          console.error('Voice recognition error:', e);
      }
  }
});
document.getElementById('user-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});