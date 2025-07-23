# 🚀 Cloud Functions - Importação em Background

Este documento explica como configurar e fazer deploy das Cloud Functions para processar automaticamente as importações de arquivos em background.

## 📋 Pré-requisitos

1. **Firebase CLI instalado:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Autenticação no Firebase:**
   ```bash
   firebase login
   ```

3. **Projeto Firebase configurado:**
   - Firebase Storage habilitado
   - Firebase Firestore habilitado

## 🛠️ Configuração

### 1. Inicializar Cloud Functions (se ainda não foi feito)

```bash
firebase init functions
```

- Escolha JavaScript
- Instale dependências automaticamente

### 2. Instalar dependências específicas

Entre na pasta `functions` e instale as dependências:

```bash
cd functions
npm install firebase-admin firebase-functions xlsx @google-cloud/storage
```

### 3. Configurar permissões

Certifique-se de que o Firebase Storage tenha as permissões corretas:

```javascript
// Em firebase.rules (Storage)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /importacoes/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deploy

### 1. Deploy das Cloud Functions

```bash
# A partir da raiz do projeto
firebase deploy --only functions
```

### 2. Verificar deploy

Após o deploy, você verá uma mensagem similar a:

```
✔ functions[processarImportacao(us-central1)] Successful create operation.
Function URL: https://us-central1-seu-projeto.cloudfunctions.net/processarImportacao
```

## 🔧 Como funciona

### Fluxo automático:

1. **Upload de arquivo** → API salva no Storage (`importacoes/`)
2. **Cloud Function detecta** → Trigger automático no Storage
3. **Processamento** → Lê Excel/CSV, normaliza dados, salva no Firestore
4. **Status em tempo real** → Atualiza progresso na coleção `importacoes`
5. **Finalização** → Status 'concluída' ou 'erro'

### Recursos da Cloud Function:

- ✅ **Processamento em lotes** (450 registros por batch)
- ✅ **Detecção automática de tipos** (CPF, CNPJ, email, etc.)
- ✅ **Normalização de dados** (formatação de datas, telefones, etc.)
- ✅ **Controle de duplicados** (por chave única)
- ✅ **Progresso em tempo real** (atualização no Firestore)
- ✅ **Tratamento de erros** completo

## 📊 Monitoramento

### 1. Logs das Cloud Functions

```bash
firebase functions:log
```

### 2. Console do Firebase

- Acesse [Firebase Console](https://console.firebase.google.com)
- Vá em **Functions** para ver execuções
- Vá em **Firestore** > `importacoes` para ver status

### 3. Logs específicos da função

```bash
firebase functions:log --only processarImportacao
```

## 🚨 Troubleshooting

### Problema comum 1: Timeout

Se arquivos muito grandes causarem timeout:

```javascript
// Aumentar timeout na função
exports.processarImportacao = functions
  .runWith({ timeoutSeconds: 540, memory: '2GB' })
  .storage.object().onFinalize(async (object) => {
    // ... código da função
  });
```

### Problema comum 2: Permissões

Verifique se a função tem permissão para:
- Ler/escrever no Storage
- Ler/escrever no Firestore

### Problema comum 3: Dependências

Se der erro de módulo não encontrado:

```bash
cd functions
npm install
firebase deploy --only functions
```

## 📈 Performance

- **Arquivos pequenos** (< 1000 registros): ~10-30 segundos
- **Arquivos médios** (1000-10000 registros): ~1-5 minutos  
- **Arquivos grandes** (10000-100000 registros): ~5-30 minutos

## 🎯 Próximos passos

Após o deploy, teste:

1. **Upload de um arquivo** via interface
2. **Verificar logs** da Cloud Function
3. **Acompanhar progresso** na tela `/importacoes`
4. **Confirmar dados** importados no Firestore

---

**✅ Pronto!** As importações agora funcionam completamente em background, liberando a interface para o usuário continuar usando o sistema normalmente. 