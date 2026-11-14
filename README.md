# Nova Era 2.0 — reconstrução

Esta é uma reconstrução nova baseada no material que foi possível recuperar do arquivo recebido. **Não é a restauração integral do código original:** o arquivo recebido estava truncado e não continha o núcleo original de conexão com o WhatsApp.

## Recursos implementados

- Conexão via QR Code com WhatsApp (Baileys não oficial).
- Leitura das quatro configurações de grupo recuperadas.
- Prefixo individual por grupo (incluindo `.` e `+` preservados).
- `.menu`, `.status`
- `.abrir` e `.fechar`
- `.ban`, `.promover`, `.rebaixar` (mencione ou responda à pessoa)
- `.antilink on/off`
- `.boasvindas on/off`
- `.figurinha` / `.s` respondendo a imagem ou vídeo curto
- `.audios` e `.audio nome` para os MP3 recuperados
- Persistência das configurações em `data/groups.json`

Comandos administrativos exigem que quem envia seja administrador e que o bot também seja administrador. O bot foi limitado a grupos; não responde conversas privadas.

## Requisitos

- Node.js 20 ou superior
- Internet estável
- Uma conta WhatsApp que você controla
- O bot precisa ser administrador dos grupos para abrir/fechar e moderar participantes

## Instalação em computador ou VPS

1. Extraia o ZIP.
2. Abra um terminal dentro da pasta `Nova_Era_2.0`.
3. Execute:

```bash
npm install
npm run check
npm test
npm start
```

4. Escaneie o QR Code em WhatsApp > Aparelhos conectados > Conectar aparelho.
5. Adicione a conta do bot aos grupos e conceda administrador.

## Android / Termux

É possível tentar executar no Termux, mas sessões longas no Android podem ser encerradas pelo sistema. Para 24 horas contínuas, prefira VPS.

```bash
pkg update
pkg install nodejs-lts git
cd /caminho/da/pasta/Nova_Era_2.0
npm install
npm run check
npm test
npm start
```

## Primeiros testes

Em um grupo de teste onde você e o bot sejam administradores:

- `.menu`
- `.status`
- `.antilink on`
- `.antilink off`
- `.boasvindas on`
- `.boasvindas off`
- `.fechar` e depois `.abrir`
- `.audios`
- `.audio bem`
- Responda uma imagem com `.figurinha`
- Marque um participante de teste com `.promover`, `.rebaixar` ou `.ban`

Faça os testes de moderação somente em grupo de teste e com autorização.

## Segurança

- **Nunca compartilhe `data/auth/`**: contém a sessão vinculada à sua conta.
- Não envie o QR Code a ninguém.
- Faça backup de `data/groups.json` e `data/auth/` em local seguro.
- Use uma conta de teste inicialmente.
- Baileys é uma biblioteca não oficial; mudanças no WhatsApp podem interromper a conexão ou exigir atualização.
- O bot não tem proteção contra todo tipo de spam, golpes ou links maliciosos; o antilink é uma barreira simples.

## O que foi preservado

A pasta `legacy/recovered-files/` guarda os 596 arquivos completos recuperados do ZIP interno, incluindo bibliotecas, scripts, documentação, arquivos de mídia e arquivos históricos. A pasta `legacy/recovery/` contém as configurações originais recuperadas e a cópia parcial do ZIP original. Esses arquivos legados foram preservados como referência e **não são carregados pelo novo núcleo**.

## Limitações conhecidas

- Recursos do sistema antigo que não aparecem nos arquivos recuperados não foram recriados automaticamente.
- Os arquivos de áudio recuperados estão disponíveis por comando; os demais arquivos de imagem/GIF recuperados permanecem preservados na pasta legada.
- Não foi possível validar a conexão real com o WhatsApp nesta sessão, pois isso exige instalar dependências e parear uma conta. A checagem local de sintaxe e estrutura não substitui um teste real de 24 horas.
