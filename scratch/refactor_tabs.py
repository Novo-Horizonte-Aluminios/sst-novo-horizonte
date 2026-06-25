import re

with open('src/components/CipaElectionTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update states
content = re.sub(
    r"// Active Tab: 'candidatos' \| 'funcionarios' \| 'nao_votaram'\s*const \[activeSubTab, setActiveSubTab\] = useState<\s*\"candidatos\" \| \"funcionarios\" \| \"nao_votaram\"\s*>\(\"candidatos\"\);\s*// Selection View: 'candidatos' \| 'eleitores'\s*const \[selectionView, setSelectionView\] = useState<\s*\"candidatos\" \| \"eleitores\"\s*>\(\"candidatos\"\);",
    """// Active Tab
  const [activeTab, setActiveTab] = useState<
    "candidatos" | "funcionarios" | "nao_votaram" | "eleitores"
  >("candidatos");""",
    content,
    flags=re.MULTILINE
)

# 2. Fix setSelectedEmployeeId(data.employee.id); setSelectionView("candidatos"); to setActiveTab("candidatos");
content = content.replace('setSelectionView("candidatos");', 'setActiveTab("candidatos");')
content = content.replace('setSelectionView("eleitores");', 'setActiveTab("eleitores");')

# 3. Replace the entire top bar and subtabs with a unified tab bar
tab_bar_regex = r"<div className=\"flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-700 pb-3 gap-3\">\s*<div className=\"flex gap-1\.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl\">\s*<button.*?Selecionar Candidatos\s*</button>\s*<button.*?Selecionar Eleitores\s*</button>\s*</div>"
new_tab_bar = """<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
          <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("candidatos")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                activeTab === "candidatos"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-650 hover:bg-slate-200 dark:bg-slate-700/60"
              }`}
            >
              <Users className="w-4 h-4" />
              Candidatos
            </button>
            <button
              onClick={() => setActiveTab("funcionarios")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                activeTab === "funcionarios"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-650 hover:bg-slate-200 dark:bg-slate-700/60"
              }`}
            >
              <Users className="w-4 h-4" />
              Funcionários
            </button>
            <button
              onClick={() => setActiveTab("nao_votaram")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                activeTab === "nao_votaram"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-650 hover:bg-slate-200 dark:bg-slate-700/60"
              }`}
            >
              <Users className="w-4 h-4" />
              Não Votaram
            </button>
            <button
              onClick={() => setActiveTab("eleitores")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                activeTab === "eleitores"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-650 hover:bg-slate-200 dark:bg-slate-700/60"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Já Votaram
            </button>
          </div>"""
content = re.sub(tab_bar_regex, new_tab_bar, content, flags=re.DOTALL)

# 4. Remove the subtabs rendering block entirely
# `        {selectionView === "candidatos" ? (` until the `{selectionView === "candidatos" && activeSubTab === "candidatos"` part
subtabs_regex = r"\{\s*selectionView === \"candidatos\"\s*\?\s*\(\s*<div className=\"flex gap-2\">\s*<button.*?setActiveSubTab\(\"candidatos\"\).*?Candidatos\s*</button>\s*<button.*?setActiveSubTab\(\"funcionarios\"\).*?Funcionários\s*</button>\s*<button.*?setActiveSubTab\(\"nao_votaram\"\).*?Não Votaram\s*</button>\s*</div>\s*\)\s*:\s*\(\s*<div>"
# Instead of regex that might fail due to specific formatting, we will just replace the specific expressions
content = re.sub(r"\{\s*selectionView\s*===\s*\"candidatos\"\s*\?\s*\(\s*<div className=\"flex gap-2\">.*?</div>\s*\)\s*:\s*\(\s*<div>", "<div>", content, flags=re.DOTALL)

# Let's replace the other conditionals
content = content.replace('{selectionView === "candidatos" && activeSubTab === "candidatos" && (', '{activeTab === "candidatos" && (')
content = content.replace('{selectionView === "candidatos" &&\n            activeSubTab === "funcionarios" && (', '{activeTab === "funcionarios" && (')
content = content.replace('{selectionView === "candidatos" && activeSubTab === "funcionarios" && (', '{activeTab === "funcionarios" && (')
content = content.replace('{selectionView === "candidatos" && activeSubTab === "nao_votaram" && (', '{activeTab === "nao_votaram" && (')
content = content.replace('{selectionView === "eleitores" && (', '{activeTab === "eleitores" && (')

# Find if there are any remaining `)}` at the end of the `) : ( <div>` block. We probably don't even need to remove `selectionView === "candidatos" ? (` if we didn't have it.
# Actually let's just make the script write everything out, if something breaks we will fix it.

with open('src/components/CipaElectionTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
