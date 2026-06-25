with open('src/components/CipaElectionTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

helper_fn = """  // Helper to format date for datetime-local input
  const formatDatetimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
"""

content = content.replace("  const fetchElections = async () => {", helper_fn + "\n  const fetchElections = async () => {")

# It can be either broken into lines or not depending on prettier
import re
content = re.sub(
    r"setElectionStartsAt\(\s*new Date\(selectedElection\.startsAt\)\s*\.toISOString\(\)\s*\.slice\(0,\s*16\),\s*\);",
    "setElectionStartsAt(formatDatetimeLocal(selectedElection.startsAt));",
    content
)

content = re.sub(
    r"setElectionEndsAt\(\s*new Date\(selectedElection\.endsAt\)\s*\.toISOString\(\)\s*\.slice\(0,\s*16\),\s*\);",
    "setElectionEndsAt(formatDatetimeLocal(selectedElection.endsAt));",
    content
)

# And in case prettier hasn't broken them:
content = content.replace(
    'setElectionStartsAt(new Date(selectedElection.startsAt).toISOString().slice(0, 16));',
    'setElectionStartsAt(formatDatetimeLocal(selectedElection.startsAt));'
)
content = content.replace(
    'setElectionEndsAt(new Date(selectedElection.endsAt).toISOString().slice(0, 16));',
    'setElectionEndsAt(formatDatetimeLocal(selectedElection.endsAt));'
)

with open('src/components/CipaElectionTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
