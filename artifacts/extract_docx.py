import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = r"c:\Users\sambi\OneDrive\Desktop\Projects\HangeulAI\phase_updates\course0phase1.docx"
output_txt = r"c:\Users\sambi\OneDrive\Desktop\Projects\HangeulAI\artifacts\extracted_docx_content.txt"

def extract_text(docx_file):
    try:
        with zipfile.ZipFile(docx_file) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {e}"

text = extract_text(docx_path)
os.makedirs(os.path.dirname(output_txt), exist_ok=True)
with open(output_txt, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extraction completed. Length: {len(text)} characters.")
