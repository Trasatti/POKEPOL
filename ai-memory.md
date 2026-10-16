# Diretrizes de Gerenciamento de Memória (ai-memory)

Este arquivo serve como instrução operacional para qualquer agente de inteligência artificial (LLM) que interaja com este workspace. Ele define **como**, **o que** e **onde** ler e persistir o conhecimento evolutivo deste projeto.

A fonte da verdade da nossa memória de longo prazo é baseada no conceito de **LLM Wiki**: arquivos Markdown (.md) estruturados, curtos e com nomes estáveis, permitindo auditoria humana direta e continuidade entre sessões.

---

## 1. Estrutura de Pastas e Roteamento

As memórias devem ser salvas exclusivamente sob a pasta `/ai-memory/` nas seguintes subpastas específicas:

### 📂 `decisions/`
*   **O que armazenar:** Decisões importantes de escopo, caminhos editoriais, escolhas de design, direcionamento de capítulos, tom de voz ou definição de prioridades.
*   **Regra de ouro:** Documente o **porquê** de termos escolhido a Opção A em vez da Opção B, evitando retrabalho ou discussões redundantes em sessões futuras.

### 📂 `pitfalls/`
*   **O que armazenar:** Armadilhas conhecidas do projeto (gotchas), comportamentos inesperados do ambiente de trabalho, conflitos de formatação específicos ou erros repetitivos que já foram solucionados e não devem ocorrer de novo.
*   **Regra de ouro:** Foque em barreiras práticas e bugs crônicos (e não em erros momentâneos causados por instabilidade de rede ou falhas temporárias).

### 📂 `rules/`
*   **O que armazenar:** Diretrizes de conduta permanentes, procedimentos passo a passo recorrentes (ex: fluxo de publicação, critérios de revisão de conteúdo, regras de ortografia ou restrições de formatação inegociáveis).
*   **Regra de ouro:** Esta pasta dita o comportamento operacional padrão do agente.

### 📂 `sessions/`
*   **O que armazenar:** Notas breves de encerramento de sessão (handoff), perguntas abertas, progresso atual e próximos passos claros para a próxima sessão ou o próximo agente.
*   **Regra de ouro:** Deve ser um resumo terso focado na "passagem de bastão".

---

## 2. O que DEVE vs. NÃO DEVE virar Memória

Para manter a integridade da nossa wiki e evitar acúmulo de lixo ("superstições de IA"), siga rigidamente o critério de seleção abaixo:

### ✅ DEVE virar memória (Promoção Seletiva)
*   Preferências explicitadas pelo usuário que ditam o rumo do projeto.
*   Bugs de infraestrutura ou de layout contornados com sucesso.
*   Procedimentos operacionais que precisarão ser repetidos futuramente.
*   Consensos e definições sobre o tom, estilo e limites do escopo.

### ❌ NÃO DEVE virar memória (Ruído e Poluição)
*   Comandos pontuais ou testes rápidos executados uma única vez.
*   Falhas transitórias de ambiente (erros de digitação imediatos, token expirado, queda rápida de rede).
*   Histórico bruto de chats ou conversas completas (as narrativas brutas pertencem ao histórico de sessão, não à wiki estruturada).

---

## 3. Protocolo de Operação do Agente (Início e Fim)

### 🚀 Ao Iniciar uma Nova Sessão:
1.  **Consulte a pasta `/ai-memory/sessions/`** para ler o último arquivo de handoff pendente e descobrir exatamente de onde o trabalho anterior parou.
2.  **Consulte as pastas `/ai-memory/rules/` e `/ai-memory/decisions/`** para alinhar-se com as restrições e o tom definidos antes de propor novas ideias ou rascunhos.

### 💾 Ao Finalizar ou Interromper o Trabalho:
1.  **Faça a síntese da sessão:** Se algo relevante foi aprendido (uma nova decisão de conteúdo, uma armadilha evitada ou um novo procedimento consolidado), crie ou atualize o arquivo markdown curto correspondente nas pastas `decisions/`, `pitfalls/` ou `rules/`.
2.  **Gere o Handoff:** Escreva um resumo terso na pasta `sessions/` contendo:
    *   **O que foi feito nesta sessão;**
    *   **Perguntas em aberto;**
    *   **Próximos passos práticos e objetivos.**
