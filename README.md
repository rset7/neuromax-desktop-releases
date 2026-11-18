# Neuromax para macOS

Canal de distribuição do aplicativo Neuromax Local e do Estúdio de aulas Neuromax Aulas.

Os arquivos de instalação ficam em [Releases](https://github.com/rset7/neuromax-desktop-releases/releases). Somente versões assinadas com Developer ID e notarizadas pela Apple são publicadas como estáveis. Consulte os requisitos e as notas de cada versão antes de instalar.

Este repositório contém pacotes públicos, notas de versão e metadados de atualização. Não contém o repositório de desenvolvimento, documentos de aula dos usuários, sessões de estudo ou credenciais.

## Instalação

Baixe o ZIP adequado, descompacte e mova Neuromax Local.app para Aplicativos. As versões Apple Silicon exigem chip Apple M1 ou posterior e macOS 14 ou posterior.

## Atualizações

Nas versões com atualizador, use **Neuromax Local → Atualizações…**. Salve e encerre o Estúdio antes de baixar e instalar. A verificação automática ao abrir é opcional; nenhuma apresentação será reiniciada automaticamente.

Para uso offline, prepare as cenas do acervo enquanto estiver conectado. Materiais locais continuam disponíveis sem conexão. Login, novas buscas e sincronização de estudos dependem dos serviços online e das permissões de sua conta.

## Aulas e compatibilidade

Adicione à aula uma cópia de uma sessão do qBank, de flashcards ou de um artigo da Neuropédia. Depois de importada, a cena e suas imagens ficam disponíveis offline. Respostas, revelações e posição ficam na aula; não alteram o progresso pessoal do acervo. Alterações posteriores no conteúdo original não atualizam automaticamente a cópia.

A partir da 0.7.1, na apresentação os padrões são **B** caneta, **E** borracha, **P** mover, **V** interagir, **S** selecionar e **←/→** navegar. Configure atalhos nas preferências. No editor, essas teclas também funcionam sobre HTML fora de campos editáveis, conforme a configuração de teclas simples; campos mantêm a digitação. O modo de apresentação oculta as barras e permite recolher a lateral.

As aulas com cenas usam o formato **v3**. Guarde uma cópia de suas aulas antes de atualizar e não abra arquivos v3 em versões antigas do aplicativo. A instalação substitui o aplicativo; mantenha os documentos `.nxaula` e os dados de usuário. Não apague esses dados ao reinstalar.

Notas: [0.7.0](notes/0.7.0.md) · [0.7.1](notes/0.7.1.md).

## Manutenção do canal

O feed estável fica em `darwin/arm64/releases.json`. Somente gere uma entrada depois de verificar assinatura Developer ID, aprovação da notarização e o ZIP final. O script calcula tamanho e SHA-256, preserva entradas anteriores e recusa versões repetidas ou regressões; ele **não** valida assinatura, notarização ou disponibilidade do download.

```sh
node build-feed.mjs 0.7.0 /caminho/Neuromax-0.7.0-arm64.zip
```

O terceiro argumento opcional escolhe outro arquivo de saída, útil para revisão local. O nome do ZIP deve ser o mesmo do asset na release GitHub `v<VERSÃO>`. Revise o diff, publique esse ZIP exato na release correspondente e confirme seu download antes de publicar o feed. Não publique hashes fictícios, pacotes de teste ou links para assets ausentes. O script apenas escreve arquivos locais; não cria releases, commits ou uploads.
