# 🚀 Push Inicial para GitHub - Instruções Rápidas

## ✅ Checklist Pré-Push

Antes de fazer o push, confirme:

- [x] `.gitignore` atualizado (credenciais protegidas)
- [x] `.env` NÃO será enviado (está no .gitignore)
- [x] `.env.example` criado sem credenciais reais
- [x] `README.md` atualizado com documentação completa
- [x] `DEPLOY.md` criado com guia de hospedagem

## 📝 Comandos para Executar

### 1. Verificar Status do Git

```bash
cd "D:\Clientes Agentes\OD Drive\Gerador de orçamento\Principal\projeto"

# Ver arquivos que serão commitados
git status

# Verificar se .env está ignorado (NÃO deve aparecer na lista)
```

### 2. Adicionar Arquivos e Fazer Commit

```bash
# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Verificar novamente o que será commitado
git status

# Criar commit inicial
git commit -m "Initial commit: Gerador de Orçamentos OD Drive

- Aplicação Electron desktop
- Integração com Google Slides/Drive API
- Wizard de 6 etapas para geração de propostas
- Editor de planilha inline
- Sistema de uploads (9 imagens)
- Exportação automática de PDF
"
```

### 3. Conectar ao Repositório GitHub

Você vai criar o repositório no GitHub e me passar o SSH ou HTTPS. Depois execute:

**Opção A: SSH (Recomendado se configurou SSH keys)**

```bash
git remote add origin git@github.com:pedromottanunes/oddrive_orcamento_online.git
```

**Opção B: HTTPS**

```bash
git remote add origin https://github.com/pedromottanunes/oddrive_orcamento_online.git
```

### 4. Fazer Push

```bash
# Push inicial (primeira vez)
git push -u origin main

# Se pedir autenticação HTTPS, use seu token pessoal do GitHub
# (não use senha - tokens podem ser criados em: github.com/settings/tokens)
```

## 🔒 Segurança - Verificação Final

Após o push, acesse o repositório no GitHub e confirme que:

❌ **NÃO deve estar visível:**
- `.env` (com credenciais reais)
- `node_modules/`
- `dist/`
- `tmp/`
- `PARAMETROS SECRETOS/`

✅ **DEVE estar visível:**
- `.env.example` (sem credenciais)
- `.gitignore`
- `README.md`
- `DEPLOY.md`
- Todo o código fonte (`src/`, `main.js`, etc.)

## 🆘 Caso algo dê errado

### Se você commitou o .env por acidente:

```bash
# Remover .env do histórico
git rm --cached .env

# Adicionar ao .gitignore (se ainda não estiver)
echo ".env" >> .gitignore

# Commit da correção
git add .gitignore
git commit -m "Remove .env do repositório"

# Force push (cuidado: reescreve histórico)
git push -f origin main
```

### Se o remote já existe:

```bash
# Ver remotes configurados
git remote -v

# Remover remote incorreto
git remote remove origin

# Adicionar remote correto
git remote add origin git@github.com:pedromottanunes/oddrive_orcamento_online.git
```

## 📱 Próximos Passos Após o Push

1. **Configure o repositório no GitHub:**
   - Defina como Private (se não fez na criação)
   - Adicione descrição: "Gerador de orçamentos OD Drive - Aplicação Electron"
   - Adicione topics: `electron`, `google-slides`, `pdf-generation`

2. **Configure GitHub Secrets** (para CI/CD futuro):
   - Settings → Secrets and variables → Actions
   - Adicione: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.

3. **Proteja a branch main:**
   - Settings → Branches → Add rule
   - Branch name pattern: `main`
   - Enable: "Require pull request before merging"

4. **Escolha plataforma de deploy:**
   - Consulte `DEPLOY.md` para opções detalhadas
   - Railway, Vercel, Heroku, ou VPS próprio

---

## 🎯 Comando Único (se tudo estiver OK)

Se você já criou o repositório no GitHub e está tudo certo:

```bash
cd "D:\Clientes Agentes\OD Drive\Gerador de orçamento\Principal\projeto"
git add .
git commit -m "Initial commit: Gerador de Orçamentos OD Drive"
git remote add origin https://github.com/pedromottanunes/oddrive_orcamento.git
git push -u origin main
```

---

**Quando terminar o push, me avise e podemos prosseguir com o deploy online!** 🚀
