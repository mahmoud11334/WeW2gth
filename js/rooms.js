

import { auth, db, realtimeDb, isAdmin } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { ref, onValue, remove, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { initChat } from './chat.js';
import { initVideoControls, loadVideo } from './video-controls.js';


const createRoomScreen = document.getElementById('create-room-screen');
const joinRoomsScreen = document.getElementById('join-rooms-screen');
const displayScreen = document.getElementById('display-screen');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const inboxBtn = document.getElementById('inbox-btn');
const inboxScreen = document.getElementById('inbox-screen');
const messagesDiv = document.getElementById('messages');
const activeRoomsDiv = document.getElementById('active-rooms');
const viewerCount = document.getElementById('viewer-count');
const exitRoomBtn = document.getElementById('exit-room');
const contentDisplay = document.getElementById('content-display');
const controlPanelBtn = document.getElementById('control-panel-btn');
const controlPanel = document.getElementById('control-panel');
const switchDisplayBtn = document.getElementById('switch-display');


let currentRoomId = null;
let currentCategory = null;
let isRoomOwner = false;
let roomOwnerId = null;


createRoomBtn.addEventListener('click', () => {
    document.getElementById('main-screen').classList.add('hidden');
    createRoomScreen.classList.remove('hidden');
});


joinRoomBtn.addEventListener('click', showActiveRooms);


inboxBtn.addEventListener('click', showInbox);


document.getElementById('create-room').addEventListener('click', async () => {
    const roomName = document.getElementById('room-name').value.trim();
    if (!roomName) {
        document.getElementById('create-error').textContent = 'يرجى إدخال اسم الغرفة';
        return;
    }
    if (!currentCategory) {
        document.getElementById('create-error').textContent = 'يرجى اختيار فئة للغرفة';
        return;
    }

    try {
        const roomRef = await addDoc(collection(db, 'rooms'), {
            name: roomName,
            category: currentCategory,
            ownerId: auth.currentUser.uid,
            ownerUsername: auth.currentUser.email.split('@')[0], // اسم المستخدم من الإيميل
            createdAt: serverTimestamp(),
            active: true
        });

        currentRoomId = roomRef.id;
        isRoomOwner = true;
        roomOwnerId = auth.currentUser.uid;

        
        await set(ref(realtimeDb, `roomStates/${currentRoomId}`), {
            viewers: 1,
            playing: false,
            currentTime: 0,
            volume: 50,
            chatMuted: false,
            createdAt: Date.now()
        });

        enterRoom(currentRoomId);
    } catch (error) {
        document.getElementById('create-error').textContent = 'خطأ في إنشاء الغرفة: ' + error.message;
    }
});


document.getElementById('youtube-category').addEventListener('click', () => currentCategory = 'youtube');
document.getElementById('screen-share-category').addEventListener('click', () => currentCategory = 'screen-share');
document.getElementById('film-category').addEventListener('click', () => currentCategory = 'film');


async function showActiveRooms() {
    document.getElementById('main-screen').classList.add('hidden');
    joinRoomsScreen.classList.remove('hidden');
    activeRoomsDiv.innerHTML = '<div class="text-center p-3">جاري تحميل الغرف...</div>';

    try {
        const querySnapshot = await getDocs(collection(db, 'rooms'));
        activeRoomsDiv.innerHTML = '';

        if (querySnapshot.empty) {
            activeRoomsDiv.innerHTML = '<div class="alert alert-info">لا توجد غرف نشطة حالياً</div>';
            return;
        }

        querySnapshot.forEach(async (docSnap) => {
            const room = docSnap.data();
            const roomElement = document.createElement('div');
            roomElement.className = 'list-group-item list-group-item-action bg-dark text-white mb-2 rounded';
            roomElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">${room.name}</h5>
                        <small>منشئ: ${room.ownerUsername || 'غير معروف'}</small>
                        <br>
                        <small class="text-muted">فئة: ${room.category === 'youtube' ? 'يوتيوب' : room.category === 'screen-share' ? 'مشاركة شاشة' : 'أفلام'}</small>
                    </div>
                    <button class="btn btn-success btn-sm join-room-btn">انضمام</button>
                </div>
            `;

            roomElement.querySelector('.join-room-btn').addEventListener('click', () => {
                currentRoomId = docSnap.id;
                enterRoom(currentRoomId);
            });

            activeRoomsDiv.appendChild(roomElement);
        });
    } catch (error) {
        activeRoomsDiv.innerHTML = `<div class="alert alert-danger">خطأ في تحميل الغرف: ${error.message}</div>`;
    }
}


async function enterRoom(roomId) {
    try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (!roomDoc.exists()) {
            alert('الغرفة غير موجودة أو تم حذفها');
            return;
        }

        const roomData = roomDoc.data();
        currentCategory = roomData.category;
        roomOwnerId = roomData.ownerId;
        isRoomOwner = (auth.currentUser.uid === roomOwnerId) || isAdmin;

        
        await set(ref(realtimeDb, `roomStates/${roomId}/viewers`), (await get(ref(realtimeDb, `roomStates/${roomId}/viewers`))).val() + 1 || 1);

        
        joinRoomsScreen.classList.add('hidden');
        createRoomScreen.classList.add('hidden');
        displayScreen.classList.remove('hidden');

        
        initChat(roomId);

        
        initVideoControls(roomId);

        
        if (currentCategory === 'youtube' || currentCategory === 'film') {
            
            contentDisplay.innerHTML = '<div class="text-center text-white p-5">في انتظار تحديد المحتوى من قبل صاحب الغرفة...</div>';
        } else if (currentCategory === 'screen-share') {
            contentDisplay.innerHTML = '<div class="text-center text-white p-5">في انتظار بدء مشاركة الشاشة...</div>';
        }

        
        onValue(ref(realtimeDb, `roomStates/${roomId}`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                viewerCount.textContent = `عدد المشاهدين: ${data.viewers || 1}`;
            }
        });

        
        if (isRoomOwner || isAdmin) {
            document.getElementById('admin-controls').classList.remove('hidden');
        }

    } catch (error) {
        alert('خطأ في الدخول للغرفة: ' + error.message);
    }
}


exitRoomBtn.addEventListener('click', async () => {
    if (!currentRoomId) return;

    try {
        
        const viewersRef = ref(realtimeDb, `roomStates/${currentRoomId}/viewers`);
        const currentViewers = (await get(viewersRef)).val() || 1;
        if (currentViewers > 1) {
            await set(viewersRef, currentViewers - 1);
        }

        
        if (isRoomOwner || isAdmin) {
            if (confirm('هل أنت متأكد من الخروج وحذف الغرفة؟')) {
                await deleteDoc(doc(db, 'rooms', currentRoomId));
                await remove(ref(realtimeDb, `roomStates/${currentRoomId}`));
                await remove(ref(realtimeDb, `chats/${currentRoomId}`));
                alert('تم حذف الغرفة بنجاح');
            }
        }

        
        displayScreen.classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        
        currentRoomId = null;
        isRoomOwner = false;

    } catch (error) {
        alert('خطأ أثناء الخروج: ' + error.message);
    }
});


async function showInbox() {
    document.getElementById('main-screen').classList.add('hidden');
    inboxScreen.classList.remove('hidden');
    messagesDiv.innerHTML = '<div class="text-center p-3">جاري تحميل الرسائل...</div>';

    try {
        const querySnapshot = await getDocs(collection(db, 'messages', auth.currentUser.uid));
        messagesDiv.innerHTML = '';

        if (querySnapshot.empty) {
            messagesDiv.innerHTML = '<div class="alert alert-info">لا توجد رسائل جديدة</div>';
            return;
        }

        querySnapshot.forEach((msgDoc) => {
            const msg = msgDoc.data();
            const msgElement = document.createElement('div');
            msgElement.className = 'alert alert-secondary';
            msgElement.innerHTML = `<strong>رسالة من النظام:</strong><br>${msg.content}`;
            messagesDiv.appendChild(msgElement);
        });
    } catch (error) {
        messagesDiv.innerHTML = `<div class="alert alert-danger">خطأ في تحميل الرسائل: ${error.message}</div>`;
    }
}


export { enterRoom, isRoomOwner };