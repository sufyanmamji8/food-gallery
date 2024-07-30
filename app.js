import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBj0HT4W4aARblxeg9-jgehUpzhGCdlR8I",
    authDomain: "e-store-a0ade.firebaseapp.com",
    projectId: "e-store-a0ade",
    storageBucket: "e-store-a0ade.appspot.com",
    messagingSenderId: "354313090658",
    appId: "1:354313090658:web:54b4d2dbe442568264833b",
    measurementId: "G-3VPMX53SC0"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Login function
window.login = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('input-section').style.display = 'block';
        document.getElementById('profile-container').style.display = 'block';
        document.getElementById('welcome-message').innerText = `Welcome, ${auth.currentUser.email}`;
        loadProfilePic();
        loadItems();
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Login failed. Please check your credentials.');
    }
};

// Signup function
window.signup = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('input-section').style.display = 'block';
        document.getElementById('profile-container').style.display = 'block';
        document.getElementById('welcome-message').innerText = `Welcome, ${auth.currentUser.email}`;
    } catch (error) {
        console.error('Error signing up:', error);
        alert('Signup failed. Please check your credentials.');
    }
};

// Logout function
window.logout = async function() {
    try {
        await signOut(auth);
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('input-section').style.display = 'none';
        document.getElementById('profile-container').style.display = 'none';
        document.getElementById('food-container').innerHTML = '';
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

// Upload profile picture function
window.uploadProfilePic = async function() {
    const newProfilePic = document.getElementById('new-profile-pic').files[0];
    if (newProfilePic) {
        try {
            const profilePicRef = ref(storage, `profile-pics/${auth.currentUser.uid}`);
            await uploadBytes(profilePicRef, newProfilePic);
            const profilePicURL = await getDownloadURL(profilePicRef);
            await updateProfile(auth.currentUser, { photoURL: profilePicURL });
            document.getElementById('profile-picture').src = profilePicURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
        }
    }
};

// Load profile picture function
async function loadProfilePic() {
    const user = auth.currentUser;
    if (user) {
        const profilePicURL = user.photoURL || 'default-pic.jpg';
        document.getElementById('profile-picture').src = profilePicURL;
    }
}

// Add item function
window.addItem = async function() {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const picture = document.getElementById('picture').files[0];
    const user = auth.currentUser;

    if (user && title && description) {
        try {
            const pictureRef = ref(storage, `item-pics/${Date.now()}_${picture.name}`);
            await uploadBytes(pictureRef, picture);
            const pictureURL = await getDownloadURL(pictureRef);

            await addDoc(collection(db, 'items'), {
                title: title,
                description: description,
                pictureURL: pictureURL,
                userName: user.displayName || user.email.split('@')[0],
                userUid: user.uid,
                timestamp: serverTimestamp()
            });

            alert('Item added');
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            document.getElementById('picture').value = '';
        } catch (error) {
            console.error('Error adding item:', error);
        }
    } else {
        alert('Please fill all the  fields.');
    }
};

// Load items function
async function loadItems() {
    const q = query(collection(db, 'items'), orderBy('timestamp', 'desc'));
    onSnapshot(q, (snapshot) => {
        const foodContainer = document.getElementById('food-container');
        foodContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const item = doc.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${item.pictureURL}" class="card-img" alt="Item Picture">
                <div class="card-content">
                    <h2>${item.title}</h2>
                    <p>${item.description}</p>
                    <p class="card-user">Posted by: ${item.userName}</p>
                    <button class="edit-btn" onclick="editItem('${doc.id}', '${item.title}', '${item.description}')">Edit</button>
                    <button class="delete-btn" onclick="deleteItem('${doc.id}')">Delete</button>
                </div>
            `;
            foodContainer.appendChild(card);
        });
    });
}

// Edit item function
window.editItem = function(itemId, currentTitle, currentDescription) {
    const newTitle = prompt("Edit title:", currentTitle);
    const newDescription = prompt("Edit description:", currentDescription);

    if (newTitle !== null && newDescription !== null) {
        const itemDoc = doc(db, 'items', itemId);
        updateDoc(itemDoc, {
            title: newTitle,
            description: newDescription
        }).then(() => {
            alert('Item updated!');
        }).catch((error) => {
            console.error('Error updating item:', error);
        });
    }
};

// Delete item function
window.deleteItem = async function(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await deleteDoc(doc(db, 'items', itemId));
            alert('Item deleted!');
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }
};

// Toggle profile popup function
window.toggleProfilePopup = function() {
    const popup = document.getElementById('profile-popup');
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
};

// Initialize the app
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('input-section').style.display = 'block';
        document.getElementById('profile-container').style.display = 'block';
        document.getElementById('welcome-message').innerText = `Welcome, ${user.email}`;
        loadProfilePic();
        loadItems();
    } else {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('input-section').style.display = 'none';
        document.getElementById('profile-container').style.display = 'none';
        document.getElementById('food-container').innerHTML = '';
    }
});