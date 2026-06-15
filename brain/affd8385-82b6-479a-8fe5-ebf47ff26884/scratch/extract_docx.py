import zipfile
import xml.etree.ElementTree as ET
import sys

def get_docx_text(path):
    """
    Extract text from a docx file using zipfile and xml parsing.
    This works without python-docx.
    """
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            text_runs = []
            for p in root.findall('.//w:p', ns):
                paragraph_text = []
                for r in p.findall('.//w:r', ns):
                    for t in r.findall('.//w:t', ns):
                        if t.text:
                            paragraph_text.append(t.text)
                if paragraph_text:
                    text_runs.append(''.join(paragraph_text))
                else:
                    text_runs.append('')
            return '\n'.join(text_runs)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: extract_docx.py <input_docx> <output_txt>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    text = get_docx_text(input_path)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Successfully extracted to {output_path}")
