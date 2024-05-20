// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
  const commentsContainer = document.getElementById('commentsContainer');
  const postCommentButton = document.getElementById('postCommentButton');
  const newComment = document.getElementById('newComment');

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('postId');

  if (!postId) {
    alert('No post ID found');
    return;
  }

  onAuthStateChanged(auth, user => {
    if (user) {
      loadComments(postId);

      postCommentButton.addEventListener('click', () => {
        const commentText = newComment.value.trim();
        if (commentText) {
          addDoc(collection(doc(db, 'posts', postId), 'comments'), {
            text: commentText,
            username: auth.currentUser.email,
            createdAt: serverTimestamp()
          }).then(() => {
            newComment.value = '';
            loadComments(postId);
          }).catch(error => {
            console.error('Error adding comment:', error);
          });
        }
      });
    } else {
      alert('You need to be logged in to comment');
    }
  });

  function loadComments(postId) {
    const postRef = doc(db, 'posts', postId);
    const commentsCollection = collection(postRef, 'comments');
    const commentsQuery = query(commentsCollection, orderBy('createdAt', 'asc'));

    onSnapshot(commentsQuery, (snapshot) => {
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
