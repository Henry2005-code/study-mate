import sys
import os
import fitz  # PyMuPDF
import docx
import pytesseract
from PIL import Image

def extract_text_from_doc(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for paragraph in doc.paragraphs:
        full_text.append(paragraph.text)
    return '\n'.join(full_text)

def process_file(file_path):
    if not os.path.exists(file_path):
        print(f"File does not exist: {file_path}")
        return "File does not exist"

    file_extension = os.path.splitext(file_path)[1].lower()

    print(f'Processing file: {file_path}')
    print(f'File extension: {file_extension}')

    text = ""
    if file_extension == '.pdf':
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    elif file_extension == '.txt':
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
    elif file_extension in ['.doc', '.docx']:
        text = extract_text_from_doc(file_path)
    elif file_extension in ['.jpg', '.jpeg', '.png']:
        text = pytesseract.image_to_string(Image.open(file_path))
    else:
        text = "Unsupported file type"

    return text

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_file.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    print(f'Received file path: {file_path}')
    processed_text = process_file(file_path)
    print(processed_text)
