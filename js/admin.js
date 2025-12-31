

import { auth, db, realtimeDb, isAdmin } from './firebase-config.js';
import { collection, getDocs, addDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { ref, set, remove } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';


const adminPanelBtn = document.getElementById('admin-panel-btn');
const adminPanelScreen = document.getElementById('admin-panel-screen');
const mailBtn = document.getElementById('mail-btn');
const sendMsgBtn = document.getElementById('send-msg-btn');
const suggestionsList = document.getElementById('suggestions-list');
const targetUsername = document.getElementById('target-username');
const adminMessage = document.getElementById('admin-message');
const sendAdminMsg = document.getElementById('send-admin-msg');
const muteChatBtn = document.getElementById('mute-chat');
const deleteRoomBtn = document.getElementById('delete-room');
const welcomeChatBtn = document.getElementById('welcome-chat');


adminPanelBtn.addEventListener('click', () => {
    if (!isAdmin) return alert('ليس لديك صلاحيات أدمن');
    document.getElementById('main-screen').classList.add('hidden');
    adminPanelScreen.classList.remove('hidden');
});


mailBtn.addEventListener('click', async () => {
    adminPanelScreen.classList.add('hidden');
    document.getElementById('admin-mail-screen').classList.remove('hidden');
    suggestionsList.innerHTML = '<div class="text-center p-3">جاري تحميل الاقتراحات...</div>';

    try {
        const querySnapshot = await getDocs(collection(db, 'suggestions'));
        suggestionsList.innerHTML = '';

        if (querySnapshot.empty) {
            suggestionsList.innerHTML = '<div class="alert alert-info">لا توجد اقتراحات جديدة</div>';
            return;
        }

        querySnapshot.forEach(async (sugDoc) => {
            const sug = sugDoc.data();
            const userDoc = await getDoc(doc(db, 'users', sug.userId));
            const userName = userDoc.exists() ? userDoc.data().username : 'مجهول';

            const sugElement = document.createElement('div');
            sugElement.className = 'list-group-item bg-dark text-white mb-2';
            sugElement.innerHTML = `<strong>من ${userName}:</strong><br>${sug.content}`;
            suggestionsList.appendChild(sugElement);
        });
    } catch (error) {
        suggestionsList.innerHTML = `<div class="alert alert-danger">خطأ: ${error.message}</div>`;
    }
});


sendMsgBtn.addEventListener('click', () => {
    adminPanelScreen.classList.add('hidden');
    document.getElementById('admin-send-screen').classList.remove('hidden');
});

sendAdminMsg.addEventListener('click', async () => {
    const targetUser = targetUsername.value.trim();
    const msgContent = adminMessage.value.trim();

    if (!targetUser || !msgContent) {
        document.getElementById('admin-send-error').textContent = 'املأ جميع الحقول';
        return;
    }

    try {
        
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const targetUserDoc = usersSnapshot.docs.find(d => d.data().username.toLowerCase() === targetUser.toLowerCase());

        if (!targetUserDoc) {
            document.getElementById('admin-send-error').textContent = 'المستخدم غير موجود';
            return;
        }

        await addDoc(collection(db, 'messages', targetUserDoc.id), {
            content: msgContent,
            timestamp: new Date(),
            from: 'الأدمن'
        });

        alert('تم إرسال الرسالة بنجاح');
        targetUsername.value = '';
        adminMessage.value = '';
    } catch (error) {
        document.getElementById('admin-send-error').textContent = 'خطأ: ' + error.message;
    }
});


muteChatBtn.addEventListener('click', async () => {
    if (!isAdmin) return alert('ليس لديك صلاحيات');
    if (!currentRoomId) return alert('أنت لست في غرفة');

    const muted = (await get(ref(realtimeDb, `roomStates/${currentRoomId}/chatMuted`))).val();
    await set(ref(realtimeDb, `roomStates/${currentRoomId}/chatMuted`), !muted);
    muteChatBtn.textContent = !muted ? 'إلغاء كتم الشات' : 'كتم الشات';
});

deleteRoomBtn.addEventListener('click', async () => {
    if (!isAdmin) return alert('ليس لديك صلاحيات');
    if (!currentRoomId) return alert('أنت لست في غرفة');

    let countdown = 5;
    const interval = setInterval(async () => {
        alert(`سيتم حذف الغرفة بعد ${countdown} ثواني`);
        countdown--;
        if (countdown < 0) {
            clearInterval(interval);
            await deleteDoc(doc(db, 'rooms', currentRoomId));
            await remove(ref(realtimeDb, `roomStates/${currentRoomId}`));
            await remove(ref(realtimeDb, `chats/${currentRoomId}`));
            document.getElementById('display-screen').classList.add('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
            currentRoomId = null;
        }
    }, 1000);
});

welcomeChatBtn.addEventListener('click', async () => {
    if (!isAdmin) return alert('ليس لديك صلاحيات');
    if (!currentRoomId) return alert('أنت لست في غرفة');

    const chatRef = ref(realtimeDb, `chats/${currentRoomId}`);
    await push(chatRef, {
        username: 'الأدمن',
        content: 'تم تسجيل دخول الأدمن. الأدمن الآن يطلع عليكم، استمتعوا!',
        profilePic: 'admin.png',
        style: 'admin-welcome',
        timestamp: Date.now()
    });
});