

import { auth, realtimeDb } from './firebase-config.js';
import { ref, push, onChildAdded, set, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { getDoc, doc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';


const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendChat = document.getElementById('send-chat');
const chatContainer = document.getElementById('chat-container');


let chatRef = null;
let chatTimeout = null;
let userProfile = null; // لتخزين بيانات المستخدم (اسم، صورة)


sendChat.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message || !currentRoomId) return;

    
    const chatMuted = (await get(ref(realtimeDb, `roomStates/${currentRoomId}/chatMuted`))).val();
    if (chatMuted) {
        alert('الشات مكتم حالياً من قبل الأدمن أو صاحب الغرفة');
        return;
    }

    try {
        if (!userProfile) {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
                userProfile = userDoc.data();
            } else {
                alert('خطأ في تحميل بياناتك');
                return;
            }
        }

        await push(chatRef, {
            userId: auth.currentUser.uid,
            username: userProfile.username,
            profilePic: userProfile.profilePic,
            content: message,
            timestamp: Date.now()
        });

        chatInput.value = '';
    } catch (error) {
        alert('خطأ في إرسال الرسالة: ' + error.message);
    }
});


export function initChat(roomId) {
    chatRef = ref(realtimeDb, `chats/${roomId}`);
    chatMessages.innerHTML = '';

    
    onChildAdded(chatRef, async (snapshot) => {
        const msg = snapshot.val();
        const msgElement = document.createElement('div');
        msgElement.className = 'd-flex align-items-center mb-2';

        
        const img = document.createElement('img');
        img.src = `images/${msg.profilePic}`;
        img.className = 'rounded-circle me-2';
        img.style.width = '32px';
        img.style.height = '32px';
        img.alt = msg.username;

        
        const text = document.createElement('span');
        text.innerHTML = `<strong>${msg.username}:</strong> ${msg.content}`;
        if (msg.style === 'admin-welcome') {
            text.style.color = '#ffd700';
            text.style.fontWeight = 'bold';
        }

        msgElement.appendChild(img);
        msgElement.appendChild(text);

        chatMessages.appendChild(msgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (document.fullscreenElement) {
            clearTimeout(chatTimeout);
            chatContainer.classList.remove('hidden');
            chatTimeout = setTimeout(() => {
                chatContainer.classList.add('hidden');
            }, 5000);
        }
    });

    
    chatContainer.addEventListener('mouseenter', () => {
        clearTimeout(chatTimeout);
        chatContainer.classList.remove('hidden');
    });
}