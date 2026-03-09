/*  =============================================
    FIREBASE CONFIGURATION
    =============================================

    SETUP INSTRUCTIONS (one-time, ~2 minutes):

    1. Go to https://console.firebase.google.com
    2. Click "Create a project" (name it e.g. "hotel-sri-vaari")
    3. Disable Google Analytics (not needed) → Create Project
    4. In the project dashboard, click the web icon </> to add a web app
    5. Register app (name: "hotel-sri-vaari-web") — skip hosting
    6. Copy the firebaseConfig object and paste it below (replace the placeholder)
    7. Go to "Build" → "Realtime Database" → "Create Database"
    8. Choose a location → Start in TEST MODE → Enable
    9. Done! Your ordering system is now live.

    ============================================= */

const firebaseConfig = {
    apiKey: "AIzaSyBfVpVWNZiSG2teIfK-u-CBbY7054GOiYU",
    authDomain: "hotel-sri-vaari.firebaseapp.com",
    databaseURL: "https://hotel-sri-vaari-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hotel-sri-vaari",
    storageBucket: "hotel-sri-vaari.firebasestorage.app",
    messagingSenderId: "471119134529",
    appId: "1:471119134529:web:004c1d866da3eb27812bc0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
/*print("Firebase initialized successfully.");
/*this will be my second commit now
/*hello*/