import re

with open('src/components/CipaElectionTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Safe toUpperCase() and toLowerCase()
replacements = {
    r"empMatch\.sector\.toUpperCase\(\)": r"(empMatch.sector || '').toUpperCase()",
    r"empMatch\.role\.toUpperCase\(\)": r"(empMatch.role || '').toUpperCase()",
    r"cand\.sector\.toUpperCase\(\)": r"(cand.sector || '').toUpperCase()",
    r"emp\.sector\.toUpperCase\(\)": r"(emp.sector || '').toUpperCase()",
    r"emp\.role\.toUpperCase\(\)": r"(emp.role || '').toUpperCase()",
    r"c\.sector\.toUpperCase\(\)": r"(c.sector || '').toUpperCase()",
    r"v\.employeeName\.toUpperCase\(\)": r"(v.employeeName || '').toUpperCase()",
    r"emp\.name\.toUpperCase\(\)": r"(emp.name || '').toUpperCase()",
    r"cand\.name\.toUpperCase\(\)": r"(cand.name || '').toUpperCase()",
    r"c\.name\.toUpperCase\(\)": r"(c.name || '').toUpperCase()",
    
    r"v\.employeeName\s*\n?\s*\.toLowerCase\(\)": r"(v.employeeName || '').toLowerCase()",
    r"emp\.name\s*\n?\s*\.toLowerCase\(\)": r"(emp.name || '').toLowerCase()",
    r"empMatch\.name\s*\n?\s*\.toLowerCase\(\)": r"(empMatch.name || '').toLowerCase()",
    r"cand\.name\s*\n?\s*\.toLowerCase\(\)": r"(cand.name || '').toLowerCase()",
    r"c\.name\s*\n?\s*\.toLowerCase\(\)": r"(c.name || '').toLowerCase()",
    
    r"emp\.cpf\.includes": r"(emp.cpf || '').includes"
}

for old, new_str in replacements.items():
    content = re.sub(old, new_str, content)

with open('src/components/CipaElectionTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
