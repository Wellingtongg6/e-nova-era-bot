# Hospedar o Nova Era 2.0 sem Termux

O Nova Era é um processo Node.js que mantém uma conexão contínua com o WhatsApp. Ele deve ser hospedado como **worker/serviço em segundo plano**, não como site estático nem como função serverless.

## Opção A — Render (configuração incluída)

1. Crie uma conta no Render e conecte um repositório Git com esta pasta.
2. No painel, escolha **New > Blueprint** e selecione o repositório.
3. O Render lerá `render.yaml` e criará um Background Worker Docker com disco persistente em `/data`.
4. Faça o primeiro deploy e abra os logs do serviço.
5. Quando o QR aparecer nos logs, no celular abra WhatsApp > Aparelhos conectados > Conectar aparelho e escaneie o QR.
6. Aguarde a mensagem de conexão bem-sucedida nos logs.

O arquivo `render.yaml` usa o plano Starter porque o bot precisa permanecer ativo. Plano gratuito que suspende serviços não serve para operação contínua. Confirme o preço e a disponibilidade do plano no painel antes de contratar.

## Opção B — Railway

1. Crie um projeto Railway e faça deploy deste repositório pelo Dockerfile.
2. Adicione um Volume ao serviço e monte-o em `/data`.
3. Configure `DATA_DIR=/data` e `NODE_ENV=production` nas variáveis.
4. Faça deploy e acompanhe os logs para obter o QR Code.
5. Escaneie o QR pelo menu Aparelhos conectados do WhatsApp.

Não deixe o serviço sem volume persistente: a pasta `/data/auth` guarda a sessão e `/data/groups.json` guarda as configurações. Sem volume, um novo deploy pode apagar a sessão e exigir novo pareamento.

## Segurança e operação

- Nunca publique nem envie a pasta `data/auth`, QR Code, `.env` com segredos ou credenciais.
- Use uma conta WhatsApp controlada por você e teste primeiro em um grupo privado.
- O bot precisa ser administrador do grupo para executar ações administrativas.
- A conexão usa Baileys, biblioteca não oficial. O WhatsApp pode derrubar sessões ou exigir novo pareamento.
- Hospedagem não oficial não garante disponibilidade de 100% nem impede bloqueios do WhatsApp.
- Para desligar, use o botão de Stop no painel da hospedagem.

## Verificações antes do deploy

Execute `npm install`, `npm run check` e `npm test` em um ambiente Node.js 20+. Depois do deploy, valide `.menu`, `.status`, `.abrir`, `.fechar`, `.antilink`, `.boasvindas`, `.audios`, `.audio bem` e `.figurinha` em grupo de teste. Teste banimento e promoção apenas com participantes de teste e autorização.

Este pacote prepara a infraestrutura de hospedagem; não substitui o pareamento nem o teste real de conexão de 24 horas.
