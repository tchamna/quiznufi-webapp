import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

import pandas as pd
import random

#################################################################################
# Build Quiz Options from a 2 columns dataset: Question|Correct Answer

# data = pd.read_csv(csv_file_path)

def build_quiz_questions_from2columns(data, number_of_wrong_options=3):
    """
    Generates a quiz with multiple choice options from a DataFrame containing questions and correct answers.

    This function takes a DataFrame with at least two columns: one for questions and one for the correct answers.
    It generates multiple choice options for each question by selecting a specified number of unique incorrect options 
    randomly from the set of all correct answers in the dataset, ensuring no duplicate incorrect answers within 
    a given question. Incorrect answers can be repeated across different questions.
    The generated options are saved as additional columns in a new CSV file.

    Parameters
    ----------
    data : pandas.DataFrame
        The input DataFrame containing the quiz questions and correct answers. 
        The DataFrame must have at least two columns, where one column contains the correct answers.
        The column names are expected to be case-insensitive.

    number_of_wrong_options : int, optional
        The number of incorrect options to generate for each question (default is 3).
        This determines how many wrong options are included alongside the correct answer.
        The total number of options for each question will be `number_of_wrong_options + 1`.

    Raises
    ------
    ValueError
        If the number of incorrect options specified is greater than the number of available unique 
        answers minus one (to account for the correct answer).

    Examples
    --------
    >>> build_quiz_questions_from2columns(df, number_of_wrong_options=4)
    This will generate a quiz with each question having 5 options: 1 correct and 4 unique incorrect ones.
    """
    
    data = data.drop_duplicates()
    # Ensure all column names are in lowercase
    data.columns = [col.lower() for col in data.columns]

    # Create a list of all possible correct answers
    all_answers = set(data['correct'].unique())  # Use a set to ensure uniqueness

    # Check if there are enough unique incorrect options available
    if number_of_wrong_options >= len(all_answers):
        raise ValueError("Number of wrong options specified exceeds the available unique answers.")
    
    # Function to generate options for each question
    def generate_options(row, all_answers, number_of_wrong_options):
        correct_answer = row['correct']
        # Ensure that the correct answer is the first option (option_0)
        options = [correct_answer]

        # Get potential incorrect answers by excluding the correct one
        potential_incorrect_answers = list(all_answers - {correct_answer})  # Convert set to list
        
        # Randomly select the specified number of unique incorrect answers
        incorrect_answers = random.sample(potential_incorrect_answers, number_of_wrong_options)
        options.extend(incorrect_answers)
        
        return options

    # Create a list of column names dynamically based on the number of options
    option_columns = [f'option_{i}' for i in range(number_of_wrong_options + 1)]
    
    # Apply the function and create new columns dynamically
    data[option_columns] = data.apply(lambda row: pd.Series(generate_options(row, all_answers, number_of_wrong_options)), axis=1)

    # Save the updated DataFrame back to a CSV file
    output_file_path = 'quiznufi_with_options.csv'
    data.to_csv(output_file_path, index=False, encoding="utf-8-sig")

    print(f"Options generated and saved successfully to {output_file_path}!")

    return data

# Load the CSV data
csv_file_path = r"quiznufi.csv"
df = pd.read_csv(csv_file_path)

# Add formatted question column
df["question"] = "Que signifie « " + df["question"] + " » ?"

# Generate quiz questions with unique wrong answers per question
questions_set = build_quiz_questions_from2columns(df, number_of_wrong_options=3)

# questions_set["time"] = 15


#################################################################################


# Check if the default app is already initialized
if not firebase_admin._apps:
    # Initialize Firebase Admin SDK
    cred = credentials.Certificate('quiznufi-webapp-firebase-adminsdk.json')
    firebase_admin.initialize_app(cred)



# Initialize Firestore client
db = firestore.client()

# # Load CSV data
# csv_file_path = 'quiznufi2.csv'
# questions_set = pd.read_csv(csv_file_path)

# Reference to Firestore collection
collection_name = 'questions'  # Use your collection name here
collection_ref = db.collection(collection_name)

# Identify all columns that start with 'option_'
option_columns = [col for col in questions_set.columns if col.startswith('option_')]

# Sort the option columns to maintain order (optional but recommended)
option_columns.sort(key=lambda x: int(x.split('_')[1]))

# Loop through the questions_set and upload each row
for index, row in questions_set.iterrows():
    # Collect options dynamically
    options = [row[col] for col in option_columns if pd.notnull(row[col])]
    
    # Construct document data
    document_data = {
        'question': row['question'],
        'correct': row['correct'],
        'time': row['time'],
        'difficulty_level': row['difficulty_level'],
        'quiz_area': row['quiz_area'],
        'options': options
    }
    
    # Check if a document with the same question already exists
    existing_documents = collection_ref.where('question', '==', row['question']).stream()
    exists = False
    for doc in existing_documents:
        # If a document exists with the same question, update it
        collection_ref.document(doc.id).set(document_data)
        exists = True
        break
    
    # If no matching document was found, add a new document
    if not exists:
        collection_ref.add(document_data)

print("Data uploaded/updated successfully to Firestore!")
