// seed.js

const admin = require('firebase-admin');

// Replace with your Firebase service account key file path
const serviceAccount = require('./quiznufi-webapp-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedLeaderboard() {
  const leaderboardRef = db.collection('leaderboard');

  // Sample data to populate the leaderboard
  const sampleData = [
    {
      uid: 'user1',
      username: 'Mbə̄ə̄ lɑ́',
      score: 10,
      totalQuestions: 10,
      percentage: 100.0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      uid: 'user2',
      username: 'Yáá mɑ̀ lāhā?',
      score: 8,
      totalQuestions: 10,
      percentage: 80.0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      uid: 'user3',
      username: 'Fʉ̀',
      score: 7,
      totalQuestions: 10,
      percentage: 70.0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  // Add each sample data to the leaderboard collection
  for (const data of sampleData) {
    await leaderboardRef.add(data);
    console.log(`Added: ${data.username}`);
  }

  console.log('Leaderboard seeding completed.');
}

seedLeaderboard()
  .then(() => {
    console.log('Seeding finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding leaderboard:', error);
    process.exit(1);
  });
