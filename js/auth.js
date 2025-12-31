

import { auth, db, ADMIN_CODE, isAdmin } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { doc, setDoc, getDoc, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';


const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const roleScreen = document.getElementById('role-screen');
const adminCodeScreen = document.getElementById('admin-code-screen');
const mainScreen = document.getElementById('main-screen');
const adminPanelBtn = document.getElementById('admin-panel-btn');
const profilePics = document.getElementById('profile-pics');
const completeSignup = document.getElementById('complete-signup');
const verifyAdmin = document.getElementById('verify-admin');


let selectedProfile = '';


signupBtn.addEventListener('click', () => {
    document.getElementById('login-screen').classList.add('hidden');
    signupForm.classList.remove('hidden');
});


loginBtn.addEventListener('click', () => {
    document.getElementById('login-screen').classList.add('hidden');
    loginForm.classList.remove('hidden');
});


document.getElementById('do-login').addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        document.getElementById('login-error').textContent = 'املأ جميع الحقول';
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, `${username}@wewatch.com`, password);
        showRoleScreen();
    } catch (error) {
        document.getElementById('login-error').textContent = 'خطأ في تسجيل الدخول: ' + error.message;
    }
});


completeSignup.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const age = parseInt(document.getElementById('age').value);
    const password = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const gender = document.getElementById('gender').value;

    if (!username) return document.getElementById('signup-error').textContent = 'الاسم مطلوب';
    if (isNaN(age) || age < 12) return document.getElementById('signup-error').textContent = 'العمر يجب أن يكون 12 سنة أو أكثر';
    if (password.length < 6) return document.getElementById('signup-error').textContent = 'كلمة المرور قصيرة جدًا';
    if (password !== confirmPass) return document.getElementById('signup-error').textContent = 'كلمتي المرور غير متطابقتين';
    if (!selectedProfile) return document.getElementById('signup-error').textContent = 'اختر صورة شخصية';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, `${username}@wewatch.com`, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            username,
            age,
            gender,
            profilePic: selectedProfile,
            createdAt: new Date()
        });

        
        await setDoc(doc(db, 'messages', user.uid, 'welcome'), {
            content: `اهلا ${username} بك في موقعنا الرائع من فضلك لا تقم بالتخريب وادعو أصدقائك لمشاهدة الأفلام أو اليوتيوب أو أي شيء معك ساعدنا حتى نجمع بعض المال لكي نشتري دومين خاص بنا مع تحيات موقعك الخاص`,
            timestamp: new Date()
        });

        showRoleScreen();
    } catch (error) {
        document.getElementById('signup-error').textContent = 'خطأ في إنشاء الحساب: ' + error.message;
    }
});


document.getElementById('gender').addEventListener('change', (e) => {
    profilePics.innerHTML = '';
    const pics = e.target.value === 'male' 
        ? ['man1.png', 'man2.png', 'man3.png', 'duf.png']
        : ['girl1.png', 'girl2.png', 'girl3.png', 'duf.png'];

    pics.forEach(pic => {
        const img = document.createElement('img');
        img.src = `images/${pic}`;
        img.className = 'm-2 rounded-circle';
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.cursor = 'pointer';

        img.addEventListener('click', () => {
            profilePics.querySelectorAll('img').forEach(i => i.classList.remove('border', 'border-warning', 'border-4'));
            img.classList.add('border', 'border-warning', 'border-4');
            selectedProfile = pic;
            completeSignup.classList.remove('hidden');
        });

        profilePics.appendChild(img);
    });
    profilePics.classList.remove('hidden');
});


function showRoleScreen() {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    roleScreen.classList.remove('hidden');
}


document.getElementById('user-role').addEventListener('click', showMainScreen);


document.getElementById('admin-role').addEventListener('click', () => {
    roleScreen.classList.add('hidden');
    adminCodeScreen.classList.remove('hidden');
});


verifyAdmin.addEventListener('click', () => {
    const code = document.getElementById('admin-code').value.trim();
    
    if (code === ADMIN_CODE) {
        isAdmin = true;
        sessionStorage.setItem('tempAdmin', 'true'); 
        alert('تم تفعيل صلاحيات الأدمن !\n(ستنتهي الصلاحية عند تسجيل الخروج أو إغلاق المتصفح)');
        showMainScreen();
    } else {
        document.getElementById('admin-error').textContent = 'رمز التحقق غير صحيح';
    }
});

function showMainScreen() {
    roleScreen.classList.add('hidden');
    adminCodeScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    
    if (isAdmin || sessionStorage.getItem('tempAdmin') === 'true') {
        adminPanelBtn.classList.remove('hidden');
    }
}


onAuthStateChanged(auth, (user) => {
    if (user) {
        
        showRoleScreen();
    } else {
        
        document.getElementById('login-screen').classList.remove('hidden');
        mainScreen.classList.add('hidden');
        adminPanelBtn.classList.add('hidden');
        isAdmin = false;
        sessionStorage.removeItem('tempAdmin');
    }
});


export { isAdmin };