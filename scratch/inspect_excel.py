import zipfile
import xml.etree.ElementTree as ET

zf = zipfile.ZipFile('/home/sheheryar-sohail/Downloads/Property-Management-System-main/scratch/Transfer.xlsx')
shared_strings = []
if 'xl/sharedStrings.xml' in zf.namelist():
    tree = ET.parse(zf.open('xl/sharedStrings.xml'))
    root = tree.getroot()
    for elem in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
        shared_strings.append(elem.text or '')

for i, s in enumerate(shared_strings):
    print(f"[{i}]: {s}")
