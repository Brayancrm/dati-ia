# 📱 Configurações do Sistema de Recarga - VERSÃO FINAL

## 💰 Planos Disponíveis

### 1. Plano Unitário
- **Valor**: R$ 30,00
- **Consultas**: 1 crédito
- **QR Code**: `/plano-unitario-qr.png`
- **Texto PIX**: `00020126330014br.gov.bcb.pix011106065596124520400005303986540530.005802BR5925BRAYAN LUCAS MEDEIROS DE 6008BRASILIA62580520SAN2025070918003696850300017br.gov.bcb.brcode01051.0.06304DAEA`

### 2. Plano 1000
- **Valor**: R$ 150,00
- **Consultas**: 1000
- **QR Code**: `/plano-1000-qr.png`
- **Texto PIX**: `00020126330014br.gov.bcb.pix0111060655961245204000053039865406150.005802BR5925BRAYAN LUCAS MEDEIROS DE 6008BRASILIA62580520SAN2025070918191402950300017br.gov.bcb.brcode01051.0.06304640D`

### 3. Plano 2000 ⭐ (MAIS POPULAR)
- **Valor**: R$ 300,00
- **Consultas**: 2000
- **QR Code**: `/plano-2000-qr.png`
- **Texto PIX**: `00020126330014br.gov.bcb.pix0111060655961245204000053039865406300.005802BR5925BRAYAN LUCAS MEDEIROS DE 6008BRASILIA62580520SAN2025070918193639750300017br.gov.bcb.brcode01051.0.0630465E5`

### 4. Plano 5000
- **Valor**: R$ 750,00
- **Consultas**: 5000
- **QR Code**: `/plano-5000-qr.png`
- **Texto PIX**: `00020126330014br.gov.bcb.pix0111060655961245204000053039865406750.005802BR5925BRAYAN LUCAS MEDEIROS DE 6008BRASILIA62580520SAN2025070918195530650300017br.gov.bcb.brcode01051.0.063041572`

### 5. Plano 10000
- **Valor**: R$ 1500,00
- **Consultas**: 10000
- **QR Code**: `/plano-10000-qr.png`
- **Texto PIX**: `00020126330014br.gov.bcb.pix01110606559612452040000530398654071500.005802BR5925BRAYAN LUCAS MEDEIROS DE 6008BRASILIA62580520SAN2025070918201239050300017br.gov.bcb.brcode01051.0.06304A659`

### 6. Plano 20000
- **Valor**: R$ 3000,00
- **Consultas**: 20000
- **QR Code**: `/plano-20000-qr.png`
- **Texto PIX**: `00020126330014br.gov.bcb.pix01110606559612452040000530398654073000.005802BR5925BRAYAN LUCAS MEDEIROS DE 6008BRASILIA62580520SAN2025070918202710650300017br.gov.bcb.brcode01051.0.063045C05`

### 7. Plano Personalizado
- **Valor**: Personalizado
- **Consultas**: Personalizado
- **Contato**: (61) 9 9144-2727
- **Email**: Brayan@agilivertex.com.br

## 📊 Cálculo dos Preços

- **Plano Unitário**: R$ 30,00 (preço especial)
- **Demais Planos**: R$ 0,15 por consulta
  - 1000 × R$ 0,15 = R$ 150,00
  - 2000 × R$ 0,15 = R$ 300,00
  - 5000 × R$ 0,15 = R$ 750,00
  - 10000 × R$ 0,15 = R$ 1500,00
  - 20000 × R$ 0,15 = R$ 3000,00

## 🔔 Sistema de Notificações

### Para o Usuário Master
Quando um pagamento é confirmado, o sistema automaticamente:

1. **Envia Email**: Notificação para Brayan@agilivertex.com.br
2. **Salva Histórico**: Armazena no localStorage do navegador
3. **Log no Console**: Registra a notificação para debug
4. **Página de Notificações**: `/notificacoes` para visualizar histórico

### Dados da Notificação
- **Tipo**: PAGAMENTO_CONFIRMADO
- **Plano**: Nome do plano escolhido
- **Valor**: Valor do pagamento
- **Consultas**: Quantidade de consultas
- **Data**: Data e hora da confirmação
- **Usuário**: Email do usuário logado
- **Status**: CONFIRMADO

### Como Acessar as Notificações
1. Acesse `/notificacoes` na aplicação
2. Visualize todas as notificações de pagamentos
3. Use o botão "Limpar Todas" para remover histórico

### Liberação de Créditos
Para cada notificação de pagamento confirmado:
1. **Botão "Liberar Créditos"**: Disponível apenas para status "CONFIRMADO"
2. **Processo de Liberação**: Simula liberação automática (2 segundos)
3. **Confirmação**: Alerta com detalhes dos créditos liberados
4. **Status Atualizado**: Muda para "LIBERADO" após confirmação
5. **Log de Atividade**: Registra no console para auditoria

