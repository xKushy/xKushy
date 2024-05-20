// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtl0-XaZO-iYCpUuPvLrNYdv-0PeQbsKM",
  authDomain: "eternity-bbab1.firebaseapp.com",
  projectId: "eternity-bbab1",
  storageBucket: "eternity-bbab1.appspot.com",
  messagingSenderId: "795703593856",
  appId: "1:795703593856:web:938fec7825250cdc66cf65",
  measurementId: "G-1Y3R582RXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const postForm = document.getElementById('postForm');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const authContainer = document.getElementById('authContainer');
  const postContainer = document.getElementById('postContainer');
  const postFormContainer = document.getElementById('postFormContainer');

  // Registro de Usuário
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        console.log('User registered:', userCredential.user);
        alert('Registered successfully. Please log in.');
      })
      .catch(error => {
        console.error('Error registering user:', error);
        alert('Error registering user: ' + error.message);
      });
  });

  // Login de Usuário
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        console.log('User logged in:', userCredential.user);
      })
      .catch(error => {
        console.error('Error logging in user:', error);
        alert('Error logging in user: ' + error.message);
      });
  });

  // Logout de Usuário
  logoutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
      console.log('User logged out');
    }).catch(error => {
      console.error('Error logging out:', error);
      alert('Error logging out: ' + error.message);
    });
  });

  // Estado de Autenticação
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log('User is logged in:', user);
      authContainer.style.display = 'none';
      postFormContainer.style.display = 'block';
      loginButton.style.display = 'none';
      logoutButton.style.display = 'block';
      loadPosts();
    } else {
      console.log('No user is logged in');
      authContainer.style.display = 'block';
      postFormContainer.style.display = 'none';
      loginButton.style.display = 'block';
      logoutButton.style.display = 'none';
    }
  });

// Upload de Imagens e Criação de Postagens
postForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const file = document.getElementById('upload-file').files[0];
  const storageRef = ref(storage, `posts/${file.name}`);
  uploadBytes(storageRef, file).then(() => {
      console.log('File uploaded');
      getDownloadURL(storageRef).then(url => {
          addDoc(collection(db, 'posts'), {
              imageUrl: url,
              username: auth.currentUser.email,
              createdAt: serverTimestamp(),
              likes: 0
          }).then((docRef) => {
              console.log('Post created with ID:', docRef.id);
              window.location.href = `comments.html?postId=${docRef.id}`;
          }).catch(error => {
              console.error('Error creating post:', error);
          });
      });
  }).catch(error => {
      console.error('Error uploading file:', error);
  });
});



  // Carregar Postagens
  function loadPosts() {
    const postsCollection = collection(db, 'posts');
    onSnapshot(postsCollection, (snapshot) => {
      postContainer.innerHTML = ''; // Limpar posts anteriores
      snapshot.forEach(doc => {
        const post = doc.data();
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `
          <div class="post-header">
            <img src="https://via.placeholder.com/50" alt="Profile Picture">
            <span>@${post.username}</span>
          </div>
          <img class="post-image" src="${post.imageUrl}" alt="Post Image">
          <div class="post-actions">
            <button class="like-button">Like</button>
            <span class="like-count">${post.likes} likes</span>
          </div>
          <div class="comment-section">
            <h3>Comments</h3>
            <div class="comments" id="comments-${doc.id}"></div>
            <div class="comment-form">
              <textarea id="comment-input-${doc.id}" placeholder="Add a comment"></textarea>
              <button class="add-comment-button" data-post-id="${doc.id}">Post</button>
            </div>
          </div>
        `;
        const likeButton = postElement.querySelector('.like-button');
        const likeCount = postElement.querySelector('.like-count');
        const addCommentButton = postElement.querySelector('.add-comment-button');
        likeButton.addEventListener('click', () => {
          const postRef = doc(db, 'posts', doc.id);
          getDoc(postRef).then((docSnap) => {
            if (docSnap.exists()) {
              const currentLikes = docSnap.data().likes || 0;
              updateDoc(postRef, { likes: currentLikes + 1 });
              likeCount.textContent = `${currentLikes + 1} likes`;
            }
          });
        });
        addCommentButton.addEventListener('click', () => {
          const commentInput = document.getElementById(`comment-input-${doc.id}`);
          const commentText = commentInput.value;
          if (commentText.trim()) {
            const postRef = doc(db, 'posts', doc.id);
            const commentsCollection = collection(postRef, 'comments');
            addDoc(commentsCollection, {
              text: commentText,
              username: auth.currentUser.email,
              createdAt: serverTimestamp()
            }).then(() => {
              commentInput.value = '';
              loadComments(doc.id);
            }).catch(error => {
              console.error('Error adding comment:', error);
            });
          }
        });
        postContainer.appendChild(postElement);
        loadComments(doc.id);
      });
    });
  }

  // Carregar Comentários
  function loadComments(postId) {
    const postRef = doc(db, 'posts', postId);
    const commentsCollection = collection(postRef, 'comments');
    const commentsContainer = document.getElementById(`comments-${postId}`);
    onSnapshot(commentsCollection, (snapshot) => {
      commentsContainer.innerHTML = ''; // Limpar comentários anteriores
      snapshot.forEach(doc => {
        const comment = doc.data();
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment');
        commentElement.innerHTML = `
          <img src="https://via.placeholder.com/30" alt="Profile Picture">
          <div class="comment-content">
            <span>@${comment.username}</span>
            <p>${comment.text}</p>
          </div>
        `;
        commentsContainer.appendChild(commentElement);
      });
    });
  }
});
