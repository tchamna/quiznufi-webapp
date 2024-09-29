const admin = require('firebase-admin');

// Replace 'path/to/serviceAccountKey.json' with the path to your service account key file
const serviceAccount = require('./quiznufi-webapp-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const deleteUsersByEmail = async (emails) => {
  try {
    // Fetch users by email
    const getUserPromises = emails.map((email) => admin.auth().getUserByEmail(email));

    // Resolve all promises to get user records
    const userRecords = await Promise.allSettled(getUserPromises);

    // Separate successful and failed lookups
    const successfulLookups = userRecords.filter(result => result.status === 'fulfilled');
    const failedLookups = userRecords.filter(result => result.status === 'rejected');

    // Extract UIDs from successful lookups
    const uids = successfulLookups.map((result) => result.value.uid);

    if (uids.length === 0) {
      console.log('No valid users found to delete.');
      return;
    }

    // Delete users by UID
    const deleteUsersResult = await admin.auth().deleteUsers(uids);

    console.log(`Successfully deleted ${deleteUsersResult.successCount} users.`);
    if (deleteUsersResult.failureCount > 0) {
      console.log(`Failed to delete ${deleteUsersResult.failureCount} users:`);
      deleteUsersResult.errors.forEach((err) => {
        console.error(`Error deleting user ${err.index}: ${err.error.toJSON()}`);
      });
    }

    // Optionally, delete user data from Firestore
    await deleteUserData(uids);

    // Log failed email lookups
    if (failedLookups.length > 0) {
      console.log('The following emails could not be found:');
      failedLookups.forEach((result, index) => {
        console.error(`- ${emails[index]}: ${result.reason.message}`);
      });
    }

  } catch (error) {
    console.error('Error deleting users:', error);
  }
};

const deleteUserData = async (uids) => {
  try {
    const batch = db.batch();

    // Delete user documents from 'users' collection
    uids.forEach((uid) => {
      const userRef = db.collection('users').doc(uid);
      batch.delete(userRef);
    });

    // Delete user entries from 'leaderboard' collection
    const leaderboardSnapshot = await db.collection('leaderboard').where('uid', 'in', uids).get();
    leaderboardSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('Successfully deleted user data from Firestore.');
  } catch (error) {
    console.error('Error deleting user data from Firestore:', error);
  }
};

// List of emails to delete
const emailsToDelete = [
  'deusiar@gmail.com',
  'tchamna@gmail.com',
  'we1no1kwe1no1k@gmail.com',
  'tchamna@yahoo.fr',
];

deleteUsersByEmail(emailsToDelete);