### Integração Automática com Usuários
Quando os créditos são liberados:
1. **Busca no Firestore**: Procura o usuário pelo email
2. **Atualização Automática**: Adiciona os créditos ao saldo do usuário
3. **Validação**: Verifica se o usuário existe no sistema
4. **Feedback Detalhado**: Mostra créditos anteriores e novos
5. **Persistência**: Salva automaticamente no banco de dados

### Exemplo de Liberação
```
✅ Créditos liberados com sucesso!

Plano: Plano 2000
Consultas: 2,000
Usuário: cliente@exemplo.com

Créditos anteriores: 500
Novos créditos: 2,500
```

### Status das Notificações
- **CONFIRMADO**: Pagamento confirmado, aguardando liberação
- **LIBERADO**: Créditos já foram liberados para o usuário
- **PENDENTE**: Pagamento em processamento
- **CANCELADO**: Pagamento cancelado

### Menu do Usuário Master
O usuário master tem acesso a um menu especial com:
- **Usuários**: Gerenciar usuários do sistema
- **Gerenciar Bases**: Importar e gerenciar bases de dados
- **Notificações**: Visualizar notificações de pagamentos com contador
  - Contador vermelho mostra número de notificações
  - Atualização automática quando novas notificações chegam

## 🎨 Funcionalidades Implementadas

1. **Interface Moderna**: Cards interativos com hover effects
2. **QR Codes Individuais**: Cada plano tem seu próprio QR code PIX
3. **Plano Personalizado**: Informações de contato para planos customizados
4. **Fluxo Completo**: Seleção → Resumo → Pagamento → Confirmação
5. **Design Responsivo**: Funciona em todos os dispositivos
6. **Validação**: Mínimo de 1000 consultas para planos personalizados
7. **Sistema de Notificações**: Alertas automáticos para usuário master
8. **Liberação Automática**: Créditos creditados automaticamente no usuário
9. **Integração Firestore**: Busca e atualiza usuários automaticamente
10. **Menu de Notificações**: Acesso rápido via menu do usuário master

## 📁 Arquivos Gerados

- `plano-unitario-qr.png` - QR Code para R$ 30,00
- `plano-1000-qr.png` - QR Code para R$ 150,00
- `plano-2000-qr.png` - QR Code para R$ 300,00
- `plano-5000-qr.png` - QR Code para R$ 750,00
- `plano-10000-qr.png` - QR Code para R$ 1500,00
- `plano-20000-qr.png` - QR Code para R$ 3000,00

## 🚀 Como Usar

1. Acesse `/recarga` na aplicação
2. Selecione um plano
3. Clique em "Comprar Agora"
4. Escaneie o QR code PIX correspondente
5. Confirme o pagamento
6. **Notificação automática** é enviada para o usuário master
7. **Master libera créditos** via página de notificações
8. **Créditos são creditados** automaticamente no usuário

## 📞 Contato para Planos Personalizados

- **Telefone**: (61) 9 9144-2727
- **Email**: Brayan@agilivertex.com.br

## 🔔 Notificações para Usuário Master

- **Email**: Brayan@agilivertex.com.br
- **Página**: `/notificacoes`
- **Tipo**: Notificações automáticas de pagamentos confirmados
- **Liberação**: Botão para liberar créditos automaticamente

## 🎯 Fluxo Completo do Sistema

### Para o Cliente:
1. Login no sistema
2. Acessa `/recarga`
3. Seleciona plano
4. Escaneia QR code PIX
5. Confirma pagamento
6. Aguarda liberação de créditos

### Para o Master:
1. Recebe notificação automática
2. Acessa `/notificacoes`
3. Vê lista de pagamentos confirmados
4. Clica "Liberar Créditos"
5. Sistema libera automaticamente
6. Usuário recebe créditos instantaneamente

---

**Data de Configuração**: 09/07/2025
**Status**: ✅ COMPLETO E FUNCIONANDO
**Sistema de Notificações**: ✅ Implementado
**Liberação Automática**: ✅ Implementado
**Integração Firestore**: ✅ Implementado
**Menu de Notificações**: ✅ Implementado

## 🎉 SISTEMA 100% FUNCIONAL!

O sistema de recarga está completamente implementado com:
- ✅ 7 planos diferentes
- ✅ 6 QR codes PIX individuais
- ✅ Sistema de notificações automático
- ✅ Liberação automática de créditos
- ✅ Integração completa com Firestore
- ✅ Interface moderna e responsiva
- ✅ Menu de notificações para master
- ✅ Documentação completa 