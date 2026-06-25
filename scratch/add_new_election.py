import re

with open('src/components/CipaElectionTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add Nova Eleição button next to Configurações
new_buttons = """        <div className="flex flex-wrap gap-2 z-10 w-full md:w-auto">
          <button
            onClick={() => {
              setEditingElectionId(null);
              setElectionName("Nova Eleição CIPA");
              setElectionTerm("");
              setElectionPresident("");
              setElectionSecretary("");
              setElectionDescription("");
              setElectionStartsAt("");
              setElectionEndsAt("");
              setElectionIsActive(true);
              setShowSettingsModal(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer"
          >
            <span>+ Nova Eleição</span>
          </button>

          <button
            onClick={() => {
              if (selectedElection) {
                setEditingElectionId(selectedElection.id);
                setElectionName(selectedElection.name);
                setElectionTerm(selectedElection.term);
                setElectionPresident(selectedElection.presidentName);
                setElectionSecretary(selectedElection.secretaryName);
                setElectionDescription(selectedElection.description);
                setElectionStartsAt(
                  formatDatetimeLocal(selectedElection.startsAt),
                );
                setElectionEndsAt(formatDatetimeLocal(selectedElection.endsAt));
                setElectionIsActive(selectedElection.isActive);
              } else {
                setEditingElectionId(null);
                setElectionName("CIPA Nova Eleição");
                setElectionTerm("");
                setElectionPresident("");
                setElectionSecretary("");
                setElectionDescription("");
                setElectionStartsAt("");
                setElectionEndsAt("");
                setElectionIsActive(true);
              }
              setShowSettingsModal(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>"""

# Find where the button block starts
content = re.sub(
    r"<div className=\"flex flex-wrap gap-2 z-10 w-full md:w-auto\">\s*<button\s*onClick=\{\(\) => \{\s*if \(selectedElection\) \{.*?<span>Prazos</span>\s*</button>",
    new_buttons,
    content,
    flags=re.DOTALL
)

with open('src/components/CipaElectionTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
