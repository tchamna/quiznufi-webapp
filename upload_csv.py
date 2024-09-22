import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

# Initialize Firebase Admin SDK
cred = credentials.Certificate('quiznufi-webapp-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)

# Initialize Firestore client
db = firestore.client()

# Load CSV data
csv_file_path = 'quiznufi2.csv'
data = pd.read_csv(csv_file_path)

# Reference to Firestore collection
collection_name = 'questions'  # Use your collection name here
collection_ref = db.collection(collection_name)

# Identify all columns that start with 'option_'
option_columns = [col for col in data.columns if col.startswith('option_')]

# Sort the option columns to maintain order (optional but recommended)
option_columns.sort(key=lambda x: int(x.split('_')[1]))

# Loop through the data and upload each row
for index, row in data.iterrows():
    # Collect options dynamically
    options = [row[col] for col in option_columns if pd.notnull(row[col])]
    
    # Construct document data
    document_data = {
        'question': row['question'],
        'correct': row['correct'],
        'time': row['time'],
        'options': options
    }
    
    # Add document to Firestore
    collection_ref.add(document_data)

print("Data uploaded successfully to Firestore!")
